import { describe, it, expect } from 'vitest'
import { searchSchema } from '@repo/validation'

const parse = (query: Record<string, string>) => searchSchema.parse({ query })

describe('searchSchema', () => {
    it('applies defaults for an empty query', () => {
        const r = parse({})
        expect(r.query).toMatchObject({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' })
    })

    it('coerces sizes to bigint and dates to Date', () => {
        const r = parse({ minSize: '10', maxSize: '2048', from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' })
        expect(r.query.minSize).toBe(10n)
        expect(r.query.maxSize).toBe(2048n)
        expect(r.query.from).toBeInstanceOf(Date)
    })

    it('rejects junk sizes with a ZodError, not a TypeError', () => {
        for (const bad of ['abc', '1.5', '10n', '-']) {
            const res = searchSchema.safeParse({ query: { minSize: bad } })
            expect(res.success, `minSize=${bad}`).toBe(false)
            expect(res.error!.name).toBe('ZodError')
        }
    })

    it('rejects a negative size and junk dates', () => {
        expect(searchSchema.safeParse({ query: { minSize: '-5' } }).success).toBe(false)
        expect(searchSchema.safeParse({ query: { from: 'not-a-date' } }).success).toBe(false)
    })

    it('rejects an inverted size range and date range', () => {
        const size = searchSchema.safeParse({ query: { minSize: '100', maxSize: '10' } })
        expect(size.success).toBe(false)
        expect(size.error!.issues[0]!.path).toEqual(['query', 'minSize'])

        const date = searchSchema.safeParse({ query: { from: '2026-05-01T00:00:00Z', to: '2026-01-01T00:00:00Z' } })
        expect(date.success).toBe(false)
        expect(date.error!.issues[0]!.path).toEqual(['query', 'from'])
    })

    it('accepts equal bounds', () => {
        expect(searchSchema.safeParse({ query: { minSize: '10', maxSize: '10' } }).success).toBe(true)
    })

    it('enforces pagination and sort bounds', () => {
        expect(searchSchema.safeParse({ query: { page: '0' } }).success).toBe(false)
        expect(searchSchema.safeParse({ query: { limit: '101' } }).success).toBe(false)
        expect(searchSchema.safeParse({ query: { limit: '2.5' } }).success).toBe(false)
        expect(searchSchema.safeParse({ query: { sortBy: 'password' } }).success).toBe(false)
        expect(searchSchema.safeParse({ query: { sortOrder: 'sideways' } }).success).toBe(false)
    })

    it('rejects a non-cuid folderId and an over-long q', () => {
        expect(searchSchema.safeParse({ query: { folderId: 'nope' } }).success).toBe(false)
        expect(searchSchema.safeParse({ query: { q: 'x'.repeat(101) } }).success).toBe(false)
    })

    it('trims q', () => {
        expect(parse({ q: '  report  ' }).query.q).toBe('report')
    })
})
