import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('@repo/db', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
        },
        file: {
            findFirst: vi.fn(),
        },
        publicShare: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}))

vi.mock('../infrastructure/storage', () => ({
    storageProvider: {
        objectExists: vi.fn(),
        generateSignedDownloadUrl: vi.fn(),
    },
}))

import prisma from '@repo/db'
import { storageProvider } from '../infrastructure/storage'
import app from '../app'
import { AUTH_COOKIE_NAME } from '../modules/auth/auth.constants'

const mockedUserFindUnique = prisma.user.findUnique as unknown as Mock
const mockedFileFindFirst = prisma.file.findFirst as unknown as Mock
const mockedShareFindUnique = prisma.publicShare.findUnique as unknown as Mock
const mockedShareCreate = prisma.publicShare.create as unknown as Mock
const mockedShareUpdate = prisma.publicShare.update as unknown as Mock
const mockedObjectExists = storageProvider.objectExists as unknown as Mock
const mockedSignedUrl = storageProvider.generateSignedDownloadUrl as unknown as Mock

const FILE_ID = 'clh1234567890abcdefghijk'
const TOKEN = 'a'.repeat(43)

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

function buildShare(overrides: Record<string, any> = {}) {
    return {
        id: 'share-1',
        fileId: FILE_ID,
        token: TOKEN,
        passwordHash: null,
        expiresAt: null,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ...overrides,
    }
}

beforeEach(() => {
    mockedUserFindUnique.mockReset()
    mockedFileFindFirst.mockReset()
    mockedShareFindUnique.mockReset()
    mockedShareCreate.mockReset()
    mockedShareUpdate.mockReset()
    mockedObjectExists.mockReset()
    mockedSignedUrl.mockReset()

    mockedUserFindUnique.mockResolvedValue(buildUser())
    mockedFileFindFirst.mockResolvedValue({ id: FILE_ID, ownerId: 'user-1', deletedAt: null })
    mockedShareCreate.mockImplementation(async ({ data }: any) => buildShare(data))
    mockedObjectExists.mockResolvedValue(true)
    mockedSignedUrl.mockResolvedValue('https://storage.example.com/signed')
})

describe('POST /files/:fileId/share', () => {
    it('creates a share link for the owner', async () => {
        mockedShareFindUnique.mockResolvedValue(null)

        const res = await request(app)
            .post(`/files/${FILE_ID}/share`)
            .set('Cookie', authCookie())
            .send({})

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.message).toBe('Share link created successfully')
        expect(res.body.data.shareUrl).toContain('/s/')
        expect(res.body.data).not.toHaveProperty('passwordHash')
    })

    it('accepts a password and a future expiry', async () => {
        mockedShareFindUnique.mockResolvedValue(null)
        const expiresAt = new Date(Date.now() + 86_400_000).toISOString()

        const res = await request(app)
            .post(`/files/${FILE_ID}/share`)
            .set('Cookie', authCookie())
            .send({ password: 'secret123', expiresAt })

        expect(res.status).toBe(200)
        expect(res.body.data.hasPassword).toBe(true)
        expect(mockedShareCreate.mock.calls[0]![0].data.expiresAt).toBeInstanceOf(Date)
    })

    it('returns 401 without an auth cookie', async () => {
        const res = await request(app).post(`/files/${FILE_ID}/share`).send({})

        expect(res.status).toBe(401)
        expect(mockedShareCreate).not.toHaveBeenCalled()
    })

    it('returns 400 for a non-cuid fileId', async () => {
        const res = await request(app)
            .post('/files/not-a-cuid/share')
            .set('Cookie', authCookie())
            .send({})

        expect(res.status).toBe(400)
        expect(res.body.errors).toBeDefined()
    })

    it('returns 400 for a short password', async () => {
        const res = await request(app)
            .post(`/files/${FILE_ID}/share`)
            .set('Cookie', authCookie())
            .send({ password: 'abc' })

        expect(res.status).toBe(400)
    })

    it('returns 400 for an expiry in the past', async () => {
        const res = await request(app)
            .post(`/files/${FILE_ID}/share`)
            .set('Cookie', authCookie())
            .send({ expiresAt: new Date(Date.now() - 1000).toISOString() })

        expect(res.status).toBe(400)
    })

    it('returns 409 when the file is already shared', async () => {
        mockedShareFindUnique.mockResolvedValue(buildShare())

        const res = await request(app)
            .post(`/files/${FILE_ID}/share`)
            .set('Cookie', authCookie())
            .send({})

        expect(res.status).toBe(409)
    })

    it('returns 404 when the file is not the callers', async () => {
        mockedFileFindFirst.mockResolvedValue(null)

        const res = await request(app)
            .post(`/files/${FILE_ID}/share`)
            .set('Cookie', authCookie())
            .send({})

        expect(res.status).toBe(404)
    })
})

