import { FILE_METADATA_INTERVAL, FILE_METADATA_JOB_NAME, FILE_METADATA_SCHEDULER_ID } from ".";
import { fileMetaDataQueue } from "../../infrastructure/queue";

export async function registerFileMetaDataScheduler () {
    await fileMetaDataQueue.upsertJobScheduler(
        FILE_METADATA_SCHEDULER_ID,
        {
            every: FILE_METADATA_INTERVAL
        },
        {
            name: FILE_METADATA_JOB_NAME,

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

    console.log("File Metadata Scheduler Registered")
}
