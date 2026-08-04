import { z } from 'zod'

export const initiateUploadSchema = z.object({
    fileName: z.string(), 
    mimeType: z.string(), 
    size: z.number(), 
    folderId: z.string().optional()
})

export const completeUploadSchema = z.object({
    uploadId: z.string()
})

export type CompleteUploadDto = z.infer<typeof completeUploadSchema>
export type InitiateUploadDto = z.infer<typeof initiateUploadSchema>