import { fileMetaDataQueue } from "../../infrastructure/queue"
import type { FileMetaDataJobData } from "./file-metadata.types"

export const FILE_METADATA_JOB_NAME = "file-metadata-extract"

export const FILE_METADATA_SCHEDULER_ID = "file-metadata-backfill"

// Frequent enough that a file uploaded today is described by tomorrow, cheap
// enough that an idle instance does almost nothing: the scan matches on an
// indexed column and returns no rows once the backlog is clear.
export const FILE_METADATA_INTERVAL = 6 * 60 * 60 * 1000

// Files handled per run. Smaller than the cleanup batches because a run may
// download image bytes rather than only touching the database.
export const FILE_METADATA_BATCH_SIZE = 100

// After this many failed attempts a file is left alone: whatever is wrong with
// it is not going to fix itself, and retrying forever would starve the batch.
export const FILE_METADATA_MAX_ATTEMPTS = 3

// Images above this are described from their storage metadata only. The bytes
// have to come into memory for sharp to read them, so the ceiling is what keeps
// one pathological upload from taking the worker down.
export const FILE_METADATA_MAX_IMAGE_BYTES = 25 * 1024 * 1024

export async function enqueueFileMetaData () {
    const data: FileMetaDataJobData = {
        triggeredAt: new Date().toISOString()
    }

    return fileMetaDataQueue.add(
        FILE_METADATA_JOB_NAME,
        data
    )
}
