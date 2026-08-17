// Regression tests for the three high-severity audit findings:
//   1. POST /files let a client name the storage object a file row points at
//   2. soft-deleted accounts kept working until their cookie expired
//   3. the storage quota was implemented but never called
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn().mockResolvedValue(true),
        hash: vi.fn().mockResolvedValue('hashed-password'),
    },
}))

vi.mock('@repo/db', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            updateMany: vi.fn(),
        },
        file: {
            create: vi.fn(),
        },
        uploadSession: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        folder: {
            findFirst: vi.fn(),
        },
        $transaction: vi.fn(),
    },
    Prisma: {},
}))

vi.mock('../infrastructure/storage', () => ({
    storageProvider: {
        generateSignedUploadUrl: vi.fn(),
        objectExists: vi.fn(),
        getObjectMetaData: vi.fn(),
    },
}))

import prisma from '@repo/db'
import { storageProvider } from '../infrastructure/storage'
import app from '../app'
import { AUTH_COOKIE_NAME } from '../modules/auth/auth.constants'
import { AuthService } from '../modules/auth/auth.service'
import { UploadService } from '../modules/upload/uploads.service'

const mockedUserFindUnique = prisma.user.findUnique as unknown as Mock
const mockedUserFindFirst = prisma.user.findFirst as unknown as Mock
const mockedUserUpdateMany = prisma.user.updateMany as unknown as Mock
const mockedFileCreate = prisma.file.create as unknown as Mock
const mockedSessionFindFirst = prisma.uploadSession.findFirst as unknown as Mock
const mockedSessionCreate = prisma.uploadSession.create as unknown as Mock
const mockedSessionUpdate = prisma.uploadSession.update as unknown as Mock
const mockedTransaction = prisma.$transaction as unknown as Mock
const mockedSignedUploadUrl = storageProvider.generateSignedUploadUrl as unknown as Mock
const mockedObjectExists = storageProvider.objectExists as unknown as Mock
const mockedGetObjectMetaData = storageProvider.getObjectMetaData as unknown as Mock

const TWO_GB = 2147483648n

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
        storageLimit: TWO_GB,
        storageUsed: 0n,
        deletedAt: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ...overrides,
    }
}

beforeEach(() => {
    vi.clearAllMocks()

    mockedUserFindUnique.mockResolvedValue(buildUser())
    mockedUserFindFirst.mockResolvedValue({ storageLimit: TWO_GB, storageUsed: 0n })
    mockedUserUpdateMany.mockResolvedValue({ count: 1 })

    // Interactive transactions run against the same mocked client.
    mockedTransaction.mockImplementation((arg: any) =>
        typeof arg === 'function' ? arg(prisma) : Promise.all(arg)
    )
})

describe('finding 1 — a client cannot name the storage object a file points at', () => {
    it('no longer exposes POST /files', async () => {
        const res = await request(app)
            .post('/files')
            .set('Cookie', authCookie())
            .send({
                name: 'stolen.png',
                originalName: 'stolen.png',
                // the whole point of the finding: someone else's object key
                storageKey: 'users/victim-user/2026/08/secret.png',
                bucket: 'cloudify',
                mimeType: 'image/png',
                size: '1024',
            })

        // Route is gone, so Express falls through to its 404 handler.
        expect(res.status).toBe(404)
        expect(mockedFileCreate).not.toHaveBeenCalled()
    })

    it('derives the storage key server-side on upload, ignoring any client value', async () => {
        const uploadService = new UploadService()

        mockedSessionCreate.mockImplementation(async ({ data }: any) => ({
            id: 'session-1',
            expiresAt: data.expiresAt,
            objectKey: data.objectKey,
        }))
        mockedSignedUploadUrl.mockResolvedValue('https://signed.example/upload')

        const result = await uploadService.initiateUpload(
            {
                fileName: 'photo.png',
                mimeType: 'image/png',
                size: 1024,
                // a client trying to smuggle a key in has nowhere to put it:
                // initiateUpload's DTO has no storageKey field at all
            } as any,
            'user-1'
        )

        // Always scoped under the caller's own id.
        expect(result.objectKey).toMatch(/^users\/user-1\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/)
    })
})

