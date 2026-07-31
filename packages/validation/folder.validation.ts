import { z } from 'zod'

export const createFolderSchema = z.object({
    name: z.string().trim().min(2).max(100),
    parentId: z.string().optional(), 
})

export const folderIdParamsSchema = z.object({
    folderId: z.string().cuid()
})

export const updateFolderSchema = z.object({
   body: createFolderSchema, 
   params: folderIdParamsSchema
})

export const moveFolderSchema = z.object({
    folderId: z.string().trim(),
    parentId: z.string().trim()
})

export type CreateFolderDto = z.infer<typeof createFolderSchema>
export type UpdateFolderDto = z.infer<typeof updateFolderSchema>
export type MoveFolderDto = z.infer<typeof moveFolderSchema>
export type GetFolderIdDto = z.infer<typeof folderIdParamsSchema>