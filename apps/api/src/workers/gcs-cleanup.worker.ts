import { Worker } from "bullmq";
import { GCS_CLEANUP_QUEUE } from "../infrastructure/queue";
import { processGcsCleanUpJob } from "./processor/gcs-cleanup.processor";
import type { GcsCleanUpJobData } from "../jobs/gcs-cleanup/gcs-cleanup.types";
import { redisConfig } from "../infrastructure/redis/redis.config";
import config from "../config/env";

export const gcsCleanUpWorker = new Worker<GcsCleanUpJobData>(
    GCS_CLEANUP_QUEUE,

    processGcsCleanUpJob,

    {
        connection: redisConfig,

        prefix: config.queuePrefix,

        // A sweep is a single ordered walk of the bucket handed forward one page
        // at a time: running pages in parallel would only multiply the listing
        // cost against the same objects.
        concurrency: 1
    }
)

gcsCleanUpWorker.on(
    "ready", () => {
        console.log("GCS Cleanup worker is ready")
    }
)

gcsCleanUpWorker.on(
    "active", (job) => {
        console.log(`Job ${job.id} is active`)
    }
)

gcsCleanUpWorker.on(
    "completed", (job) => {
        console.log(`Job ${job.id} is completed`)
    }
)

gcsCleanUpWorker.on(
    "failed", (job, error) => {
        console.error(`Job ${job?.id} failed: `, error)
    }
)

gcsCleanUpWorker.on(
    "error", (error) => {
        console.error("Worker Error", error)
    }
)
