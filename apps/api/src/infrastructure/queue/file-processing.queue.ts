import { createQueue } from "./queue.factory";


export const fileProcessingQueue = createQueue(
    "file-processing"
)