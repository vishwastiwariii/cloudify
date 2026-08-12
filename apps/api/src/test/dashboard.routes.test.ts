import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('@repo/db', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
        },
        file: {
            count: vi.fn(),
            findMany: vi.fn(),
            groupBy: vi.fn(),
        },
        folder: {
            count: vi.fn(),
        },
    },
}))

import prisma from '@repo/db'
import app from '../app'
import { AUTH_COOKIE_NAME } from '../modules/auth/auth.constants'

const mockedUserFindUnique = prisma.user.findUnique as unknown as Mock
const mockedFileCount = prisma.file.count as unknown as Mock
const mockedFileFindMany = prisma.file.findMany as unknown as Mock
const mockedFileGroupBy = prisma.file.groupBy as unknown as Mock
const mockedFolderCount = prisma.folder.count as unknown as Mock

function authCookie() {
    const token = jwt.sign({ userId: 'user-1', email: 'test@example.com' }, 'test-jwt-secret', { expiresIn: '7d' })
    return `${AUTH_COOKIE_NAME}=${token}`
}

function buildUser(overrides: Record<string, any> = {}) {
    return {
        id: 'user-1',
        email: 'test@example.com',
        username: null,
        password: 'hashed-password',
        name: 'Test User',
        isVerified: true,
        verifiedAt: null,
        storageLimit: 1000n,
        storageUsed: 250n,
        deletedAt: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ...overrides,
    }
}

function mimeGroup(mimeType: string, files: number, size: bigint) {
    return { mimeType, _count: { _all: files }, _sum: { size } }
}

async function getDashboard() {
    return request(app).get('/dashboard').set('Cookie', authCookie())
}

beforeEach(() => {
    mockedUserFindUnique.mockReset()
    mockedFileCount.mockReset()
    mockedFileFindMany.mockReset()
    mockedFileGroupBy.mockReset()
    mockedFolderCount.mockReset()

    mockedUserFindUnique.mockResolvedValue(buildUser())
    mockedFileCount.mockResolvedValue(7)
    mockedFolderCount.mockResolvedValue(3)
    mockedFileFindMany.mockResolvedValue([])
    mockedFileGroupBy.mockResolvedValue([])
})

