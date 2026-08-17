import { createQueue } from "./queue.factory"


export const FILE_METADATA_QUEUE = "file-metadata"

export const fileMetaDataQueue = createQueue(
    FILE_METADATA_QUEUE
)