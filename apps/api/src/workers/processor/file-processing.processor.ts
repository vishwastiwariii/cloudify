import { Job } from "bullmq";
import { UPLOAD_CLEANUP_JOB_NAME } from "../../jobs/upload-cleanup";
import { processUploadCleanUp } from "../../jobs/upload-cleanup/upload-cleanup.processor";

export async function processFileJob(
    job: Job
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