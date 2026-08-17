import { uploadCleanUpQueue } from "../../infrastructure/queue"
import type { UploadCleanUpJobData } from "./upload-cleanup.types"

export const UPLOAD_CLEANUP_JOB_NAME = "cleanup-expired-upload-session"

export const UPLOAD_CLEANUP_SCHEDULER_ID = "upload-session-cleanup"

export const UPLOAD_CLEANUP_INTERVAL = 60 * 60 * 1000

export const UPLOAD_CLEANUP_BATCH_SIZE = 500

export async function enqueueUploadCleanup () {
    const data: UploadCleanUpJobData = {
        triggeredAt: new Date().toISOString()
    }

    return uploadCleanUpQueue.add(
        UPLOAD_CLEANUP_JOB_NAME,
        data
    )
}
