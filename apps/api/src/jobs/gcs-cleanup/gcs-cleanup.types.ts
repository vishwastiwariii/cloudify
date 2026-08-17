export interface GcsCleanUpJobData {
    triggeredAt?: string

    pageToken?: string
}

export interface GcsCleanUpJobResult {
    
    processed: number


    cleaned: number


    skipped: number

    failed: number

    nextPageToken?: string
}
