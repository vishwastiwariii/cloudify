import { z } from 'zod'
import { fileIdParamsSchema } from './file.validation'

export const downloadFileSchema = z.object({
    params: fileIdParamsSchema
})

export type DownloadFileDto = z.infer<typeof downloadFileSchema>
