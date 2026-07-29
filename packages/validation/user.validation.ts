import { z } from 'zod'

export const updateNameSchema = z.object({
    name: z.string().min(2)
})

export const updateAvatarSchema = z.object({
    avatarUrl: z.string().url({ message: 'Invalid URL provided' })
})

export type UpdateNameDto = z.infer<typeof updateNameSchema>
export type updateAvatarDto = z.infer<typeof updateAvatarSchema>