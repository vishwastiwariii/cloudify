import { Worker } from "bullmq";
import { UPLOAD_CLEANUP_JOB_NAME } from "../jobs/upload-cleanup";
import { processUploadCleanUp } from "../jobs/upload-cleanup/upload-cleanup.processor";
import { redisConfig } from "../infrastructure/redis/redis.config";
import config from "../config/env";

export const uploadCleanUpWorker = new Worker(
    UPLOAD_CLEANUP_JOB_NAME, 
    processUploadCleanUp, 
    {
        connection: redisConfig, 

        prefix: config.queuePrefix,

        concurrency: 5
    }
)

uploadCleanUpWorker.on(
    "ready", () => {
        console.log("Upload Cleanup worker is ready")
    }
)

uploadCleanUpWorker.on(
    "active", (job) => {
        console.log(`${job.id} is created`)
    }
)

uploadCleanUpWorker.on(
    "completed", (job) => {
        console.log(`Job: ${job.id} is completed`)
    }
)

uploadCleanUpWorker.on(
    "failed", (job) => {
        console.log(`${job?.id} is failed`)
    }
)

uploadCleanUpWorker.on(
    "error", (error) => {
        console.error("Worker Error", error)
    }
)