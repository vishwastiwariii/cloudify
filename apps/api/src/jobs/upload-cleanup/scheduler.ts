import { UPLOAD_CLEANUP_INTERVAL, UPLOAD_CLEANUP_JOB_NAME, UPLOAD_CLEANUP_SCHEDULER_ID } from ".";
import { uploadCleanUpQueue } from "../../infrastructure/queue";

export async function registerUploadCleanUpScheduler () {
    await uploadCleanUpQueue.upsertJobScheduler(
        UPLOAD_CLEANUP_SCHEDULER_ID,
        {
            every: UPLOAD_CLEANUP_INTERVAL
        },
        {
            name: UPLOAD_CLEANUP_JOB_NAME, 

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

    console.log("Upload Cleanup Scheduler Registered")
}