describe('finding 2 — soft-deleted accounts are rejected', () => {
    const authService = new AuthService()

    it('refuses to authenticate a deleted user holding a valid token', async () => {
        mockedUserFindUnique.mockResolvedValue(buildUser({ deletedAt: new Date() }))

        const token = jwt.sign({ userId: 'user-1', email: 'test@example.com' }, 'test-jwt-secret')

        await expect(authService.authenticate(token)).rejects.toMatchObject({
            statusCode: 401,
            message: 'User not found',
        })
    })

    it('still authenticates a live user', async () => {
        const token = jwt.sign({ userId: 'user-1', email: 'test@example.com' }, 'test-jwt-secret')

        await expect(authService.authenticate(token)).resolves.toMatchObject({ id: 'user-1' })
    })

    it('refuses to issue a fresh cookie to a deleted user at login', async () => {
        mockedUserFindUnique.mockResolvedValue(buildUser({ deletedAt: new Date() }))

        // The message matters: it proves the deleted check rejected this, not
        // the password comparison further down.
        await expect(
            authService.login({ email: 'test@example.com', password: 'whatever' })
        ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid Email' })

        expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('blocks a deleted user from reaching a protected route', async () => {
        mockedUserFindUnique.mockResolvedValue(buildUser({ deletedAt: new Date() }))

        const res = await request(app).get('/dashboard').set('Cookie', authCookie())

        expect(res.status).toBe(401)
    })
})

describe('finding 3 — the storage quota is enforced', () => {
    const uploadService = new UploadService()

    it('rejects an upload that would exceed the quota before issuing a signed URL', async () => {
        // 1.5 GB already used, asking for another 1 GB.
        mockedUserFindFirst.mockResolvedValue({
            storageUsed: 1610612736n,
            storageLimit: TWO_GB,
        })

        await expect(
            uploadService.initiateUpload(
                { fileName: 'big.bin', mimeType: 'application/octet-stream', size: 1073741824 } as any,
                'user-1'
            )
        ).rejects.toMatchObject({ statusCode: 413, message: 'Storage limit exceeded' })

        expect(mockedSignedUploadUrl).not.toHaveBeenCalled()
        expect(mockedSessionCreate).not.toHaveBeenCalled()
    })

    it('charges the upload to the user when it completes', async () => {
        mockedSessionFindFirst.mockResolvedValue({
            id: 'session-1',
            ownerId: 'user-1',
            folderId: null,
            originalName: 'photo.png',
            objectKey: 'users/user-1/2026/08/photo.png',
            bucket: 'cloudify',
            size: 1024n,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 60_000),
        })
        mockedObjectExists.mockResolvedValue(true)
        mockedGetObjectMetaData.mockResolvedValue({ size: 1024, contentType: 'image/png' })
        mockedFileCreate.mockResolvedValue({ id: 'file-1', size: 1024n })
        mockedSessionUpdate.mockResolvedValue({})

        await uploadService.completeUpload({ uploadId: 'session-1' }, 'user-1')

        // The conditional update is the enforcement: it only matches while the
        // user is still under their limit.
        expect(mockedUserUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: 'user-1',
                    storageUsed: { lte: TWO_GB - 1024n },
                }),
                data: { storageUsed: { increment: 1024n } },
            })
        )
    })

    it('rolls the file row back when the charge does not fit', async () => {
        mockedSessionFindFirst.mockResolvedValue({
            id: 'session-1',
            ownerId: 'user-1',
            folderId: null,
            originalName: 'photo.png',
            objectKey: 'users/user-1/2026/08/photo.png',
            bucket: 'cloudify',
            size: 1024n,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 60_000),
        })
        mockedObjectExists.mockResolvedValue(true)
        mockedGetObjectMetaData.mockResolvedValue({ size: 1024, contentType: 'image/png' })
        mockedFileCreate.mockResolvedValue({ id: 'file-1', size: 1024n })
        mockedSessionUpdate.mockResolvedValue({})

        // Someone else's concurrent upload took the last of the quota.
        mockedUserUpdateMany.mockResolvedValue({ count: 0 })

        await expect(
            uploadService.completeUpload({ uploadId: 'session-1' }, 'user-1')
        ).rejects.toMatchObject({ statusCode: 413 })

        // Throwing inside $transaction is what discards the file row, so the
        // charge and the row can never disagree.
        expect(mockedTransaction).toHaveBeenCalled()
    })
})
