import { createQueue } from "./queue.factory";

export const FILE_PROCESSING_QUEUE = "file-processing";

export const fileProcessingQueue = createQueue(
    FILE_PROCESSING_QUEUE
)

await fileProcessingQueue.add(
    "test-job", 
    {
        message: "Hello from Cloudify"
    }
)

