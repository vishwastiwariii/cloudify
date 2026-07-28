import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { errorHandler } from '../middleware/error.middleware'
import { AuthError } from '../modules/auth/auth.service'

function buildRes() {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res
}

describe('errorHandler', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns 400 with validation errors for a ZodError', () => {
        const res = buildRes()
        const error = { name: 'ZodError', issues: [{ message: 'Invalid Email Address' }] }

        errorHandler(error, {} as any, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ errors: error.issues })
    })

    it('returns the AuthError statusCode and message', () => {
        const res = buildRes()
        const error = new AuthError('Invalid Password', 401)

        errorHandler(error, {} as any, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Password' })
    })

    it('falls back to a logged 500 for unexpected errors', () => {
        const res = buildRes()
        const error = new Error('boom')

        errorHandler(error, {} as any, res, vi.fn())

        expect(console.error).toHaveBeenCalledWith(error)
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
})