describe('GET /dashboard', () => {
    it('rejects an unauthenticated request', async () => {
        const res = await request(app).get('/dashboard')

        // Raised by authMiddleware, so this one is shaped by errorHandler.
        expect(res.status).toBe(401)
        expect(res.body.message).toBe('Authentication Required')
        expect(mockedFileGroupBy).not.toHaveBeenCalled()
    })

    it('responds instead of hanging, with the full payload shape', async () => {
        const res = await getDashboard()

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(Object.keys(res.body.data).sort()).toEqual(['fileType', 'recentFiles', 'statistics', 'storage'])
    })

    it('404s when the user row is gone rather than 500ing', async () => {
        // authMiddleware resolves the user first; getStorage does the second lookup.
        mockedUserFindUnique.mockResolvedValueOnce(buildUser()).mockResolvedValue(null)

        const res = await getDashboard()

        expect(res.status).toBe(404)
        expect(res.body).toMatchObject({ success: false, message: 'User not found' })
    })

    it('reports storage with BigInt fields serialized and a correct percentage', async () => {
        const res = await getDashboard()

        expect(res.body.data.storage).toEqual({
            used: '250',
            limit: '1000',
            available: '750',
            percentage: 25,
        })
    })

    it('keeps two decimal places of percent', async () => {
        mockedUserFindUnique.mockResolvedValue(buildUser({ storageUsed: 1n, storageLimit: 3n }))

        const res = await getDashboard()

        expect(res.body.data.storage.percentage).toBe(33.33)
    })

    it('does not divide by zero on a zero storage limit', async () => {
        mockedUserFindUnique.mockResolvedValue(buildUser({ storageUsed: 0n, storageLimit: 0n }))

        const res = await getDashboard()

        expect(res.status).toBe(200)
        expect(res.body.data.storage).toMatchObject({ percentage: 0, available: '0' })
    })

    it('clamps available to zero when the user is over quota', async () => {
        mockedUserFindUnique.mockResolvedValue(buildUser({ storageUsed: 1500n, storageLimit: 1000n }))

        const res = await getDashboard()

        expect(res.body.data.storage.available).toBe('0')
        expect(res.body.data.storage.percentage).toBe(150)
    })

    it('counts only the caller´s live files and folders', async () => {
        const res = await getDashboard()

        expect(mockedFileCount.mock.calls[0]![0].where).toEqual({ ownerId: 'user-1', deletedAt: null })
        expect(mockedFolderCount.mock.calls[0]![0].where).toEqual({ ownerId: 'user-1', deletedAt: null })
        expect(res.body.data.statistics).toEqual({ files: 7, folder: 3 })
    })

    it('returns the newest files first, capped at 10, with size as a string', async () => {
        mockedFileFindMany.mockResolvedValue([
            {
                id: 'file-1',
                name: 'report.pdf',
                mimeType: 'application/pdf',
                size: 2048n,
                folderId: null,
                createdAt: new Date('2026-02-01'),
                updatedAt: new Date('2026-02-02'),
            },
        ])

        const res = await getDashboard()

        expect(mockedFileFindMany.mock.calls[0]![0]).toMatchObject({
            where: { ownerId: 'user-1', deletedAt: null },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        })
        expect(res.body.data.recentFiles[0]).toMatchObject({ id: 'file-1', size: '2048' })
    })

    it('collapses distinct mime types into one bucket per category', async () => {
        mockedFileGroupBy.mockResolvedValue([
            mimeGroup('image/png', 2, 100n),
            mimeGroup('image/jpeg', 3, 200n),
            mimeGroup('application/pdf', 1, 50n),
            mimeGroup('text/plain', 4, 25n),
        ])

        const res = await getDashboard()

        const byType = Object.fromEntries(res.body.data.fileType.map((g: any) => [g.type, g]))

        expect(Object.keys(byType).sort()).toEqual(['document', 'image'])
        expect(byType.image).toEqual({ type: 'image', files: 5, size: '300' })
        expect(byType.document).toEqual({ type: 'document', files: 5, size: '75' })
    })

    it('classifies every category from its mime type', async () => {
        mockedFileGroupBy.mockResolvedValue([
            mimeGroup('image/png', 1, 1n),
            mimeGroup('video/mp4', 1, 1n),
            mimeGroup('audio/mpeg', 1, 1n),
            mimeGroup('application/vnd.oasis.opendocument.spreadsheet', 1, 1n),
            mimeGroup('application/zip', 1, 1n),
            mimeGroup('application/octet-stream', 1, 1n),
        ])

        const res = await getDashboard()

        expect(res.body.data.fileType.map((g: any) => g.type).sort()).toEqual([
            'archive',
            'audio',
            'document',
            'image',
            'other',
            'video',
        ])
    })

    it('tolerates a null size sum from the group query', async () => {
        mockedFileGroupBy.mockResolvedValue([{ mimeType: 'image/png', _count: { _all: 0 }, _sum: { size: null } }])

        const res = await getDashboard()

        expect(res.status).toBe(200)
        expect(res.body.data.fileType[0]).toEqual({ type: 'image', files: 0, size: '0' })
    })

    it('groups in the database, not by loading every file row', async () => {
        await getDashboard()

        expect(mockedFileGroupBy).toHaveBeenCalledWith(
            expect.objectContaining({
                by: ['mimeType'],
                where: { ownerId: 'user-1', deletedAt: null },
            })
        )
    })

    it('returns an empty-but-valid dashboard for a brand new account', async () => {
        mockedUserFindUnique.mockResolvedValue(buildUser({ storageUsed: 0n, storageLimit: 1000n }))
        mockedFileCount.mockResolvedValue(0)
        mockedFolderCount.mockResolvedValue(0)

        const res = await getDashboard()

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            statistics: { files: 0, folder: 0 },
            recentFiles: [],
            fileType: [],
            storage: { used: '0', percentage: 0 },
        })
    })
})
