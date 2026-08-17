import { GCS_CLEANUP_INTERVAL, GCS_CLEANUP_JOB_NAME, GCS_CLEANUP_SCHEDULER_ID } from ".";
import { gcsCleanUpQueue } from "../../infrastructure/queue";

export async function registerGcsCleanUpScheduler () {
    await gcsCleanUpQueue.upsertJobScheduler(
        GCS_CLEANUP_SCHEDULER_ID,
        {
            every: GCS_CLEANUP_INTERVAL
        },
        {
            name: GCS_CLEANUP_JOB_NAME,

            opts: {
                attempts: 3,

                backoff: {
                    type: "exponential",
                    delay: 2000
                },

                removeOnComplete: true
            }
        },
    )

    console.log("GCS Cleanup Scheduler Registered")
}
