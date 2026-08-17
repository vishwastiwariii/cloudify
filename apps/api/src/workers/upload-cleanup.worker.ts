import { Worker } from "bullmq";
import { UPLOAD_CLEANUP_QUEUE } from "../infrastructure/queue";
import { processUploadCleanUpJob } from "./processor/upload-cleanup.processor";
import type { UploadCleanUpJobData } from "../jobs/upload-cleanup/upload-cleanup.types";
import { redisConfig } from "../infrastructure/redis/redis.config";
import config from "../config/env";

export const uploadCleanUpWorker = new Worker<UploadCleanUpJobData>(
    UPLOAD_CLEANUP_QUEUE,

    processUploadCleanUpJob,

    {
        connection: redisConfig,

        prefix: config.queuePrefix,

        // The scheduled cleanup is one full scan of the expired sessions:
        // parallel copies of it would only fight over the same rows.
        concurrency: 1
    }
)

uploadCleanUpWorker.on(
    "ready", () => {
        console.log("Upload Cleanup worker is ready")
    }
)

uploadCleanUpWorker.on(
    "active", (job) => {
        console.log(`Job ${job.id} is active`)
    }
)

uploadCleanUpWorker.on(
    "completed", (job) => {
        console.log(`Job ${job.id} is completed`)
    }
)

uploadCleanUpWorker.on(
    "failed", (job, error) => {
        console.error(`Job ${job?.id} failed: `, error)
    }
)

uploadCleanUpWorker.on(
    "error", (error) => {
        console.error("Worker Error", error)
    }
)
