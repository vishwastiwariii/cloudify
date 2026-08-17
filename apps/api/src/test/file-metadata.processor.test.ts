import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

vi.mock('@repo/db', () => ({
    default: {
        file: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
    },
    Prisma: {
        DbNull: Symbol('DbNull'),
    },
}))

vi.mock('../infrastructure/storage', () => ({
    storageProvider: {
        getObjectMetaData: vi.fn(),
        downloadObject: vi.fn(),
    },
}))

vi.mock('sharp', () => ({
    default: vi.fn(() => ({
        metadata: vi.fn().mockResolvedValue({
            width: 800,
            height: 600,
            format: 'jpeg',
            hasAlpha: false,
        }),
    })),
}))

import type { Job } from 'bullmq'
import prisma from '@repo/db'
import { storageProvider } from '../infrastructure/storage'
import { processFileMetaData } from '../jobs/file-metadata/file-metadata.processor'
import { FILE_METADATA_JOB_NAME, FILE_METADATA_MAX_IMAGE_BYTES } from '../jobs/file-metadata'
import type { FileMetaDataJobData } from '../jobs/file-metadata/file-metadata.types'

const mockedFindMany = prisma.file.findMany as unknown as Mock
const mockedUpdate = prisma.file.update as unknown as Mock
const mockedGetObjectMetaData = storageProvider.getObjectMetaData as unknown as Mock
const mockedDownloadObject = storageProvider.downloadObject as unknown as Mock

function buildFile(overrides: Record<string, any> = {}) {
    return {
        id: 'file-1',
        storageKey: 'users/user-1/2026/08/photo.jpg',
        mimeType: 'image/jpeg',
        size: 1024n,
        metaData: null,
        ...overrides,
    }
}

function buildJob(data: FileMetaDataJobData = {}) {
    return {
        id: 'job-1',
        name: FILE_METADATA_JOB_NAME,
        timestamp: Date.now(),
        data,
    } as Job<FileMetaDataJobData>
}

describe('processFileMetaData', () => {
    beforeEach(() => {
        mockedFindMany.mockReset()
        mockedUpdate.mockReset()
        mockedGetObjectMetaData.mockReset()
        mockedDownloadObject.mockReset()

        mockedFindMany.mockResolvedValue([])
        mockedUpdate.mockResolvedValue({})
        mockedDownloadObject.mockResolvedValue(Buffer.from('image-bytes'))
        mockedGetObjectMetaData.mockResolvedValue({
            objectKey: 'users/user-1/2026/08/photo.jpg',
            size: 1024,
            contentType: 'image/jpeg',
            md5Hash: 'abc123',
            etag: 'etag-1',
        })
    })

    it('writes extracted metadata and copies the digest into checkSum', async () => {
        mockedFindMany.mockResolvedValue([buildFile()])

        const result = await processFileMetaData(buildJob())

        const data = mockedUpdate.mock.calls[0]?.[0].data

        expect(data.checkSum).toBe('abc123')
        expect(data.metaData).toMatchObject({
            status: 'extracted',
            category: 'image',
            contentType: 'image/jpeg',
            extension: '.jpg',
            sizeBytes: 1024,
        })
        expect(data.metaData.image).toMatchObject({ width: 800, height: 600, format: 'jpeg' })
        expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0 })
    })

    it('does not download an image larger than the inspection ceiling', async () => {
        const oversized = FILE_METADATA_MAX_IMAGE_BYTES + 1

        mockedFindMany.mockResolvedValue([buildFile({ size: BigInt(oversized) })])
        mockedGetObjectMetaData.mockResolvedValue({
            objectKey: 'users/user-1/2026/08/huge.jpg',
            size: oversized,
            contentType: 'image/jpeg',
        })

        const result = await processFileMetaData(buildJob())

        // Still described, just from storage metadata alone.
        expect(mockedDownloadObject).not.toHaveBeenCalled()
        expect(mockedUpdate.mock.calls[0]?.[0].data.metaData).toMatchObject({
            status: 'extracted',
            category: 'image',
        })
        expect(mockedUpdate.mock.calls[0]?.[0].data.metaData.image).toBeUndefined()
        expect(result).toMatchObject({ completed: 1, failed: 0 })
    })

    it.each([
        ['image/png', 'image'],
        ['video/mp4', 'video'],
        ['audio/mpeg', 'audio'],
        ['application/pdf', 'document'],
        ['text/plain', 'document'],
        ['application/zip', 'other'],
    ])('categorises %s as %s', async (contentType, expected) => {
        mockedFindMany.mockResolvedValue([buildFile({ mimeType: contentType })])
        mockedGetObjectMetaData.mockResolvedValue({
            objectKey: 'users/user-1/2026/08/object',
            size: 10,
            contentType,
        })

        await processFileMetaData(buildJob())

        expect(mockedUpdate.mock.calls[0]?.[0].data.metaData.category).toBe(expected)
    })

    it('records a failure marker starting at one attempt', async () => {
        mockedFindMany.mockResolvedValue([buildFile()])
        mockedGetObjectMetaData.mockRejectedValue(new Error('object is gone'))

        const result = await processFileMetaData(buildJob())

        expect(mockedUpdate.mock.calls[0]?.[0].data.metaData).toMatchObject({
            status: 'failed',
            attempts: 1,
            error: 'object is gone',
        })
        expect(result).toMatchObject({ processed: 1, completed: 0, failed: 1 })
    })

    it('increments the attempt count of an earlier failure', async () => {
        mockedFindMany.mockResolvedValue([
            buildFile({ metaData: { status: 'failed', attempts: 2 } }),
        ])
        mockedGetObjectMetaData.mockRejectedValue(new Error('still gone'))

        await processFileMetaData(buildJob())

        expect(mockedUpdate.mock.calls[0]?.[0].data.metaData).toMatchObject({ attempts: 3 })
    })

    it('keeps going when one file in the batch fails', async () => {
        mockedFindMany.mockResolvedValue([
            buildFile({ id: 'file-1' }),
            buildFile({ id: 'file-2' }),
        ])
        mockedGetObjectMetaData
            .mockRejectedValueOnce(new Error('transient'))
            .mockResolvedValueOnce({
                objectKey: 'users/user-1/2026/08/photo.jpg',
                size: 10,
                contentType: 'image/jpeg',
            })

        const result = await processFileMetaData(buildJob())

        expect(result).toMatchObject({ processed: 2, completed: 1, failed: 1 })
    })

    it('does not throw when the failure marker itself cannot be written', async () => {
        mockedFindMany.mockResolvedValue([buildFile()])
        mockedGetObjectMetaData.mockRejectedValue(new Error('object is gone'))
        mockedUpdate.mockRejectedValue(new Error('database unavailable'))

        // The batch result still has to come back, otherwise the whole run is
        // lost to a secondary failure on the error path.
        await expect(processFileMetaData(buildJob())).resolves.toMatchObject({
            processed: 1,
            failed: 1,
        })
    })
})
