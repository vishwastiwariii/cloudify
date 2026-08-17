import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

vi.mock('@repo/db', () => ({
    default: {
        file: {
            findMany: vi.fn(),
        },
        uploadSession: {
            findMany: vi.fn(),
        },
    },
}))

vi.mock('../infrastructure/storage', () => ({
    storageProvider: {
        listObjects: vi.fn(),
        deleteObject: vi.fn(),
    },
}))

vi.mock('../infrastructure/queue', () => ({
    gcsCleanUpQueue: {
        add: vi.fn(),
    },
}))

import type { Job } from 'bullmq'
import prisma from '@repo/db'
import { storageProvider } from '../infrastructure/storage'
import { gcsCleanUpQueue } from '../infrastructure/queue'
import { processGcsCleanUp } from '../jobs/gcs-cleanup/gcs-cleanup.processor'
import { GCS_CLEANUP_JOB_NAME, GCS_CLEANUP_MIN_OBJECT_AGE } from '../jobs/gcs-cleanup'
import type { GcsCleanUpJobData } from '../jobs/gcs-cleanup/gcs-cleanup.types'

const mockedFileFindMany = prisma.file.findMany as unknown as Mock
const mockedSessionFindMany = prisma.uploadSession.findMany as unknown as Mock
const mockedListObjects = storageProvider.listObjects as unknown as Mock
const mockedDeleteObject = storageProvider.deleteObject as unknown as Mock
const mockedQueueAdd = gcsCleanUpQueue.add as unknown as Mock

// Comfortably past GCS_CLEANUP_MIN_OBJECT_AGE, so age never decides a case that
// is meant to be decided by ownership.
const OLD = new Date(Date.now() - GCS_CLEANUP_MIN_OBJECT_AGE - 60 * 60 * 1000)

function buildObject(objectKey: string, createdAt: Date = OLD) {
    return {
        objectKey,
        size: 1024,
        createdAt,
    }
}

// A listing entry the bucket gave no creation time for.
function buildUndatedObject(objectKey: string) {
    return {
        objectKey,
        size: 1024,
    }
}

function buildJob(data: GcsCleanUpJobData = {}) {
    return {
        id: 'job-1',
        name: GCS_CLEANUP_JOB_NAME,
        timestamp: Date.now(),
        data,
    } as Job<GcsCleanUpJobData>
}

