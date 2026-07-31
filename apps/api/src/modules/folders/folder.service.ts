import prisma from '@repo/db'
import type { CreateFolderDto, MoveFolderDto, UpdateFolderDto } from '@repo/validation'
import { AuthError } from '../auth/auth.service'

export class FolderService {

    async createFolder(dto: CreateFolderDto, userId: string) {
        const { name, parentId } = dto

        const parent = parentId
            ? await prisma.folder.findFirst({
                where: {
                    id: parentId,
                    ownerId: userId,
                    deletedAt: null
                }
            })
            : null

        if (parentId && !parent) {
            throw new AuthError('Parent folder not found', 404)
        }

        const existingFolder = await prisma.folder.findFirst({
            where: {
                ownerId: userId,
                parentId: parentId ?? null,
                name: name,
                deletedAt: null
            }
        })

        if (existingFolder) {
            throw new AuthError('A folder with this name already exists here', 409)
        }

        const depth = parent ? parent.depth + 1 : 0

        return prisma.$transaction(async (tx) => {
            const folder = await tx.folder.create({
                data: {
                    name: name,
                    parentId: parentId ?? null,
                    ownerId: userId,
                    path: '',
                    depth: depth
                }
            })

            const path = parent ? `${parent.path}/${folder.id}` : `/${folder.id}`

            return tx.folder.update({
                where: {
                    id: folder.id
                },
                data: {
                    path: path
                }
            })
        })
    }

    async updateFolder(dto: UpdateFolderDto, userId: string) {
        const { params, body } = dto

        const folder = await prisma.folder.findFirst({
            where: {
                id: params.folderId,
                ownerId: userId,
                deletedAt: null
            }
        })

        if (!folder) {
            throw new AuthError('Folder not found', 404)
        }

        const existingFolder = await prisma.folder.findFirst({
            where: {
                ownerId: folder.ownerId,
                parentId: folder.parentId,
                name: body.name,
                deletedAt: null,
                NOT: {
                    id: folder.id
                }
            }
        })

        if (existingFolder) {
            throw new AuthError('A folder with this name already exists here', 409)
        }

        return prisma.folder.update({
            where: {
                id: folder.id
            },
            data: {
                name: body.name
            }
        })
    }

    async moveFolder(dto: MoveFolderDto, userId: string) {
        const { folderId, parentId } = dto

        if (folderId === parentId) {
            throw new AuthError('A folder cannot be moved into itself', 400)
        }

        const [folder, newParent] = await Promise.all([
            prisma.folder.findFirst({
                where: {
                    id: folderId,
                    ownerId: userId,
                    deletedAt: null
                }
            }),
            prisma.folder.findFirst({
                where: {
                    id: parentId,
                    ownerId: userId,
                    deletedAt: null
                }
            })
        ])

        if (!folder) {
            throw new AuthError('Folder not found', 404)
        }

        if (!newParent) {
            throw new AuthError('Destination folder not found', 404)
        }

        if (newParent.id === folder.id || newParent.path.startsWith(`${folder.path}/`)) {
            throw new AuthError('A folder cannot be moved into its own descendant', 400)
        }

        const existingFolder = await prisma.folder.findFirst({
            where: {
                ownerId: userId,
                parentId: newParent.id,
                name: folder.name,
                deletedAt: null,
                NOT: {
                    id: folder.id
                }
            }
        })

        if (existingFolder) {
            throw new AuthError('A folder with this name already exists here', 409)
        }

        const oldPath = folder.path
        const newPath = `${newParent.path}/${folder.id}`
        const depthDelta = (newParent.depth + 1) - folder.depth

        const descendants = await prisma.folder.findMany({
            where: {
                path: {
                    startsWith: `${oldPath}/`
                },
                deletedAt: null
            }
        })

        return prisma.$transaction([
            prisma.folder.update({
                where: {
                    id: folder.id
                },
                data: {
                    parentId: newParent.id,
                    path: newPath,
                    depth: newParent.depth + 1
                }
            }),
            ...descendants.map((descendant) =>
                prisma.folder.update({
                    where: {
                        id: descendant.id
                    },
                    data: {
                        path: newPath + descendant.path.slice(oldPath.length),
                        depth: descendant.depth + depthDelta
                    }
                })
            )
        ])
    }

    async deleteFolder(folderId: string, userId: string): Promise<{ count: number }> {
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                ownerId: userId,
                deletedAt: null
            }
        })

        if (!folder) {
            throw new AuthError('Folder not found', 404)
        }

        return prisma.folder.updateMany({
            where: {
                OR: [
                    { id: folder.id },
                    { path: { startsWith: `${folder.path}/` } }
                ],
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        })
    }

    async getAllFolder(userId: string) {
        return prisma.folder.findMany({
            where: {
                ownerId: userId,
                deletedAt: null
            },
            orderBy: {
                path: 'asc'
            }
        })
    }

    async getFolder(folderId: string, userId: string) {
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                ownerId: userId,
                deletedAt: null
            }
        })

        if (!folder) {
            throw new AuthError('Folder not found', 404)
        }

        return folder
    }
}
