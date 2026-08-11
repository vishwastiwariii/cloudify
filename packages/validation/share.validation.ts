import { z } from 'zod'
import { fileIdParamsSchema } from './file.validation'

const MAX_SHARE_EXPIRY = 365 * 24 * 60 * 60 * 1000

export const shareTokenParamsSchema = z.object({
    token: z.string().trim().min(20).max(128).regex(/^[A-Za-z0-9_-]+$/, 'Invalid share token')
})

export const shareExpirySchema = z.coerce
    .date()
    .refine((date) => date.getTime() > Date.now(), 'Expiry must be in the future')
    .refine((date) => date.getTime() <= Date.now() + MAX_SHARE_EXPIRY, 'Expiry cannot be more than a year away')

export const createShareSchema = z.object({
    // defaulted because express leaves req.body undefined when no payload is sent
    body: z.object({
        password: z.string().min(6, 'Password must be 6 characters long').max(100).optional(),
        expiresAt: shareExpirySchema.optional()
    }).default({}),
    params: fileIdParamsSchema
})

export const getShareSchema = z.object({
    params: fileIdParamsSchema
})

export const disableShareSchema = z.object({
    params: fileIdParamsSchema
})

export const accessShareSchema = z.object({
    body: z.object({
        password: z.string().min(1, 'Password is required').optional()
    }).default({}),
    params: shareTokenParamsSchema
})

export type CreateShareDto = z.infer<typeof createShareSchema>
export type GetShareDto = z.infer<typeof getShareSchema>
export type DisableShareDto = z.infer<typeof disableShareSchema>
export type AccessShareDto = z.infer<typeof accessShareSchema>
