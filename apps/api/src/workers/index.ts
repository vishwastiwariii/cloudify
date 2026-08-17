import "../config/env"
import prisma from "@repo/db"
import { uploadCleanUpWorker } from "./upload-cleanup.worker"
import { fileProcessingWorker } from "./file-processing.worker"
import { gcsCleanUpWorker } from "./gcs-cleanup.worker"
import { registerUploadCleanUpScheduler } from "../jobs/upload-cleanup/scheduler"
import { registerGcsCleanUpScheduler } from "../jobs/gcs-cleanup/scheduler"
import { closeQueues } from "../infrastructure/queue"

const workers = [
    fileProcessingWorker,
    uploadCleanUpWorker,
    gcsCleanUpWorker
]

let shuttingDown = false

console.log(
    "Cloudify worker process started"
)

async function startWorkers() {
    await prisma.$queryRaw`SELECT 1`
    console.log("Prisma connected to database successfully")

    await Promise.all(
        workers.map((worker) => worker.waitUntilReady())
    )

    await registerUploadCleanUpScheduler()

    await registerGcsCleanUpScheduler()

    console.log(
        "Cloudify workers started"
    )
}


async function shutDown(exitCode = 0) {
    if(shuttingDown) {
        return
    }

    shuttingDown = true

    console.log("Worker shutdown started")

    try {
       
        await Promise.all(
            workers.map((worker) => worker.close())
        )
        console.log("Workers closed successfully")

        // The scheduler registration opens the cleanup queue in this process too.
        await closeQueues()
        console.log("Queues closed")

        await prisma.$disconnect()
        console.log("Prisma disconnected")

        process.exit(exitCode)
    } catch (error) {
        console.error("Worker shutdown failed: ", error)

        process.exit(1)
    }
}

process.on(
    'SIGTERM',
    () => shutDown()
)

process.on(
    'SIGINT',
    () => shutDown()
)

startWorkers().catch(
    async (error) => {
        console.error("Failed to start workers", error)

        await shutDown(1)
    }
)
