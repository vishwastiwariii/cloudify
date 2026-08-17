import { Worker } from "bullmq";
import { FILE_PROCESSING_QUEUE } from "../infrastructure/queue";
import { processFileJob } from "./processor/file-processing.processor";
import { redisConfig } from "../infrastructure/redis/redis.config";
import config from "../config/env";

export const fileProcessingWorker = new Worker(
    FILE_PROCESSING_QUEUE,

    processFileJob,

    {
        connection: redisConfig,

        prefix: config.queuePrefix,

        concurrency: 5,
    }
)


fileProcessingWorker.on(
    "ready", () => {
        console.log("File processing worker is ready")
    }
)


fileProcessingWorker.on(
    "active", (job) => {
        console.log(`Job ${job.id} is active`)
    }
)

fileProcessingWorker.on(
    "completed", (job) => {
        console.log(`Job ${job.id} is completed`)
    }
)

fileProcessingWorker.on(
    "failed", (job, error) => {
        console.error(`Job ${job?.id} failed: `, error)
    }
)

fileProcessingWorker.on(
    "error", (error) => {
        console.error("Worker error", error)
    }
)
