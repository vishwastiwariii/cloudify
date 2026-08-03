import prisma from '@repo/db'
import type { CreateFileDto, ListFileDto, MoveFileDto, RenameFileDto } from '@repo/validation'
import { AuthError } from '../auth/auth.service'

export class FileService {

    private serializeFile<T extends { size: bigint }>(file: T) {
        return {
            ...file,
            size: file.size.toString()
        }
    }

    async createFile(dto: CreateFileDto, userId: string) {
        const { name, folderId, originalName, storageKey, bucket, mimeType, size, checkSum } = dto

        const folder = folderId
            ? await prisma.folder.findFirst({
                where: {
                    id: folderId,
                    ownerId: userId,
                    deletedAt: null
                }
            })
            : null

        if (folderId && !folder) {
            throw new AuthError('Folder not found', 404)
        }

        const existingFile = await prisma.file.findFirst({
            where: {
                ownerId: userId,
                folderId: folderId ?? null,
                name: name,
                deletedAt: null
            }
        })

        if (existingFile) {
            throw new AuthError('A file with this name already exists here', 409)
        }

        const file = await prisma.file.create({
            data: {
                name,
                originalName,
                storageKey,
                bucket,
                mimeType,
                size,
                checkSum: checkSum ?? null,
                folderId: folderId ?? null,
                ownerId: userId
            }
        })

        return this.serializeFile(file)
    }

    async getAllFile(userId: string, query: ListFileDto['query']) {
        const { folderId, search, page, limit } = query

        const where = {
            ownerId: userId,
            deletedAt: null,
            folderId: folderId ?? null,
            ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {})
        }

        const [files, total] = await Promise.all([
            prisma.file.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.file.count({ where })
        ])

        return {
            files: files.map((file) => this.serializeFile(file)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    async getFile(fileId: string, userId: string) {
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                ownerId: userId,
                deletedAt: null
            }
        })

        if (!file) {
            throw new AuthError('File not found', 404)
        }

        return this.serializeFile(file)
    }

    async renameFile(dto: RenameFileDto, userId: string) {
        const { body, params } = dto

        const file = await prisma.file.findFirst({
            where: {
                id: params.fileId,
                ownerId: userId,
                deletedAt: null
            }
        })

        if (!file) {
            throw new AuthError('File not found', 404)
        }

        const existingFile = await prisma.file.findFirst({
            where: {
                ownerId: userId,
                folderId: file.folderId,
                name: body.name,
                deletedAt: null,
                NOT: {
                    id: file.id
                }
            }
        })

        if (existingFile) {
            throw new AuthError('A file with this name already exists here', 409)
        }

        const updated = await prisma.file.update({
            where: {
                id: file.id
            },
            data: {
                name: body.name
            }
        })

        return this.serializeFile(updated)
    }

    async moveFile(dto: MoveFileDto, userId: string) {
        const { body, params } = dto

        const file = await prisma.file.findFirst({
            where: {
                id: params.fileId,
                ownerId: userId,
                deletedAt: null
            }
        })

        if (!file) {
            throw new AuthError('File not found', 404)
        }

        const destinationFolder = body.folderId
            ? await prisma.folder.findFirst({
                where: {
                    id: body.folderId,
                    ownerId: userId,
                    deletedAt: null
                }
            })
            : null

        if (body.folderId && !destinationFolder) {
            throw new AuthError('Destination folder not found', 404)
        }

        const existingFile = await prisma.file.findFirst({
            where: {
                ownerId: userId,
                folderId: body.folderId ?? null,
                name: file.name,
                deletedAt: null,
                NOT: {
                    id: file.id
                }
            }
        })

        if (existingFile) {
            throw new AuthError('A file with this name already exists here', 409)
        }

        const updated = await prisma.file.update({
            where: {
                id: file.id
            },
            data: {
                folderId: body.folderId ?? null
            }
        })

        return this.serializeFile(updated)
    }

    async deleteFile(fileId: string, userId: string) {
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                ownerId: userId,
                deletedAt: null
            }
        })

        if (!file) {
            throw new AuthError('File not found', 404)
        }

        const deleted = await prisma.file.update({
            where: {
                id: file.id
            },
            data: {
                deletedAt: new Date()
            }
        })

        return this.serializeFile(deleted)
    }
}
