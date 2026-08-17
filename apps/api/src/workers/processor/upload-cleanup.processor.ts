import type { Job } from "bullmq";
import { UPLOAD_CLEANUP_JOB_NAME } from "../../jobs/upload-cleanup";
import { processUploadCleanUp } from "../../jobs/upload-cleanup/upload-cleanup.processor";
import type { UploadCleanUpJobData } from "../../jobs/upload-cleanup/upload-cleanup.types";

export async function processUploadCleanUpJob(
    job: Job<UploadCleanUpJobData>
) {
    switch(job.name) {
        case UPLOAD_CLEANUP_JOB_NAME:
            return processUploadCleanUp(
                job
            )

        default:
            throw new Error(
                `Unknown job: ${job.name}`
            )
    }
}
