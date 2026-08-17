import type { Job } from "bullmq";
import type { FileMetaDataJobData } from "../../jobs/file-metadata/file-metadata.types";
import { FILE_METADATA_JOB_NAME } from "../../jobs/file-metadata";
import { processFileMetaData } from "../../jobs/file-metadata/file-metadata.processor";


export async function processFileMetadata(
    job: Job<FileMetaDataJobData>
) {
    switch(job.name) {
        case FILE_METADATA_JOB_NAME:
            return processFileMetaData(
                job
            )

        default:
            throw new Error(
                `Unknown job: ${job.name}`
            )
    }
}