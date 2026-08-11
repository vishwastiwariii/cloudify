import { z } from 'zod'

export const searchSortFieldSchema = z.enum(['createdAt', 'updatedAt', 'name', 'size'])

export const searchSortOrderSchema = z.enum(['asc', 'desc'])

export const searchSchema = z.object({
    query: z.object({
        q: z.string().trim().min(1).max(100).optional(),
        folderId: z.string().cuid().optional(),
        mimeType: z.string().trim().min(1).max(100).optional(),
        minSize: z.coerce.bigint().nonnegative().optional(),
        maxSize: z.coerce.bigint().nonnegative().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        sortBy: searchSortFieldSchema.default('createdAt'),
        sortOrder: searchSortOrderSchema.default('desc')
    })
}).superRefine((data, ctx) => {
    const { minSize, maxSize, from, to } = data.query

    if (minSize !== undefined && maxSize !== undefined && minSize > maxSize) {
        ctx.addIssue({
            code: 'custom',
            path: ['query', 'minSize'],
            message: 'minSize cannot be greater than maxSize'
        })
    }

    if (from && to && from.getTime() > to.getTime()) {
        ctx.addIssue({
            code: 'custom',
            path: ['query', 'from'],
            message: 'from cannot be later than to'
        })
    }
})

export type SearchDto = z.infer<typeof searchSchema>
