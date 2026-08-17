import { gcsCleanUpQueue } from "../../infrastructure/queue"
import type { GcsCleanUpJobData } from "./gcs-cleanup.types"

export const GCS_CLEANUP_JOB_NAME = "cleanup-orphaned-gcs-objects"

export const GCS_CLEANUP_SCHEDULER_ID = "gcs-orphan-cleanup"

export const GCS_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000

export const GCS_CLEANUP_BATCH_SIZE = 500

// An object younger than this is never touched, whatever the database says.

export const GCS_CLEANUP_MIN_OBJECT_AGE = 24 * 60 * 60 * 1000

// Only user upload keys are in scope (see UploadService.generateObjectKey).
export const GCS_CLEANUP_PREFIX = "users/"

export async function enqueueGcsCleanUp (pageToken?: string) {
    const data: GcsCleanUpJobData = {
        triggeredAt: new Date().toISOString(),
        ...(pageToken !== undefined && { pageToken })
    }

    return gcsCleanUpQueue.add(
        GCS_CLEANUP_JOB_NAME,
        data
    )
}
