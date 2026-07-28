import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
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
import { AuthService, AuthError } from '../modules/auth/auth.service'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '../modules/auth/auth.constants'

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

function buildRes() {
    return {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
    } as any
}

describe('AuthService', () => {
    let authService: AuthService

    beforeEach(() => {
        authService = new AuthService()
        mockedFindUnique.mockReset()
        mockedCreate.mockReset()
    })

    describe('signUp', () => {
        it('throws 409 when a user already exists with the same email', async () => {
            mockedFindUnique.mockResolvedValue(buildUser())

            await expect(
                authService.signUp({ email: 'test@example.com', password: 'password123', name: 'Test User' })
            ).rejects.toMatchObject({ statusCode: 409 })

            expect(mockedCreate).not.toHaveBeenCalled()
        })

        it('creates the user, hashes the password, and returns a safe user with a token', async () => {
            mockedFindUnique.mockResolvedValue(null)
            mockedCreate.mockImplementation(async ({ data }: any) => buildUser({ email: data.email, password: data.password, name: data.name }))

            const result = await authService.signUp({ email: 'new@example.com', password: 'password123', name: 'New User' })

            expect(result.token).toEqual(expect.any(String))
            expect(result.user).toMatchObject({ id: 'user-1', email: 'new@example.com', name: 'New User' })
            expect(result.user).not.toHaveProperty('password')
            expect(result.user).not.toHaveProperty('storageLimit')
            expect(result.user).not.toHaveProperty('storageUsed')

            const [{ data }] = mockedCreate.mock.calls[0]!
            expect(data.password).not.toBe('password123')
            await expect(bcrypt.compare('password123', data.password)).resolves.toBe(true)
        })

        it('sets the auth cookie when a response object is provided', async () => {
            mockedFindUnique.mockResolvedValue(null)
            mockedCreate.mockResolvedValue(buildUser())
            const res = buildRes()

            const result = await authService.signUp({ email: 'test@example.com', password: 'password123', name: 'Test User' }, res)

            expect(res.cookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, result.token, AUTH_COOKIE_OPTIONS)
        })
    })

    describe('login', () => {
        it('throws 401 when no user matches the email', async () => {
            mockedFindUnique.mockResolvedValue(null)

            await expect(
                authService.login({ email: 'missing@example.com', password: 'password123' })
            ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid Email' })
        })

        it('throws 401 when the password is incorrect', async () => {
            const hashed = await bcrypt.hash('correct-password', 12)
            mockedFindUnique.mockResolvedValue(buildUser({ password: hashed }))

            await expect(
                authService.login({ email: 'test@example.com', password: 'wrong-password' })
            ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid Password' })
        })

        it('returns a safe user and token on valid credentials', async () => {
            const hashed = await bcrypt.hash('correct-password', 12)
            mockedFindUnique.mockResolvedValue(buildUser({ password: hashed }))

            const result = await authService.login({ email: 'test@example.com', password: 'correct-password' })

            expect(result.token).toEqual(expect.any(String))
            expect(result.user).toMatchObject({ id: 'user-1', email: 'test@example.com' })
            expect(result.user).not.toHaveProperty('password')
        })

        it('sets the auth cookie when a response object is provided', async () => {
            const hashed = await bcrypt.hash('correct-password', 12)
            mockedFindUnique.mockResolvedValue(buildUser({ password: hashed }))
            const res = buildRes()

            const result = await authService.login({ email: 'test@example.com', password: 'correct-password' }, res)

            expect(res.cookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, result.token, AUTH_COOKIE_OPTIONS)
        })
    })

    describe('authenticate', () => {
        it('throws 401 for a malformed or invalid token', async () => {
            await expect(authService.authenticate('not-a-real-token')).rejects.toMatchObject({
                statusCode: 401,
                message: 'Invalid or expired token',
            })
        })

        it('throws 401 when the token is valid but the user no longer exists', async () => {
            mockedFindUnique.mockResolvedValue(null)
            mockedCreate.mockResolvedValue(buildUser())

            const { token } = await authService.signUp({ email: 'test@example.com', password: 'password123', name: 'Test User' })

            mockedFindUnique.mockResolvedValue(null)

            await expect(authService.authenticate(token)).rejects.toMatchObject({
                statusCode: 401,
                message: 'User not found',
            })
        })

        it('returns the safe user for a valid token', async () => {
            mockedFindUnique.mockResolvedValue(null)
            mockedCreate.mockResolvedValue(buildUser())

            const { token } = await authService.signUp({ email: 'test@example.com', password: 'password123', name: 'Test User' })

            mockedFindUnique.mockResolvedValue(buildUser())

            const user = await authService.authenticate(token)

            expect(user).toMatchObject({ id: 'user-1', email: 'test@example.com' })
            expect(user).not.toHaveProperty('password')
            expect(user).not.toHaveProperty('storageLimit')
            expect(user).not.toHaveProperty('storageUsed')
        })
    })

    describe('logout', () => {
        it('clears the auth cookie', async () => {
            const res = buildRes()

            await authService.logout(res)

            expect(res.clearCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS)
        })
    })
})
