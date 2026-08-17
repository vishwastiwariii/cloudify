import { UPLOAD_CLEANUP_INTERVAL, UPLOAD_CLEANUP_JOB_NAME, UPLOAD_CLEANUP_SCHEDULER_ID } from ".";
import { uploadCleanUpQueue } from "../../infrastructure/queue";

// Idempotent by scheduler id: every worker boot upserts the same schedule
// instead of stacking a new repeating job.
export async function registerUploadCleanUpScheduler () {
    await uploadCleanUpQueue.upsertJobScheduler(
        UPLOAD_CLEANUP_SCHEDULER_ID,
        {
            every: UPLOAD_CLEANUP_INTERVAL
        },
        {
            name: UPLOAD_CLEANUP_JOB_NAME
        }
    )

    console.log("Upload Cleanup Scheduler Registered")
}
