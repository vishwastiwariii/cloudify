import prisma from "@repo/db";
import type { CompleteUploadDto, InitiateUploadDto } from "@repo/validation";
import config from "../../config/env";
import path from "path";
import { randomUUID } from "crypto";
import { storageProvider } from "../../infrastructure/storage";
import { AuthError } from "../auth/auth.service";
import { StorageService } from "../storage/storage.service";
import { SIGNED_UPLOAD_URL_EXPIRATION, UPLOAD_SESSION_EXPIRATION } from "./uploads.constants";

const storageService = new StorageService()

export class UploadService {

    async initiateUpload(data: InitiateUploadDto, userId: string) {
        if(data.folderId) {
            await this.validateFolder(userId, data.folderId)
        }

        // Rejected here so an over-quota upload never gets a signed URL. This is
        // the early check, not the enforcement: several sessions opened at once
        // can each pass it, and completeUpload is what actually holds the line.
        await storageService.checkQuota(userId, BigInt(data.size))

        const objectKey = this.generateObjectKey(userId, data.fileName)

        const session = await this.createUploadSession(userId, objectKey, data)

        const uploadUrl = await storageProvider.generateSignedUploadUrl({
            objectKey, 
            contentType: data.mimeType, 
            expiresIn: SIGNED_UPLOAD_URL_EXPIRATION
        })

        return {
            uploadId: session.id, 
            objectKey, 
            uploadUrl,
            expiresAt: session.expiresAt
        }
    }

    
    async completeUpload(data: CompleteUploadDto, userId: string) {
        const uploadSession = await prisma.uploadSession.findFirst({
            where: {
                id: data.uploadId, 
                ownerId: userId
            }
        })

        if(uploadSession?.status !== "PENDING") {
            throw new AuthError("Invalid Upload Payload", 404)
        }

        if(uploadSession.expiresAt < new Date()) {
            throw new AuthError("Upload session expired", 410)
        }

        const objectExists = await storageProvider.objectExists(
            uploadSession.objectKey
        )

        if(!objectExists) {
            throw new AuthError("Object not uploaded", 400)
        }

        const metadata = await storageProvider.getObjectMetaData(
            uploadSession.objectKey
        )

        if(!metadata) {
            throw new AuthError("Metadata is required", 500)
        }

        if(uploadSession.size !== BigInt(metadata.size)) {
            throw new AuthError("Size does not match", 409)
        }

        // One transaction so the row, the session and the usage move together:
        // a file that exists without being charged for is a quota bypass, and a
        // charge without a file is storage the user can never reclaim.
        const file = await prisma.$transaction(async (tx) => {
            const created = await tx.file.create({
                data: {
                    ownerId: userId,
                    folderId: uploadSession.folderId,
                    name: uploadSession.originalName,
                    originalName: uploadSession.originalName,
                    storageKey: uploadSession.objectKey,
                    bucket: uploadSession.bucket,
                    mimeType: metadata.contentType,
                    size: BigInt(metadata.size)
                }
            })

            await tx.uploadSession.update({
                where: {
                    id: uploadSession.id,
                    ownerId: userId
                },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date()
                }
            })

            // Throws 413 if this upload would cross the limit, rolling back the
            // file row with it.
            await storageService.incrementUsage(userId, BigInt(metadata.size), tx)

            return created
        })

        return {
            file: {
                ...file,
                size: file.size.toString()
            }
        }
    }

    private async validateFolder(userId: string, folderId: string) {
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                ownerId: userId,
                deletedAt: null
            }
        })

        if(!folder) {
            throw new AuthError("Folder Not Found", 404)
        }

        return folder
    }

    private generateObjectKey(userId: string, fileName: string) {
        const extension = path.extname(fileName)

        const year = new Date().getFullYear()

        const month = String(
            new Date().getMonth() + 1
        ).padStart(2, "0")

        return [
            "users",
            userId,
            year,
            month,
            `${randomUUID()}${extension}`,
        ].join("/")
    }

    private createUploadSession(userId: string, objectKey: string,
        data: InitiateUploadDto) {
            const session = prisma.uploadSession.create({
                data: {
                    ownerId: userId,
                    ...(data.folderId !== undefined && { folderId: data.folderId }),
                    originalName: data.fileName,
                    mimeType: data.mimeType, 
                    size: BigInt(data.size), 
                    bucket: config.gcp_bucket_name, 
                    objectKey, 
                    expiresAt: new Date(Date.now() +
                     UPLOAD_SESSION_EXPIRATION)
                }
            })

            return session 
    }
}