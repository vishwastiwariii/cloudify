export interface GcsCleanUpJobData {
    triggeredAt?: string

    // Where in the bucket listing this run picks up. Absent starts a fresh
    // sweep; a run that ends with objects left over hands its token to the
    // follow-up job.
    pageToken?: string
}

export interface GcsCleanUpJobResult {
    // Objects listed from the bucket by this run.
    processed: number

    // Orphans whose object was removed.
    cleaned: number

    // Objects left alone: still owned, or too new to judge.
    skipped: number

    // Orphans left in the bucket because the delete threw.
    failed: number

    // Set when the sweep continues in a follow-up job.
    nextPageToken?: string
}
