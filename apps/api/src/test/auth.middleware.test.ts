import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAuthenticate } = vi.hoisted(() => ({ mockAuthenticate: vi.fn() }))

vi.mock('../modules/auth/auth.service', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../modules/auth/auth.service')>()
    return {
        ...actual,
        AuthService: vi.fn().mockImplementation(function () {
            return { authenticate: mockAuthenticate }
        }),
    }
})

import { authMiddleware } from '../middleware/auth.middleware'
import { AuthError } from '../modules/auth/auth.service'
import { AUTH_COOKIE_NAME } from '../modules/auth/auth.constants'

function buildReq(cookies: Record<string, string> = {}) {
    return { cookies } as any
}

describe('authMiddleware', () => {
    beforeEach(() => {
        mockAuthenticate.mockReset()
    })

    it('calls next with a 401 AuthError when no auth cookie is present', async () => {
        const req = buildReq()
        const next = vi.fn()

        await authMiddleware(req, {} as any, next)

        expect(mockAuthenticate).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledTimes(1)
        const error = next.mock.calls[0]![0]
        expect(error).toBeInstanceOf(AuthError)
        expect(error.statusCode).toBe(401)
    })

    it('attaches the authenticated user to the request and calls next with no error', async () => {
        const safeUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' }
        mockAuthenticate.mockResolvedValue(safeUser)
        const req = buildReq({ [AUTH_COOKIE_NAME]: 'valid-token' })
        const next = vi.fn()

        await authMiddleware(req, {} as any, next)

        expect(mockAuthenticate).toHaveBeenCalledWith('valid-token')
        expect(req.user).toEqual(safeUser)
        expect(next).toHaveBeenCalledWith()
    })

    it('calls next with the error when authentication fails', async () => {
        const authError = new AuthError('Invalid or expired token', 401)
        mockAuthenticate.mockRejectedValue(authError)
        const req = buildReq({ [AUTH_COOKIE_NAME]: 'bad-token' })
        const next = vi.fn()

        await authMiddleware(req, {} as any, next)

        expect(req.user).toBeUndefined()
        expect(next).toHaveBeenCalledWith(authError)
    })
})
