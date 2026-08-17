import type { Job } from "bullmq";

export async function processFileJob(
    job: Job
) {
    switch(job.name) {
        default:
            throw new Error(
                `Unknown job: ${job.name}`
            )
    }
}
