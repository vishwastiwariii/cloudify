import type { Job } from "bullmq";
import type { UploadCleanUpJobData, UploadCleanUpJobResult } from "./upload-cleanup.types";
import prisma from "@repo/db";
import { storageProvider } from "../../infrastructure/storage";
import { UPLOAD_CLEANUP_BATCH_SIZE } from ".";

export async function processUploadCleanUp (
    job: Job<UploadCleanUpJobData>
): Promise<UploadCleanUpJobResult> {
    const triggeredAt = job.data.triggeredAt ?? new Date(job.timestamp).toISOString()

    console.log(
        `Starting upload cleanup job: ${job.id} (triggered at ${triggeredAt})`
    )

    const now = new Date()

    const expiredSessions = await prisma.uploadSession.findMany({
        where: {
            status: "PENDING",

            expiresAt: {
                lt: now
            },
        },
        select: {
            id: true,
            expiresAt: true,
            objectKey: true
        },
        // Oldest first, so a backlog drains in order across runs.
        orderBy: {
            expiresAt: "asc"
        },
        take: UPLOAD_CLEANUP_BATCH_SIZE
    })

    console.log(
        `Found ${expiredSessions.length} expired upload sessions`
    )

    let cleaned = 0
    let failed = 0

    for(const session of expiredSessions) {
        try {
            await cleanUpSession(session.id, session.objectKey)

            cleaned++
        } catch (error) {
            // One unreachable object must not abort the rest of the batch: the
            // session stays PENDING and is retried on the next run.
            failed++

            console.error(
                `Failed to clean upload session ${session.id}: `,
                error
            )
        }
    }

    console.log(
        `Upload cleanup job ${job.id} finished: ${cleaned} cleaned, ${failed} failed`
    )

    return {
        found: expiredSessions.length,
        cleaned,
        failed
    }
}

// Object first, row second: if the delete fails the session stays PENDING and
// the next run retries it, which is cheaper to recover from than a CANCELLED row
// pointing at an object nobody will ever collect.
async function cleanUpSession (
    sessionId: string,
    objectKey: string
) {
    await storageProvider.deleteObject(objectKey)

    // updateMany (not update) so the `status` guard can be part of the filter:
    // it keeps a session that was promoted between the scan above and this write
    // untouched, and matching nothing is a no-op rather than a P2025 throw.
    await prisma.uploadSession.updateMany({
        where: {
            id: sessionId,
            status: "PENDING"
        },
        data: {
            status: "CANCELLED",
            failureReason: "Upload session expired"
        }
    })
}
