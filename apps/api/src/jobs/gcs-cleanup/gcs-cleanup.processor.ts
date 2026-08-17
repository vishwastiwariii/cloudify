import type { Job } from "bullmq";
import type { GcsCleanUpJobData, GcsCleanUpJobResult } from "./gcs-cleanup.types";
import prisma from "@repo/db";
import { storageProvider } from "../../infrastructure/storage";
import type { ObjectSummary } from "../../infrastructure/storage";
import {
    enqueueGcsCleanUp,
    GCS_CLEANUP_BATCH_SIZE,
    GCS_CLEANUP_MIN_OBJECT_AGE,
    GCS_CLEANUP_PREFIX
} from ".";

// An object is an orphan when nothing in the database claims it: no File row
// (active or trashed), no upload still in flight, and it is old enough that a
// claim could not still be on its way.
export async function processGcsCleanUp (
    job: Job<GcsCleanUpJobData>
): Promise<GcsCleanUpJobResult> {
    const triggeredAt = job.data.triggeredAt ?? new Date(job.timestamp).toISOString()

    console.log(
        `Starting gcs cleanup job: ${job.id} (triggered at ${triggeredAt})`
    )

    const now = new Date()

    const { objects, nextPageToken } = await storageProvider.listObjects({
        prefix: GCS_CLEANUP_PREFIX,
        maxResults: GCS_CLEANUP_BATCH_SIZE,
        ...(job.data.pageToken !== undefined && { pageToken: job.data.pageToken })
    })

    console.log(
        `Listed ${objects.length} objects from the bucket`
    )

    const orphans = await findOrphanedObjects(objects, now)

    console.log(
        `Found ${orphans.length} orphaned objects`
    )

    let cleaned = 0
    let failed = 0

    for(const orphan of orphans) {
        try {
            await storageProvider.deleteObject(orphan.objectKey)

            cleaned++
        } catch (error) {
            // One undeletable object must not abort the rest of the page: it is
            // still unreferenced, so the next sweep lists it again.
            failed++

            console.error(
                `Failed to delete orphaned object ${orphan.objectKey}: `,
                error
            )
        }
    }

    // The listing is paged, so the sweep continues in a follow-up job rather
    // than stopping a page in and waiting a full interval to resume.
    if(nextPageToken) {
        await enqueueGcsCleanUp(nextPageToken)
    }

    console.log(
        `GCS cleanup job ${job.id} finished: ${cleaned} cleaned, ${failed} failed`
    )

    return {
        processed: objects.length,
        cleaned,
        skipped: objects.length - orphans.length,
        failed,
        ...(nextPageToken !== undefined && { nextPageToken })
    }
}


async function findOrphanedObjects (
    objects: ObjectSummary[],
    now: Date
): Promise<ObjectSummary[]> {
    // An object written moments ago may belong to an upload that has not
    // reached completeUpload yet, so it is held back until the next sweep.
    const cutOff = new Date(now.getTime() - GCS_CLEANUP_MIN_OBJECT_AGE)

    // A missing creation time means the listing told us nothing about age:
    // treated as brand new, since deleting on a guess is the unrecoverable half.
    const candidates = objects.filter(
        (object) => (object.createdAt ?? now) < cutOff
    )

    if(candidates.length === 0) {
        return []
    }

    const objectKeys = candidates.map((object) => object.objectKey)

    const [files, activeSessions] = await Promise.all([
        // No deletedAt filter: a trashed file still owns its object until the
        // row itself is gone, otherwise emptying the trash would be irreversible
        // the moment this job ran.
        prisma.file.findMany({
            where: {
                storageKey: {
                    in: objectKeys
                }
            },
            select: {
                storageKey: true
            }
        }),

        // Active means PENDING and still inside its window: the client may be
        // mid-upload. Once the window closes the session is upload-cleanup's to
        // finish, and whatever it leaves behind is an orphan by then.
        prisma.uploadSession.findMany({
            where: {
                objectKey: {
                    in: objectKeys
                },
                status: "PENDING",
                expiresAt: {
                    gt: now
                }
            },
            select: {
                objectKey: true
            }
        })
    ])

    const owned = new Set<string>([
        ...files.map((file) => file.storageKey),
        ...activeSessions.map((session) => session.objectKey)
    ])

    return candidates.filter(
        (object) => !owned.has(object.objectKey)
    )
}
