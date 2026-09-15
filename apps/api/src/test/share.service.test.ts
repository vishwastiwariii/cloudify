import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import bcrypt from 'bcrypt'

vi.mock('@repo/db', () => ({
    default: {
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
import { ShareService } from '../modules/share/share.service'
import { AuthError } from '../modules/auth/auth.service'
import { PUBLIC_SHARE_DOWNLOAD_URL_EXPIRATION } from '../modules/share/share.constants'

const mockedFileFindFirst = prisma.file.findFirst as unknown as Mock
const mockedShareFindUnique = prisma.publicShare.findUnique as unknown as Mock
const mockedShareCreate = prisma.publicShare.create as unknown as Mock
const mockedShareUpdate = prisma.publicShare.update as unknown as Mock
const mockedObjectExists = storageProvider.objectExists as unknown as Mock
const mockedSignedUrl = storageProvider.generateSignedDownloadUrl as unknown as Mock

function createdShareData(call: number) {
    return mockedShareCreate.mock.calls[call]![0].data
}

function buildFile(overrides: Record<string, any> = {}) {
    return {
        id: 'file-1',
        ownerId: 'user-1',
        deletedAt: null,
        ...overrides,
    }
}

function buildShare(overrides: Record<string, any> = {}) {
    return {
        id: 'share-1',
        fileId: 'file-1',
        token: 'a'.repeat(43),
        passwordHash: null,
        expiresAt: null,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ...overrides,
    }
}

function buildSharedFile(overrides: Record<string, any> = {}) {
    return {
        ...buildShare(overrides),
        file: {
            id: 'file-1',
            name: 'file-1.txt',
            storageKey: 'users/user-1/2026/01/file-1.txt',
            deletedAt: null,
            ...(overrides.file ?? {}),
        },
    }
}

describe('ShareService', () => {
    let shareService: ShareService

    beforeEach(() => {
        shareService = new ShareService()

        mockedFileFindFirst.mockReset()
        mockedShareFindUnique.mockReset()
        mockedShareCreate.mockReset()
        mockedShareUpdate.mockReset()
        mockedObjectExists.mockReset()
        mockedSignedUrl.mockReset()

        mockedShareCreate.mockImplementation(async ({ data }: any) => buildShare(data))
        mockedObjectExists.mockResolvedValue(true)
        mockedSignedUrl.mockResolvedValue('https://storage.example.com/signed')
    })

    describe('createShare', () => {
        it('creates a share with a url-safe token and no password', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(null)

            const result = await shareService.createShare('user-1', { fileId: 'file-1' })

            const created = createdShareData(0)

            expect(created.passwordHash).toBeNull()
            expect(created.expiresAt).toBeNull()
            expect(created.token).toMatch(/^[A-Za-z0-9_-]+$/)
            expect(result.hasPassword).toBe(false)
            expect(result.shareUrl).toBe(`http://localhost:3000/s/${created.token}`)
        })

        it('never leaks the password hash and stores a verifiable one', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(null)

            const result = await shareService.createShare('user-1', { fileId: 'file-1', password: 'secret123' })

            const { passwordHash } = createdShareData(0)

            expect(passwordHash).not.toBe('secret123')
            expect(await bcrypt.compare('secret123', passwordHash)).toBe(true)
            expect(result.hasPassword).toBe(true)
            expect(result).not.toHaveProperty('passwordHash')
        })

        it('issues a different token on every share', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(null)

            await shareService.createShare('user-1', { fileId: 'file-1' })
            await shareService.createShare('user-1', { fileId: 'file-1' })

            const first = createdShareData(0).token
            const second = createdShareData(1).token

            expect(first).not.toBe(second)
        })

        it('throws 404 when the file belongs to somebody else', async () => {
            mockedFileFindFirst.mockResolvedValue(null)

            const error = await shareService.createShare('user-2', { fileId: 'file-1' }).catch((e) => e)

            expect(error).toBeInstanceOf(AuthError)
            expect(error.statusCode).toBe(404)
            expect(mockedShareCreate).not.toHaveBeenCalled()
        })

        it('throws 404 when the file is in the trash', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile({ deletedAt: new Date() }))

            await expect(shareService.createShare('user-1', { fileId: 'file-1' })).rejects.toMatchObject({
                statusCode: 404,
            })
        })

        it('throws 409 when the file is already shared', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(buildShare())

            await expect(shareService.createShare('user-1', { fileId: 'file-1' })).rejects.toMatchObject({
                statusCode: 409,
            })
            expect(mockedShareCreate).not.toHaveBeenCalled()
        })
    })

    describe('getShare', () => {
        it('returns the share for the owner without the hash', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(buildShare({ passwordHash: 'hashed' }))

            const result = await shareService.getShare('user-1', 'file-1')

            expect(result).toMatchObject({ id: 'share-1', fileId: 'file-1', hasPassword: true, isActive: true })
            expect(result).not.toHaveProperty('passwordHash')
        })

        it('throws 404 when the file has no share', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(null)

            await expect(shareService.getShare('user-1', 'file-1')).rejects.toMatchObject({ statusCode: 404 })
        })
    })

    describe('disableShare', () => {
        it('flips isActive to false', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(buildShare())

            await shareService.disableShare('user-1', 'file-1')

            expect(mockedShareUpdate).toHaveBeenCalledWith({
                where: { id: 'share-1' },
                data: { isActive: false },
            })
        })

        it('is a no-op when the share is already disabled', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(buildShare({ isActive: false }))

            await shareService.disableShare('user-1', 'file-1')

            expect(mockedShareUpdate).not.toHaveBeenCalled()
        })

        it('throws 404 when the share does not exist', async () => {
            mockedFileFindFirst.mockResolvedValue(buildFile())
            mockedShareFindUnique.mockResolvedValue(null)

            await expect(shareService.disableShare('user-1', 'file-1')).rejects.toMatchObject({ statusCode: 404 })
        })
    })

    describe('getPublicDownloadUrl', () => {
        it('signs a url for an open share', async () => {
            mockedShareFindUnique.mockResolvedValue(buildSharedFile())

            const result = await shareService.getPublicDownloadUrl('a'.repeat(43))

            expect(result.downloadUrl).toBe('https://storage.example.com/signed')
            expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
            expect(mockedSignedUrl).toHaveBeenCalledWith({
                objectKey: 'users/user-1/2026/01/file-1.txt',
                expiresIn: PUBLIC_SHARE_DOWNLOAD_URL_EXPIRATION,
                fileName: 'file-1.txt',
            })
        })

        it('accepts the correct password on a protected share', async () => {
            const passwordHash = await bcrypt.hash('secret123', 12)
            mockedShareFindUnique.mockResolvedValue(buildSharedFile({ passwordHash }))

            const result = await shareService.getPublicDownloadUrl('a'.repeat(43), 'secret123')

            expect(result.downloadUrl).toBe('https://storage.example.com/signed')
        })

        it('throws 401 for a wrong password and for a missing one', async () => {
            const passwordHash = await bcrypt.hash('secret123', 12)
            mockedShareFindUnique.mockResolvedValue(buildSharedFile({ passwordHash }))

            await expect(shareService.getPublicDownloadUrl('a'.repeat(43), 'wrong')).rejects.toMatchObject({
                statusCode: 401,
            })
            await expect(shareService.getPublicDownloadUrl('a'.repeat(43))).rejects.toMatchObject({
                statusCode: 401,
            })
            expect(mockedSignedUrl).not.toHaveBeenCalled()
        })

        it('throws 404 for an unknown token', async () => {
            mockedShareFindUnique.mockResolvedValue(null)

            await expect(shareService.getPublicDownloadUrl('a'.repeat(43))).rejects.toMatchObject({ statusCode: 404 })
        })

        it('throws 410 for a disabled share', async () => {
            mockedShareFindUnique.mockResolvedValue(buildSharedFile({ isActive: false }))

            await expect(shareService.getPublicDownloadUrl('a'.repeat(43))).rejects.toMatchObject({ statusCode: 410 })
        })

        it('throws 410 for an expired share', async () => {
            mockedShareFindUnique.mockResolvedValue(buildSharedFile({ expiresAt: new Date(Date.now() - 1000) }))

            await expect(shareService.getPublicDownloadUrl('a'.repeat(43))).rejects.toMatchObject({ statusCode: 410 })
        })

        it('signs a url while the expiry is still in the future', async () => {
            mockedShareFindUnique.mockResolvedValue(buildSharedFile({ expiresAt: new Date(Date.now() + 60_000) }))

            const result = await shareService.getPublicDownloadUrl('a'.repeat(43))

            expect(result.downloadUrl).toBe('https://storage.example.com/signed')
        })

        it('throws 404 once the shared file is trashed', async () => {
            mockedShareFindUnique.mockResolvedValue(buildSharedFile({ file: { deletedAt: new Date() } }))

            await expect(shareService.getPublicDownloadUrl('a'.repeat(43))).rejects.toMatchObject({ statusCode: 404 })
        })

        it('throws 404 when the object is gone from the bucket', async () => {
            mockedShareFindUnique.mockResolvedValue(buildSharedFile())
            mockedObjectExists.mockResolvedValue(false)

            await expect(shareService.getPublicDownloadUrl('a'.repeat(43))).rejects.toMatchObject({ statusCode: 404 })
            expect(mockedSignedUrl).not.toHaveBeenCalled()
        })
    })
})
