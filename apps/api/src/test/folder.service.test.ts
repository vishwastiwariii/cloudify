import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

vi.mock('@repo/db', () => ({
    default: {
        folder: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

import prisma from '@repo/db'
import { FolderService } from '../modules/folders/folder.service'

const mockedFindFirst = prisma.folder.findFirst as unknown as Mock
const mockedFindMany = prisma.folder.findMany as unknown as Mock
const mockedCreate = prisma.folder.create as unknown as Mock
const mockedUpdate = prisma.folder.update as unknown as Mock
const mockedUpdateMany = prisma.folder.updateMany as unknown as Mock
const mockedTransaction = prisma.$transaction as unknown as Mock

function buildFolder(overrides: Record<string, any> = {}) {
    return {
        id: 'folder-1',
        name: 'My Folder',
        parentId: null,
        ownerId: 'user-1',
        path: '/folder-1',
        depth: 0,
        deletedAt: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ...overrides,
    }
}

describe('FolderService', () => {
    let folderService: FolderService

    beforeEach(() => {
        folderService = new FolderService()

        mockedFindFirst.mockReset()
        mockedFindMany.mockReset()
        mockedCreate.mockReset()
        mockedUpdate.mockReset()
        mockedUpdateMany.mockReset()
        mockedTransaction.mockReset()

        mockedUpdate.mockImplementation(async ({ where, data }: any) => ({ id: where.id, ...data }))
        mockedTransaction.mockImplementation((arg: any) =>
            typeof arg === 'function' ? arg(prisma) : Promise.all(arg)
        )
    })

    describe('createFolder', () => {
        it('creates a root folder with a computed path when no parentId is given', async () => {
            mockedFindFirst.mockResolvedValueOnce(null) // duplicate name check
            mockedCreate.mockResolvedValue({ id: 'new-folder-id', name: 'Root', parentId: null, ownerId: 'user-1', path: '', depth: 0 })

            const result = await folderService.createFolder({ name: 'Root' } as any, 'user-1')

            expect(mockedFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({ where: { ownerId: 'user-1', parentId: null, name: 'Root', deletedAt: null } })
            )
            expect(mockedCreate).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ name: 'Root', parentId: null, ownerId: 'user-1', depth: 0 }) })
            )
            expect(result).toMatchObject({ id: 'new-folder-id', path: '/new-folder-id' })
        })

        it('creates a child folder under an owned parent, deriving path and depth from it', async () => {
            const parent = buildFolder({ id: 'parent-1', path: '/parent-1', depth: 0 })
            mockedFindFirst
                .mockResolvedValueOnce(parent) // parent lookup
                .mockResolvedValueOnce(null) // duplicate name check
            mockedCreate.mockResolvedValue({ id: 'child-1', name: 'Child', parentId: 'parent-1', ownerId: 'user-1', path: '', depth: 1 })

            const result = await folderService.createFolder({ name: 'Child', parentId: 'parent-1' } as any, 'user-1')

            expect(mockedFindFirst).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ where: { id: 'parent-1', ownerId: 'user-1', deletedAt: null } })
            )
            expect(mockedCreate).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ parentId: 'parent-1', depth: 1 }) })
            )
            expect(result).toMatchObject({ id: 'child-1', path: '/parent-1/child-1' })
        })

        it('throws 404 when the given parentId does not belong to the user', async () => {
            mockedFindFirst.mockResolvedValueOnce(null) // parent lookup fails

            await expect(
                folderService.createFolder({ name: 'Child', parentId: 'not-mine' } as any, 'user-1')
            ).rejects.toMatchObject({ statusCode: 404, message: 'Parent folder not found' })

            expect(mockedCreate).not.toHaveBeenCalled()
        })

        it('throws 409 when a sibling folder with the same name already exists', async () => {
            mockedFindFirst.mockResolvedValueOnce(buildFolder({ name: 'Root' })) // duplicate name check

            await expect(
                folderService.createFolder({ name: 'Root' } as any, 'user-1')
            ).rejects.toMatchObject({ statusCode: 409, message: 'A folder with this name already exists here' })

            expect(mockedCreate).not.toHaveBeenCalled()
        })
    })

    describe('updateFolder', () => {
        it('renames a folder owned by the user', async () => {
            const folder = buildFolder({ name: 'Old Name' })
            mockedFindFirst
                .mockResolvedValueOnce(folder) // ownership lookup
                .mockResolvedValueOnce(null) // duplicate name check

            const result = await folderService.updateFolder(
                { params: { folderId: 'folder-1' }, body: { name: 'New Name' } } as any,
                'user-1'
            )

            expect(mockedFindFirst).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ where: { id: 'folder-1', ownerId: 'user-1', deletedAt: null } })
            )
            expect(mockedUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'folder-1' }, data: { name: 'New Name' } })
            )
            expect(result).toMatchObject({ name: 'New Name' })
        })

        it('throws 404 when the folder does not exist or is not owned by the user', async () => {
            mockedFindFirst.mockResolvedValueOnce(null)

            await expect(
                folderService.updateFolder(
                    { params: { folderId: 'not-mine' }, body: { name: 'New Name' } } as any,
                    'user-1'
                )
            ).rejects.toMatchObject({ statusCode: 404, message: 'Folder not found' })

            expect(mockedUpdate).not.toHaveBeenCalled()
        })

        it('throws 409 when renaming collides with an existing sibling', async () => {
            const folder = buildFolder()
            mockedFindFirst
                .mockResolvedValueOnce(folder) // ownership lookup
                .mockResolvedValueOnce(buildFolder({ id: 'other-folder', name: 'Taken' })) // duplicate check

            await expect(
                folderService.updateFolder(
                    { params: { folderId: 'folder-1' }, body: { name: 'Taken' } } as any,
                    'user-1'
                )
            ).rejects.toMatchObject({ statusCode: 409, message: 'A folder with this name already exists here' })

            expect(mockedUpdate).not.toHaveBeenCalled()
        })
    })

    describe('moveFolder', () => {
        it('throws 400 when moving a folder into itself', async () => {
            await expect(
                folderService.moveFolder({ folderId: 'folder-1', parentId: 'folder-1' } as any, 'user-1')
            ).rejects.toMatchObject({ statusCode: 400, message: 'A folder cannot be moved into itself' })

            expect(mockedFindFirst).not.toHaveBeenCalled()
        })

        it('throws 404 when the folder being moved is not owned by the user', async () => {
            mockedFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(buildFolder({ id: 'folder-3' }))

            await expect(
                folderService.moveFolder({ folderId: 'folder-1', parentId: 'folder-3' } as any, 'user-1')
            ).rejects.toMatchObject({ statusCode: 404, message: 'Folder not found' })
        })

        it('throws 404 when the destination folder is not owned by the user', async () => {
            mockedFindFirst.mockResolvedValueOnce(buildFolder()).mockResolvedValueOnce(null)

            await expect(
                folderService.moveFolder({ folderId: 'folder-1', parentId: 'not-mine' } as any, 'user-1')
            ).rejects.toMatchObject({ statusCode: 404, message: 'Destination folder not found' })
        })

        it('throws 400 when moving a folder into its own descendant', async () => {
            const folder = buildFolder({ id: 'folder-1', path: '/folder-1' })
            const descendant = buildFolder({ id: 'folder-2', path: '/folder-1/folder-2' })
            mockedFindFirst.mockResolvedValueOnce(folder).mockResolvedValueOnce(descendant)

            await expect(
                folderService.moveFolder({ folderId: 'folder-1', parentId: 'folder-2' } as any, 'user-1')
            ).rejects.toMatchObject({ statusCode: 400, message: 'A folder cannot be moved into its own descendant' })
        })

        it('throws 409 when the destination already has a folder with the same name', async () => {
            const folder = buildFolder({ id: 'folder-1', name: 'Sub', path: '/parent-a/folder-1' })
            const newParent = buildFolder({ id: 'parent-b', path: '/parent-b' })
            mockedFindFirst
                .mockResolvedValueOnce(folder)
                .mockResolvedValueOnce(newParent)
                .mockResolvedValueOnce(buildFolder({ id: 'other', name: 'Sub' })) // duplicate check

            await expect(
                folderService.moveFolder({ folderId: 'folder-1', parentId: 'parent-b' } as any, 'user-1')
            ).rejects.toMatchObject({ statusCode: 409, message: 'A folder with this name already exists here' })

            expect(mockedTransaction).not.toHaveBeenCalled()
        })

        it('moves a folder and cascades the new path/depth to its descendants', async () => {
            const folder = buildFolder({ id: 'folder-2', name: 'Sub', path: '/folder-1/folder-2', depth: 1 })
            const newParent = buildFolder({ id: 'folder-3', path: '/folder-3', depth: 0 })
            const descendant = buildFolder({ id: 'folder-4', path: '/folder-1/folder-2/folder-4', depth: 2 })

            mockedFindFirst
                .mockResolvedValueOnce(folder)
                .mockResolvedValueOnce(newParent)
                .mockResolvedValueOnce(null) // duplicate check
            mockedFindMany.mockResolvedValue([descendant])

            const result = await folderService.moveFolder({ folderId: 'folder-2', parentId: 'folder-3' } as any, 'user-1')

            expect(mockedFindMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.objectContaining({ path: { startsWith: '/folder-1/folder-2/' } }) })
            )
            expect(mockedUpdate).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    where: { id: 'folder-2' },
                    data: { parentId: 'folder-3', path: '/folder-3/folder-2', depth: 1 },
                })
            )
            expect(mockedUpdate).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    where: { id: 'folder-4' },
                    data: { path: '/folder-3/folder-2/folder-4', depth: 2 },
                })
            )
            expect(result).toHaveLength(2)
        })
    })

    describe('deleteFolder', () => {
        it('soft-deletes the folder and its descendants', async () => {
            const folder = buildFolder({ id: 'folder-1', path: '/folder-1' })
            mockedFindFirst.mockResolvedValueOnce(folder)
            mockedUpdateMany.mockResolvedValue({ count: 3 })

            const result = await folderService.deleteFolder('folder-1', 'user-1')

            expect(mockedFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'folder-1', ownerId: 'user-1', deletedAt: null } })
            )
            expect(mockedUpdateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [{ id: 'folder-1' }, { path: { startsWith: '/folder-1/' } }],
                        deletedAt: null,
                    },
                    data: { deletedAt: expect.any(Date) },
                })
            )
            expect(result).toEqual({ count: 3 })
        })

        it('throws 404 when the folder does not exist or is not owned by the user', async () => {
            mockedFindFirst.mockResolvedValueOnce(null)

            await expect(folderService.deleteFolder('not-mine', 'user-1')).rejects.toMatchObject({
                statusCode: 404,
                message: 'Folder not found',
            })

            expect(mockedUpdateMany).not.toHaveBeenCalled()
        })
    })

    describe('getAllFolder', () => {
        it('returns the folders owned by the user, ordered by path', async () => {
            const folders = [buildFolder({ id: 'folder-1' }), buildFolder({ id: 'folder-2' })]
            mockedFindMany.mockResolvedValue(folders)

            const result = await folderService.getAllFolder('user-1')

            expect(mockedFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { ownerId: 'user-1', deletedAt: null },
                    orderBy: { path: 'asc' },
                })
            )
            expect(result).toEqual(folders)
        })
    })

    describe('getFolder', () => {
        it('returns the folder when it exists and is owned by the user', async () => {
            const folder = buildFolder()
            mockedFindFirst.mockResolvedValueOnce(folder)

            const result = await folderService.getFolder('folder-1', 'user-1')

            expect(mockedFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'folder-1', ownerId: 'user-1', deletedAt: null } })
            )
            expect(result).toEqual(folder)
        })

        it('throws 404 when the folder does not exist or is not owned by the user', async () => {
            mockedFindFirst.mockResolvedValueOnce(null)

            await expect(folderService.getFolder('not-mine', 'user-1')).rejects.toMatchObject({
                statusCode: 404,
                message: 'Folder not found',
            })
        })
    })
})
