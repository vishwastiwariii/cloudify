export interface UploadCleanUpJobData {
    triggeredAt?: string
}

export interface UploadCleanUpJobResult {
    // Expired sessions picked up by this run.
    found: number

    // Sessions whose object was removed and row marked CANCELLED.
    cleaned: number

    // Sessions left PENDING for the next run because cleanup threw.
    failed: number
}