describe('processGcsCleanUp', () => {
    beforeEach(() => {
        mockedFileFindMany.mockReset()
        mockedSessionFindMany.mockReset()
        mockedListObjects.mockReset()
        mockedDeleteObject.mockReset()
        mockedQueueAdd.mockReset()

        mockedFileFindMany.mockResolvedValue([])
        mockedSessionFindMany.mockResolvedValue([])
        mockedDeleteObject.mockResolvedValue(undefined)
        mockedQueueAdd.mockResolvedValue({ id: 'job-2' })
        mockedListObjects.mockResolvedValue({ objects: [] })
    })

    it('deletes an object that no file and no active session claims', async () => {
        mockedListObjects.mockResolvedValue({
            objects: [buildObject('users/user-1/2026/08/orphan.png')],
        })

        const result = await processGcsCleanUp(buildJob())

        expect(mockedDeleteObject).toHaveBeenCalledExactlyOnceWith(
            'users/user-1/2026/08/orphan.png'
        )
        expect(result).toMatchObject({ processed: 1, cleaned: 1, skipped: 0, failed: 0 })
    })

    it('keeps an object owned by a file row', async () => {
        mockedListObjects.mockResolvedValue({
            objects: [buildObject('users/user-1/2026/08/kept.png')],
        })
        mockedFileFindMany.mockResolvedValue([
            { storageKey: 'users/user-1/2026/08/kept.png' },
        ])

        const result = await processGcsCleanUp(buildJob())

        expect(mockedDeleteObject).not.toHaveBeenCalled()
        expect(result).toMatchObject({ cleaned: 0, skipped: 1 })
    })

    it('keeps an object whose file row is only trashed', async () => {
        mockedListObjects.mockResolvedValue({
            objects: [buildObject('users/user-1/2026/08/trashed.png')],
        })

        // The lookup must not filter on deletedAt, so a trashed file still
        // answers the query and keeps its object.
        mockedFileFindMany.mockResolvedValue([
            { storageKey: 'users/user-1/2026/08/trashed.png' },
        ])

        await processGcsCleanUp(buildJob())

        expect(mockedFileFindMany.mock.calls[0]?.[0].where).toEqual({
            storageKey: { in: ['users/user-1/2026/08/trashed.png'] },
        })
        expect(mockedDeleteObject).not.toHaveBeenCalled()
    })

    it('keeps an object held by an active upload session', async () => {
        mockedListObjects.mockResolvedValue({
            objects: [buildObject('users/user-1/2026/08/in-flight.png')],
        })
        mockedSessionFindMany.mockResolvedValue([
            { objectKey: 'users/user-1/2026/08/in-flight.png' },
        ])

        const result = await processGcsCleanUp(buildJob())

        expect(mockedSessionFindMany.mock.calls[0]?.[0].where).toMatchObject({
            status: 'PENDING',
            expiresAt: { gt: expect.any(Date) },
        })
        expect(mockedDeleteObject).not.toHaveBeenCalled()
        expect(result).toMatchObject({ cleaned: 0, skipped: 1 })
    })

    it('holds back an object younger than the minimum age', async () => {
        mockedListObjects.mockResolvedValue({
            objects: [buildObject('users/user-1/2026/08/fresh.png', new Date())],
        })

        const result = await processGcsCleanUp(buildJob())

        // Too new to judge, so it never reaches the ownership lookup.
        expect(mockedFileFindMany).not.toHaveBeenCalled()
        expect(mockedDeleteObject).not.toHaveBeenCalled()
        expect(result).toMatchObject({ processed: 1, cleaned: 0, skipped: 1 })
    })

    it('holds back an object with no creation time', async () => {
        mockedListObjects.mockResolvedValue({
            objects: [buildUndatedObject('users/user-1/2026/08/unknown-age.png')],
        })

        const result = await processGcsCleanUp(buildJob())

        expect(mockedDeleteObject).not.toHaveBeenCalled()
        expect(result).toMatchObject({ cleaned: 0, skipped: 1 })
    })

    it('continues the page after a failed delete', async () => {
        mockedListObjects.mockResolvedValue({
            objects: [
                buildObject('users/user-1/2026/08/a.png'),
                buildObject('users/user-1/2026/08/b.png'),
            ],
        })
        mockedDeleteObject
            .mockRejectedValueOnce(new Error('gcs unavailable'))
            .mockResolvedValueOnce(undefined)

        const result = await processGcsCleanUp(buildJob())

        expect(mockedDeleteObject).toHaveBeenCalledTimes(2)
        expect(result).toMatchObject({ processed: 2, cleaned: 1, failed: 1 })
    })

    it('hands the next page to a follow-up job', async () => {
        mockedListObjects.mockResolvedValue({
            objects: [buildObject('users/user-1/2026/08/a.png')],
            nextPageToken: 'page-2',
        })

        const result = await processGcsCleanUp(buildJob())

        expect(mockedQueueAdd).toHaveBeenCalledExactlyOnceWith(
            GCS_CLEANUP_JOB_NAME,
            expect.objectContaining({ pageToken: 'page-2' })
        )
        expect(result.nextPageToken).toBe('page-2')
    })

    it('resumes from the page token it was given and stops when the listing ends', async () => {
        mockedListObjects.mockResolvedValue({ objects: [] })

        const result = await processGcsCleanUp(buildJob({ pageToken: 'page-2' }))

        expect(mockedListObjects.mock.calls[0]?.[0]).toMatchObject({ pageToken: 'page-2' })
        expect(mockedQueueAdd).not.toHaveBeenCalled()
        expect(result).toMatchObject({ processed: 0, cleaned: 0, failed: 0 })
    })
})
