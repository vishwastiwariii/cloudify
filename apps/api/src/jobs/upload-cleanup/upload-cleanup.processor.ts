import type { Job } from "bullmq";
import type { UploadCleanUpJobData } from "./upload-cleanup.types";
import prisma from "@repo/db";

export async function processUploadCleanUp (
    job: Job<UploadCleanUpJobData>
) {
    console.log(`Starting upload cleanup job: ${job.id}`)

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
            storageKey: true
        }
    })

    console.log(
        `Found ${expiredSessions.length} expired upload sessions`
    )

    for(const sessions of expiredSessions) {
        console.log(`Cleaning session id: ${sessions.id}`)
        // GCP removal logic to be added
    }

    return {
        processed: expiredSessions.length
    }
}