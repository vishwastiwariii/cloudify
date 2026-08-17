import { createQueue } from "./queue.factory";

export const UPLOAD_CLEANUP_QUEUE = "upload-cleanup"

export const uploadCleanUpQueue = createQueue(
    UPLOAD_CLEANUP_QUEUE
)