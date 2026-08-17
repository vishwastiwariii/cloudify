import type { Job } from "bullmq";
import { GCS_CLEANUP_JOB_NAME } from "../../jobs/gcs-cleanup";
import { processGcsCleanUp } from "../../jobs/gcs-cleanup/gcs-cleanup.processor";
import type { GcsCleanUpJobData } from "../../jobs/gcs-cleanup/gcs-cleanup.types";

export async function processGcsCleanUpJob(
    job: Job<GcsCleanUpJobData>
) {
    switch(job.name) {
        case GCS_CLEANUP_JOB_NAME:
            return processGcsCleanUp(
                job
            )

        default:
            throw new Error(
                `Unknown job: ${job.name}`
            )
    }
}