describe('GET /files/:fileId/share', () => {
    it('returns the share for the owner', async () => {
        mockedShareFindUnique.mockResolvedValue(buildShare({ passwordHash: 'hashed' }))

        const res = await request(app).get(`/files/${FILE_ID}/share`).set('Cookie', authCookie())

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({ id: 'share-1', hasPassword: true, isActive: true })
        expect(res.body.data).not.toHaveProperty('passwordHash')
    })

    it('returns 404 when the file has no share', async () => {
        mockedShareFindUnique.mockResolvedValue(null)

        const res = await request(app).get(`/files/${FILE_ID}/share`).set('Cookie', authCookie())

        expect(res.status).toBe(404)
    })

    it('returns 401 without an auth cookie', async () => {
        const res = await request(app).get(`/files/${FILE_ID}/share`)

        expect(res.status).toBe(401)
    })
})

describe('DELETE /files/:fileId/share', () => {
    it('disables the share', async () => {
        mockedShareFindUnique.mockResolvedValue(buildShare())

        const res = await request(app).delete(`/files/${FILE_ID}/share`).set('Cookie', authCookie())

        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Share link disabled successfully')
        expect(mockedShareUpdate).toHaveBeenCalledWith({
            where: { id: 'share-1' },
            data: { isActive: false },
        })
    })

    it('returns 401 without an auth cookie', async () => {
        const res = await request(app).delete(`/files/${FILE_ID}/share`)

        expect(res.status).toBe(401)
        expect(mockedShareUpdate).not.toHaveBeenCalled()
    })
})

describe('GET|POST /share/:token', () => {
    function sharedFile(overrides: Record<string, any> = {}) {
        return {
            ...buildShare(overrides),
            file: {
                id: FILE_ID,
                storageKey: 'users/user-1/2026/01/file.txt',
                deletedAt: null,
                ...(overrides.file ?? {}),
            },
        }
    }

    it('serves a signed url with no authentication at all', async () => {
        mockedShareFindUnique.mockResolvedValue(sharedFile())

        const res = await request(app).get(`/share/${TOKEN}`)

        expect(res.status).toBe(200)
        expect(res.body.data.downloadUrl).toBe('https://storage.example.com/signed')
        expect(mockedUserFindUnique).not.toHaveBeenCalled()
    })

    it('accepts a password posted in the body', async () => {
        const bcrypt = (await import('bcrypt')).default
        mockedShareFindUnique.mockResolvedValue(sharedFile({ passwordHash: await bcrypt.hash('secret123', 12) }))

        const res = await request(app).post(`/share/${TOKEN}`).send({ password: 'secret123' })

        expect(res.status).toBe(200)
        expect(res.body.data.downloadUrl).toBe('https://storage.example.com/signed')
    })

    it('returns 401 when the password is missing or wrong', async () => {
        const bcrypt = (await import('bcrypt')).default
        mockedShareFindUnique.mockResolvedValue(sharedFile({ passwordHash: await bcrypt.hash('secret123', 12) }))

        const missing = await request(app).get(`/share/${TOKEN}`)
        const wrong = await request(app).post(`/share/${TOKEN}`).send({ password: 'nope123' })

        expect(missing.status).toBe(401)
        expect(wrong.status).toBe(401)
        expect(mockedSignedUrl).not.toHaveBeenCalled()
    })

    it('returns 400 for a malformed token without touching the database', async () => {
        const res = await request(app).get('/share/short')

        expect(res.status).toBe(400)
        expect(mockedShareFindUnique).not.toHaveBeenCalled()
    })

    it('returns 404 for an unknown token', async () => {
        mockedShareFindUnique.mockResolvedValue(null)

        const res = await request(app).get(`/share/${TOKEN}`)

        expect(res.status).toBe(404)
    })

    it('returns 410 for a disabled share and for an expired one', async () => {
        mockedShareFindUnique.mockResolvedValue(sharedFile({ isActive: false }))
        expect((await request(app).get(`/share/${TOKEN}`)).status).toBe(410)

        mockedShareFindUnique.mockResolvedValue(sharedFile({ expiresAt: new Date(Date.now() - 1000) }))
        expect((await request(app).get(`/share/${TOKEN}`)).status).toBe(410)
    })

    it('returns 404 once the shared file is trashed', async () => {
        mockedShareFindUnique.mockResolvedValue(sharedFile({ file: { deletedAt: new Date() } }))

        const res = await request(app).get(`/share/${TOKEN}`)

        expect(res.status).toBe(404)
    })
})
