export interface FileMetaDataJobData {
    triggeredAt?: string
}

export interface FileMetaDataJobResult {
    // Files picked up by this run.
    processed: number

    // Files whose metadata was extracted and written.
    completed: number

    // Files left with a failure marker for a later attempt.
    failed: number
}

export type FileCategory = "image" | "video" | "audio" | "document" | "other"

export type FileMetaDataStatus = "extracted" | "failed"

// Only present for images small enough to inspect (see FILE_METADATA_MAX_IMAGE_BYTES).
export interface ImageMetaData {
    width?: number
    height?: number
    format?: string
    space?: string
    hasAlpha?: boolean
    orientation?: number
}

// The shape written to File.metaData. Persisted as JSON, so it is also the
// contract for anything reading the column back.
export interface ExtractedFileMetaData {
    status: FileMetaDataStatus
    extractedAt: string

    contentType?: string
    sizeBytes?: number
    md5Hash?: string
    etag?: string
    extension?: string
    category?: FileCategory

    image?: ImageMetaData

    // Failure bookkeeping: `attempts` is what stops a permanently broken file
    // from being retried on every run forever.
    attempts?: number
    error?: string
}
