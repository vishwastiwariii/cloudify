import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('@repo/db', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
        },
        file: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
        $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    },
}))

import prisma from '@repo/db'
import app from '../app'
import { AUTH_COOKIE_NAME } from '../modules/auth/auth.constants'

const mockedUserFindUnique = prisma.user.findUnique as unknown as Mock
const mockedFileFindMany = prisma.file.findMany as unknown as Mock
const mockedFileCount = prisma.file.count as unknown as Mock

const FOLDER_ID = 'clh1234567890abcdefghijk'

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
        storageLimit: 2147483648n,
        storageUsed: 0n,
        deletedAt: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ...overrides,
    }
}

function buildFile(overrides: Record<string, any> = {}) {
    return {
        id: 'file-1',
        name: 'report.pdf',
        mimeType: 'application/pdf',
        size: 2048n,
        folderId: FOLDER_ID,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-02'),
        ...overrides,
    }
}

/** The args prisma.file.findMany was actually called with. */
function findManyArgs() {
    return mockedFileFindMany.mock.calls[0]![0]
}

beforeEach(() => {
    mockedUserFindUnique.mockReset()
    mockedFileFindMany.mockReset()
    mockedFileCount.mockReset()

    mockedUserFindUnique.mockResolvedValue(buildUser())
    mockedFileFindMany.mockResolvedValue([buildFile()])
    mockedFileCount.mockResolvedValue(1)
})

describe('GET /search', () => {
    it('rejects an unauthenticated request', async () => {
        const res = await request(app).get('/search')

        expect(res.status).toBe(401)
        expect(mockedFileFindMany).not.toHaveBeenCalled()
    })

    it('returns results and serializes BigInt size as a string', async () => {
        const res = await request(app).get('/search').set('Cookie', authCookie())

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.items).toEqual([
            {
                id: 'file-1',
                name: 'report.pdf',
                mimeType: 'application/pdf',
                size: '2048',
                folderId: FOLDER_ID,
                createdAt: '2026-02-01T00:00:00.000Z',
                updatedAt: '2026-02-02T00:00:00.000Z',
            },
        ])
    })

    it('applies schema defaults to the query it sends to prisma', async () => {
        await request(app).get('/search').set('Cookie', authCookie())

        expect(findManyArgs()).toMatchObject({
            where: { ownerId: 'user-1', deletedAt: null },
            orderBy: { createdAt: 'desc' },
            skip: 0,
            take: 20,
        })
    })

    it('scopes every search to the caller and excludes trash', async () => {
        await request(app).get('/search?q=report&folderId=' + FOLDER_ID).set('Cookie', authCookie())

        const { where } = findManyArgs()
        expect(where.ownerId).toBe('user-1')
        expect(where.deletedAt).toBeNull()
    })

    it('translates q into a case-insensitive contains filter', async () => {
        await request(app).get('/search?q=%20Report%20').set('Cookie', authCookie())

        expect(findManyArgs().where.name).toEqual({ contains: 'Report', mode: 'insensitive' })
    })

    it('translates size bounds into BigInt gte/lte', async () => {
        await request(app).get('/search?minSize=100&maxSize=5000').set('Cookie', authCookie())

        expect(findManyArgs().where.size).toEqual({ gte: 100n, lte: 5000n })
    })

    it('translates from/to into a createdAt range', async () => {
        await request(app)
            .get('/search?from=2026-01-01T00:00:00Z&to=2026-03-01T00:00:00Z')
            .set('Cookie', authCookie())

        expect(findManyArgs().where.createdAt).toEqual({
            gte: new Date('2026-01-01T00:00:00Z'),
            lte: new Date('2026-03-01T00:00:00Z'),
        })
    })

    it('passes folderId and mimeType through', async () => {
        await request(app)
            .get(`/search?folderId=${FOLDER_ID}&mimeType=application/pdf`)
            .set('Cookie', authCookie())

        expect(findManyArgs().where).toMatchObject({ folderId: FOLDER_ID, mimeType: 'application/pdf' })
    })

    it('omits filters that were not supplied', async () => {
        await request(app).get('/search').set('Cookie', authCookie())

        const { where } = findManyArgs()
        expect(where).not.toHaveProperty('name')
        expect(where).not.toHaveProperty('size')
        expect(where).not.toHaveProperty('createdAt')
        expect(where).not.toHaveProperty('folderId')
        expect(where).not.toHaveProperty('mimeType')
    })

    it('honours sortBy/sortOrder and paginates', async () => {
        mockedFileCount.mockResolvedValue(45)

        const res = await request(app)
            .get('/search?page=3&limit=10&sortBy=size&sortOrder=asc')
            .set('Cookie', authCookie())

        expect(findManyArgs()).toMatchObject({ orderBy: { size: 'asc' }, skip: 20, take: 10 })
        expect(res.body.data.pagination).toEqual({ page: 3, limit: 10, total: 45, totalPages: 5 })
    })

    it('counts with the same where clause it queries with', async () => {
        await request(app).get('/search?q=report').set('Cookie', authCookie())

        expect(mockedFileCount.mock.calls[0]![0].where).toEqual(findManyArgs().where)
    })

    it('returns an empty page rather than failing when nothing matches', async () => {
        mockedFileFindMany.mockResolvedValue([])
        mockedFileCount.mockResolvedValue(0)

        const res = await request(app).get('/search?q=nothing').set('Cookie', authCookie())

        expect(res.status).toBe(200)
        expect(res.body.data.items).toEqual([])
        expect(res.body.data.pagination).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 })
    })

    it('rejects invalid input with a 400 and never hits the database', async () => {
        for (const qs of ['minSize=abc', 'page=0', 'limit=101', 'sortBy=password', 'folderId=nope', 'minSize=100&maxSize=10']) {
            mockedFileFindMany.mockClear()

            const res = await request(app).get(`/search?${qs}`).set('Cookie', authCookie())

            expect(res.status, qs).toBe(400)
            expect(res.body.success, qs).toBe(false)
            expect(Array.isArray(res.body.errors), qs).toBe(true)
            expect(mockedFileFindMany, qs).not.toHaveBeenCalled()
        }
    })
})
