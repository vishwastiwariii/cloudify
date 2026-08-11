import type { SearchDto } from '@repo/validation'

// Derived from the Zod schema so the filter contract can't drift away from
// what the controller actually parses.
export type SearchFilters = SearchDto['query']

export type SearchSortField = SearchFilters['sortBy']

export type SearchSortOrder = SearchFilters['sortOrder']

export interface SearchFileResult {
    id: string,
    name: string,
    mimeType: string,
    size: string,  //api results string and db use bigint to avoid json serialization issues
    folderId: string | null,
    createdAt: Date;
    updatedAt: Date
}

export interface SearchPagination {
    page: number,
    limit: number,
    total: number,
    totalPages: number
}

export interface SearchResponse {
    items: SearchFileResult[],
    pagination: SearchPagination
}
