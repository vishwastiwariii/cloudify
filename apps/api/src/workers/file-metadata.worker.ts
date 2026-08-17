import { Worker } from "bullmq";
import { FILE_METADATA_QUEUE } from "../infrastructure/queue";
import { processFileMetadata } from "./processor/file-metadata.processor";
import type { FileMetaDataJobData } from "../jobs/file-metadata/file-metadata.types";
import { redisConfig } from "../infrastructure/redis/redis.config";
import config from "../config/env";


export const fileMetaDataWorker = new Worker<FileMetaDataJobData>(
    FILE_METADATA_QUEUE,
    processFileMetadata,
    {
        connection: redisConfig,

        prefix: config.queuePrefix,

        // The scheduled backfill is one scan of the pending files: parallel
        // copies of it would only fight over the same rows.
        concurrency: 1
    }
)

fileMetaDataWorker.on(
    "ready", () => {
        console.log(`File Metadata worker is ready`)
    }
)

fileMetaDataWorker.on(
    "active", (job) => {
        console.log(`Job ${job.id} is active`)
    }
)

fileMetaDataWorker.on(
    "completed", (job) => {
        console.log(`Job ${job.id} is completed`)
    }
)

fileMetaDataWorker.on(
    "failed", (job, err) => {
        console.error(`Job ${job?.id} is failed: `, err)
    }
)

fileMetaDataWorker.on(
    "error", (error) => {
        console.error("Worker Error", error)
    }
)