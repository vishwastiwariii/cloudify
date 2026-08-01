import { z } from 'zod'

export const createFileSchema = z.object({
    name: z.string().trim().min(1).max(255),
    folderId: z.string().cuid().optional()
})

export const fileIdParamsSchema = z.object({
    fileId: z.string().cuid()
})

export const getFileSchema = z.object({
    params: fileIdParamsSchema
})

export const listFileSchema = z.object({
    query: z.object({
        folderId: z.string().cuid().optional(),
        search: z.string().trim().optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20)
    })
})

export const renameFileSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1).max(255)
    }),
    params: fileIdParamsSchema
})

export const moveFileSchema = z.object({
    body: z.object({
        folderId: z.string().cuid().nullable()
    }),
    params: fileIdParamsSchema
})

export const deleteFileSchema = z.object({
    params: fileIdParamsSchema
})

export type CreateFileDto = z.infer<typeof createFileSchema>
export type GetFileDto = z.infer<typeof getFileSchema>
export type ListFileDto = z.infer<typeof listFileSchema>
export type RenameFileDto = z.infer<typeof renameFileSchema>
export type MoveFileDto = z.infer<typeof moveFileSchema>
export type DeleteFileDto = z.infer<typeof deleteFileSchema>
