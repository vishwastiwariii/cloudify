import { fileProcessingQueue, uploadCleanUpQueue } from "../../infrastructure/queue"
import type { UploadCleanUpJobData } from "./upload-cleanup.types"

export const UPLOAD_CLEANUP_JOB_NAME = "cleanup-expired-upload-session"

export async function enqueueUploadCleanup () {
    const data: UploadCleanUpJobData = {
        triggeredAt: new Date().toISOString()
    }

    return uploadCleanUpQueue.add(
        UPLOAD_CLEANUP_JOB_NAME, 
        data
    )
}