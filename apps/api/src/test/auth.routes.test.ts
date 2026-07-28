import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcrypt'

vi.mock('@repo/db', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}))

import prisma from '@repo/db'
import app from '../app'
import { AUTH_COOKIE_NAME } from '../modules/auth/auth.constants'

const mockedFindUnique = prisma.user.findUnique as unknown as Mock
const mockedCreate = prisma.user.create as unknown as Mock

function buildUser(overrides: Record<string, any> = {}) {
    return {
        id: 'user-1',
        email: 'test@example.com',
        username: null,
        password: 'hashed-password',
        name: 'Test User',
        isVerified: false,
        verifiedAt: null,
        storageLimit: 2147483648n,
        storageUsed: 0n,
        deletedAt: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ...overrides,
    }
}

function authCookie(res: request.Response) {
    const cookies = res.headers['set-cookie'] as unknown as string[] | undefined
    return cookies?.find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))
}

beforeEach(() => {
    mockedFindUnique.mockReset()
    mockedCreate.mockReset()
})

describe('POST /auth/signup', () => {
    it('registers a new user and sets the auth cookie', async () => {
        mockedFindUnique.mockResolvedValue(null)
        mockedCreate.mockImplementation(async ({ data }: any) => buildUser({ email: data.email, name: data.name }))

        const res = await request(app)
            .post('/auth/signup')
            .send({ email: 'new@example.com', password: 'password123', name: 'New User' })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.user).toMatchObject({ email: 'new@example.com', name: 'New User' })
        expect(res.body.data.user).not.toHaveProperty('password')
        expect(authCookie(res)).toMatch(/HttpOnly/)
    })

    it('returns 409 when the email is already registered', async () => {
        mockedFindUnique.mockResolvedValue(buildUser())

        const res = await request(app)
            .post('/auth/signup')
            .send({ email: 'test@example.com', password: 'password123', name: 'Test User' })

        expect(res.status).toBe(409)
        expect(res.body.message).toBe('User already exists with the same email')
    })

    it('returns 400 on invalid input', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send({ email: 'not-an-email', password: 'short', name: 'A' })

        expect(res.status).toBe(400)
        expect(res.body.errors).toBeInstanceOf(Array)
        expect(res.body.errors.length).toBeGreaterThan(0)
        expect(mockedFindUnique).not.toHaveBeenCalled()
    })
})

describe('POST /auth/login', () => {
    it('logs in with valid credentials and sets the auth cookie', async () => {
        const hashed = await bcrypt.hash('correct-password', 12)
        mockedFindUnique.mockResolvedValue(buildUser({ password: hashed }))

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'correct-password' })

        expect(res.status).toBe(200)
        expect(res.body.data.user).toMatchObject({ email: 'test@example.com' })
        expect(authCookie(res)).toMatch(/HttpOnly/)
    })

    it('returns 401 for an unknown email', async () => {
        mockedFindUnique.mockResolvedValue(null)

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'missing@example.com', password: 'password123' })

        expect(res.status).toBe(401)
        expect(res.body.message).toBe('Invalid Email')
    })

    it('returns 401 for an incorrect password', async () => {
        const hashed = await bcrypt.hash('correct-password', 12)
        mockedFindUnique.mockResolvedValue(buildUser({ password: hashed }))

        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'wrong-password' })

        expect(res.status).toBe(401)
        expect(res.body.message).toBe('Invalid Password')
    })

    it('returns 400 on invalid input', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'not-an-email', password: '' })

        expect(res.status).toBe(400)
        expect(res.body.errors).toBeInstanceOf(Array)
        expect(res.body.errors.length).toBeGreaterThan(0)
    })
})

describe('POST /auth/logout', () => {
    it('clears the auth cookie', async () => {
        const res = await request(app).post('/auth/logout')

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        const cleared = authCookie(res)
        expect(cleared).toMatch(new RegExp(`${AUTH_COOKIE_NAME}=;`))
    })
})
