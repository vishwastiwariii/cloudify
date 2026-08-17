import type { Job } from "bullmq";
import type {
    ExtractedFileMetaData,
    FileCategory,
    FileMetaDataJobData,
    FileMetaDataJobResult
} from "./file-metadata.types";
import prisma, { Prisma } from "@repo/db";
import sharp from "sharp";
import path from "path";
import { storageProvider } from "../../infrastructure/storage";
import {
    FILE_METADATA_BATCH_SIZE,
    FILE_METADATA_MAX_ATTEMPTS,
    FILE_METADATA_MAX_IMAGE_BYTES
} from ".";

// A file to describe: never extracted, or a previous attempt failed and is
// still within its retry budget.
interface PendingFile {
    id: string
    storageKey: string
    mimeType: string
    size: bigint
    metaData: Prisma.JsonValue
}

export async function processFileMetaData (
    job: Job<FileMetaDataJobData>
): Promise<FileMetaDataJobResult> {
    const triggeredAt = job.data.triggeredAt ?? new Date(job.timestamp).toISOString()

    console.log(
        `Starting file metadata extraction job: ${job.id} (triggered at ${triggeredAt})`
    )

    const files = await findPendingFiles()

    console.log(
        `Found ${files.length} files awaiting metadata`
    )

    let completed = 0
    let failed = 0

    for(const file of files) {
        try {
            const metaData = await extractMetaData(file)

            await prisma.file.update({
                where: {
                    id: file.id
                },
                data: {
                    metaData: metaData as unknown as Prisma.InputJsonValue,
                    // The bucket already computed a digest on write, so the
                    // column can be filled without hashing the bytes again.
                    ...(metaData.md5Hash !== undefined && { checkSum: metaData.md5Hash })
                }
            })

            completed++
        } catch (error) {
            // One unreadable file must not abort the rest of the batch.
            failed++

            console.error(
                `Failed to extract metadata for file ${file.id}: `,
                error
            )

            await recordFailure(file, error)
        }
    }

    console.log(
        `File metadata job ${job.id} finished: ${completed} completed, ${failed} failed`
    )

    return {
        processed: files.length,
        completed,
        failed
    }
}


function findPendingFiles (): Promise<PendingFile[]> {
    return prisma.file.findMany({
        where: {
            deletedAt: null,
            OR: [
                // Never attempted. DbNull is the column being SQL NULL, as
                // opposed to JsonNull which would be a stored `null` value.
                {
                    metaData: {
                        equals: Prisma.DbNull
                    }
                },

                // Attempted and failed, but not yet out of retries.
                {
                    AND: [
                        {
                            metaData: {
                                path: ["status"],
                                equals: "failed"
                            }
                        },
                        {
                            metaData: {
                                path: ["attempts"],
                                lt: FILE_METADATA_MAX_ATTEMPTS
                            }
                        }
                    ]
                }
            ]
        },
        select: {
            id: true,
            storageKey: true,
            mimeType: true,
            size: true,
            metaData: true
        },
        // Oldest first, so a backlog drains in order across runs.
        orderBy: {
            createdAt: "asc"
        },
        take: FILE_METADATA_BATCH_SIZE
    })
}


async function extractMetaData (
    file: PendingFile
): Promise<ExtractedFileMetaData> {
    const object = await storageProvider.getObjectMetaData(file.storageKey)

    const contentType = object.contentType || file.mimeType

    const category = categorize(contentType)

    const metaData: ExtractedFileMetaData = {
        status: "extracted",
        extractedAt: new Date().toISOString(),
        contentType,
        sizeBytes: object.size,
        extension: path.extname(file.storageKey).toLowerCase(),
        category,
        ...(object.md5Hash !== undefined && { md5Hash: object.md5Hash }),
        ...(object.etag !== undefined && { etag: object.etag })
    }

    // Anything else is described by what the bucket already knows: reading
    // dimensions is the only part that needs the bytes themselves.
    if(category === "image" && object.size <= FILE_METADATA_MAX_IMAGE_BYTES) {
        metaData.image = await extractImageMetaData(file.storageKey)
    }

    return metaData
}


async function extractImageMetaData (
    storageKey: string
) {
    const buffer = await storageProvider.downloadObject(storageKey)

    const image = await sharp(buffer).metadata()

    return {
        ...(image.width !== undefined && { width: image.width }),
        ...(image.height !== undefined && { height: image.height }),
        ...(image.format !== undefined && { format: image.format }),
        ...(image.space !== undefined && { space: image.space }),
        ...(image.hasAlpha !== undefined && { hasAlpha: image.hasAlpha }),
        ...(image.orientation !== undefined && { orientation: image.orientation })
    }
}


function categorize (
    contentType: string
): FileCategory {
    if(contentType.startsWith("image/")) {
        return "image"
    }

    if(contentType.startsWith("video/")) {
        return "video"
    }

    if(contentType.startsWith("audio/")) {
        return "audio"
    }

    if(contentType.startsWith("text/") || DOCUMENT_TYPES.has(contentType)) {
        return "document"
    }

    return "other"
}

const DOCUMENT_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
])


// Writes the marker that makes the failure visible and bounded. It must not
// throw: it runs on the failure path, where throwing would lose the batch.
async function recordFailure (
    file: PendingFile,
    error: unknown
) {
    const previous = file.metaData as { attempts?: unknown } | null

    const attempts = typeof previous?.attempts === "number"
        ? previous.attempts + 1
        : 1

    const marker: ExtractedFileMetaData = {
        status: "failed",
        extractedAt: new Date().toISOString(),
        attempts,
        error: error instanceof Error ? error.message : String(error)
    }

    try {
        await prisma.file.update({
            where: {
                id: file.id
            },
            data: {
                metaData: marker as unknown as Prisma.InputJsonValue
            }
        })
    } catch (markerError) {
        console.error(
            `Failed to record metadata failure for file ${file.id}: `,
            markerError
        )
    }
}
