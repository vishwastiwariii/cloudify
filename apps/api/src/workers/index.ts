import { uploadCleanUpWorker } from "./upload-cleanup.worker"
import { fileProcessingWorker } from "./file-processing.worker"

let shuttingDown = false

console.log(
    "Cloudify worker process started"
)


async function shutDown() {
    if(shuttingDown) {
        return 
    }

    shuttingDown = true

    console.log("Worker shutdown started")

    try {
        await fileProcessingWorker.close()

        await uploadCleanUpWorker.close()

        console.log("Worker closed successfully")

        process.exit(0)
    } catch (error) {
        console.error("Worker shutdown failed: ", error)

        process.exit(1)
    }
}

process.on(
    'SIGTERM', 
    shutDown
)

process.on(
    'SIGINT',
    shutDown
)