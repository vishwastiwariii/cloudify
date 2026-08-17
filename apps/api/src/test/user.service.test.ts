import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

vi.mock('@repo/db', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}))

import prisma from '@repo/db'
import { UserService } from '../modules/users/user.service'
import { USER_PUBLIC_SELECT } from '../modules/users/user.constants'

const mockedFindUnique = prisma.user.findUnique as unknown as Mock
const mockedUpdate = prisma.user.update as unknown as Mock

// Mirrors what a USER_PUBLIC_SELECT query resolves to: password, verifiedAt and
// deletedAt are never read back, so a fixture carrying them would be testing a
// row the service cannot receive.
function buildUser(overrides: Record<string, any> = {}) {
    return {
        id: 'user-1',
        email: 'test@example.com',
        username: null,
        name: 'Test User',
        avatar: null,
        isVerified: true,
        storageLimit: 2147483648n,
        storageUsed: 0n,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ...overrides,
    }
}

describe('UserService', () => {
    let userService: UserService

    beforeEach(() => {
        userService = new UserService()
        mockedFindUnique.mockReset()
        mockedUpdate.mockReset()
    })

    describe('getMe', () => {
        it('throws 401 when the user no longer exists', async () => {
            mockedFindUnique.mockResolvedValue(null)

            await expect(userService.getMe('user-1')).rejects.toMatchObject({
                statusCode: 401,
                message: 'User not found',
            })
        })

        it('returns the user with storage fields serialized to strings', async () => {
            mockedFindUnique.mockResolvedValue(buildUser())

            const result = await userService.getMe('user-1')

            // The select is what keeps `password` out of the response, so that
            // is the thing worth pinning: nothing in the service strips it.
            expect(mockedFindUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'user-1' },
                    select: USER_PUBLIC_SELECT,
                })
            )
            expect(result).toMatchObject({ id: 'user-1', email: 'test@example.com', name: 'Test User' })
            expect(result.storageLimit).toBe('2147483648')
            expect(result.storageUsed).toBe('0')
        })
    })

    describe('updateName', () => {
        it('updates the name and returns the serialized user', async () => {
            mockedUpdate.mockResolvedValue(buildUser({ name: 'New Name' }))

            const result = await userService.updateName({ name: 'New Name' }, 'user-1')

            expect(mockedUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'user-1' },
                    data: { name: 'New Name' },
                    select: USER_PUBLIC_SELECT,
                })
            )
            expect(result.name).toBe('New Name')
            expect(result.storageLimit).toBe('2147483648')
        })
    })

    describe('updateAvatar', () => {
        it('updates the avatar and returns the serialized user', async () => {
            mockedUpdate.mockResolvedValue(buildUser({ avatar: 'https://cdn.example.com/avatar.png' }))

            const result = await userService.updateAvatar({ avatarUrl: 'https://cdn.example.com/avatar.png' }, 'user-1')

            expect(mockedUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'user-1' },
                    data: { avatar: 'https://cdn.example.com/avatar.png' },
                    select: USER_PUBLIC_SELECT,
                })
            )
            expect(result.avatar).toBe('https://cdn.example.com/avatar.png')
            expect(result.storageUsed).toBe('0')
        })
    })
})
