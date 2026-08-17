import { gcsCleanUpQueue } from "../../infrastructure/queue"
import type { GcsCleanUpJobData } from "./gcs-cleanup.types"

export const GCS_CLEANUP_JOB_NAME = "cleanup-orphaned-gcs-objects"

export const GCS_CLEANUP_SCHEDULER_ID = "gcs-orphan-cleanup"

// Daily, not hourly: a full bucket listing costs a class A operation per page,
// and an orphan sitting for a day costs only storage.
export const GCS_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000

// Objects listed per run, bounded so one job is a page of work rather than an
// unbounded walk of the bucket. The remainder continues in a follow-up job.
export const GCS_CLEANUP_BATCH_SIZE = 500

// An object younger than this is never touched, whatever the database says.
// The upload flow writes the session row before handing out the signed URL, so
// a row always precedes its object — this is the guard against the reverse
// still being briefly true under clock skew or a retried write.
export const GCS_CLEANUP_MIN_OBJECT_AGE = 24 * 60 * 60 * 1000

// Only user upload keys are in scope (see UploadService.generateObjectKey).
// Anything else in the bucket is owned by something this job can't reason about.
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
