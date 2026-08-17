// End-to-end check: real Postgres, real Redis, real BullMQ queue + worker, real
// sharp. Only the bucket is stubbed, so nothing touches live GCS.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, type Mock } from 'vitest'

vi.mock('../infrastructure/storage', () => ({
    storageProvider: {
        getObjectMetaData: vi.fn(),
        downloadObject: vi.fn(),
    },
}))

import sharp from 'sharp'
import prisma from '@repo/db'
import { storageProvider } from '../infrastructure/storage'
import { fileMetaDataQueue, closeQueues } from '../infrastructure/queue'
import { fileMetaDataWorker } from '../workers/file-metadata.worker'
import { registerFileMetaDataScheduler } from '../jobs/file-metadata/scheduler'
import {
    enqueueFileMetaData,
    FILE_METADATA_MAX_ATTEMPTS,
    FILE_METADATA_SCHEDULER_ID,
} from '../jobs/file-metadata'

const mockedGetObjectMetaData = storageProvider.getObjectMetaData as unknown as Mock
const mockedDownloadObject = storageProvider.downloadObject as unknown as Mock

// Namespaced so the run only ever reads or deletes its own rows.
const RUN = `e2e-${Date.now()}`

let ownerId: string
let pngBytes: Buffer

function keyFor(name: string) {
    return `users/${RUN}/2026/08/${name}`
}

async function createFile(name: string, overrides: Record<string, any> = {}) {
    return prisma.file.create({
        data: {
            ownerId,
            name,
            originalName: name,
            storageKey: keyFor(name),
            bucket: 'test-bucket',
            mimeType: 'image/png',
            size: BigInt(pngBytes.length),
            ...overrides,
        },
    })
}

async function runJobToCompletion() {
    const job = await enqueueFileMetaData()

    for (let attempt = 0; attempt < 120; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 250))

        const fresh = await fileMetaDataQueue.getJob(job.id!)

        if (fresh && (await fresh.isCompleted())) {
            return fresh.returnvalue
        }

        if (fresh && (await fresh.isFailed())) {
            throw new Error(`job failed: ${fresh.failedReason}`)
        }
    }

    throw new Error('job never finished')
}

describe('file metadata pipeline (end to end)', () => {
    beforeAll(async () => {
        // A genuine 120x80 PNG, so sharp parses real bytes rather than a fixture.
        pngBytes = await sharp({
            create: { width: 120, height: 80, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 1 } },
        }).png().toBuffer()

        const owner = await prisma.user.create({
            data: {
                email: `${RUN}@example.com`,
                name: 'E2E Owner',
                password: 'hashed',
            },
        })

        ownerId = owner.id

        await fileMetaDataWorker.waitUntilReady()
    }, 60000)

    afterAll(async () => {
        await fileMetaDataWorker.close()
        await fileMetaDataQueue.obliterate({ force: true })
        await closeQueues()

        if (ownerId) {
            await prisma.file.deleteMany({ where: { ownerId } })
            await prisma.user.delete({ where: { id: ownerId } })
        }

        await prisma.$disconnect()
    }, 60000)

    beforeEach(async () => {
        await prisma.file.deleteMany({ where: { ownerId } })

        mockedGetObjectMetaData.mockReset()
        mockedDownloadObject.mockReset()

        mockedGetObjectMetaData.mockImplementation(async (objectKey: string) => ({
            objectKey,
            size: pngBytes.length,
            contentType: 'image/png',
            md5Hash: 'md5-of-png',
            etag: 'etag-123',
        }))

        mockedDownloadObject.mockResolvedValue(pngBytes)
    })

    it('extracts image dimensions and fills checkSum', async () => {
        const file = await createFile('photo.png')

        const result = await runJobToCompletion()

        expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0 })

        const stored = await prisma.file.findUniqueOrThrow({ where: { id: file.id } })
        const metaData = stored.metaData as any

        expect(metaData).toMatchObject({
            status: 'extracted',
            category: 'image',
            contentType: 'image/png',
            sizeBytes: pngBytes.length,
            extension: '.png',
            md5Hash: 'md5-of-png',
            etag: 'etag-123',
        })
        // Real dimensions, read by sharp from the real bytes.
        expect(metaData.image).toMatchObject({ width: 120, height: 80, format: 'png', hasAlpha: true })
        expect(stored.checkSum).toBe('md5-of-png')
    }, 60000)

    it('describes a non-image without downloading its bytes', async () => {
        mockedGetObjectMetaData.mockImplementation(async (objectKey: string) => ({
            objectKey,
            size: 4096,
            contentType: 'application/pdf',
            md5Hash: 'md5-of-pdf',
        }))

        const file = await createFile('report.pdf', { mimeType: 'application/pdf', size: BigInt(4096) })

        const result = await runJobToCompletion()

        expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0 })

        const stored = await prisma.file.findUniqueOrThrow({ where: { id: file.id } })
        const metaData = stored.metaData as any

        expect(metaData).toMatchObject({ status: 'extracted', category: 'document' })
        expect(metaData.image).toBeUndefined()
        expect(mockedDownloadObject).not.toHaveBeenCalled()
    }, 60000)

    it('records a bounded failure marker and stops retrying at the cap', async () => {
        mockedGetObjectMetaData.mockRejectedValue(new Error('object is gone'))

        const file = await createFile('broken.png')

        // Each run is one more attempt, until the budget is spent.
        for (let attempt = 1; attempt <= FILE_METADATA_MAX_ATTEMPTS; attempt++) {
            const result = await runJobToCompletion()

            expect(result).toMatchObject({ processed: 1, completed: 0, failed: 1 })

            const stored = await prisma.file.findUniqueOrThrow({ where: { id: file.id } })

            expect(stored.metaData).toMatchObject({
                status: 'failed',
                attempts: attempt,
                error: 'object is gone',
            })
        }

        // Budget spent: the scan must no longer see it, or it would starve the
        // batch forever.
        const afterCap = await runJobToCompletion()

        expect(afterCap).toMatchObject({ processed: 0, completed: 0, failed: 0 })
    }, 120000)

    it('recovers a previously failed file once the object is readable again', async () => {
        mockedGetObjectMetaData.mockRejectedValueOnce(new Error('transient blip'))

        const file = await createFile('flaky.png')

        await runJobToCompletion()

        expect(await prisma.file.findUniqueOrThrow({ where: { id: file.id } }))
            .toMatchObject({ metaData: { status: 'failed', attempts: 1 } })

        const result = await runJobToCompletion()

        expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0 })

        const stored = await prisma.file.findUniqueOrThrow({ where: { id: file.id } })

        expect((stored.metaData as any).status).toBe('extracted')
    }, 60000)

    it('skips files that are soft deleted or already described', async () => {
        await createFile('trashed.png', { deletedAt: new Date() })
        await createFile('done.png', { metaData: { status: 'extracted', extractedAt: 'earlier' } })

        const result = await runJobToCompletion()

        expect(result).toMatchObject({ processed: 0, completed: 0, failed: 0 })

        const done = await prisma.file.findUniqueOrThrow({ where: { storageKey: keyFor('done.png') } })

        // Untouched, not re-extracted.
        expect((done.metaData as any).extractedAt).toBe('earlier')
    }, 60000)

    it('registers a repeatable scheduler', async () => {
        await registerFileMetaDataScheduler()

        const schedulers = await fileMetaDataQueue.getJobSchedulers()

        expect(schedulers.map((scheduler) => scheduler.key)).toContain(FILE_METADATA_SCHEDULER_ID)
    }, 60000)
})
