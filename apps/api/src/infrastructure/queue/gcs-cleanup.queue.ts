import { createQueue } from "./queue.factory"

export const GCS_CLEANUP_QUEUE = "gcs-cleanup"

export const gcsCleanUpQueue = createQueue(
    GCS_CLEANUP_QUEUE
)