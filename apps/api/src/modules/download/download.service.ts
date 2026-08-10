import prisma from "@repo/db";
import type { DownloadResponse, SerializedDownloadResponse } from "./download.types";
import { DOWNLOAD_URL_EXPIRATION } from "./download.constants";
import { storageProvider } from "../../infrastructure/storage";
import { AuthError } from "../auth/auth.service";


export class DownloadService {

    private serializeDownload(download: DownloadResponse): SerializedDownloadResponse {
        return {
            ...download,
            file: {
                ...download.file,
                size: download.file.size.toString()
            }
        }
    }

    async getDownloadUrl (userId: string, fileId: string) : Promise<SerializedDownloadResponse> {
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                ownerId: userId,

                deletedAt: null
            },
            select: {
                id: true,
                name: true,
                storageKey: true,
                mimeType: true,
                size: true
            }
        })

        if(!file) {
            throw new AuthError("File not found", 404)
        }

        const exists = await storageProvider.objectExists(
            file.storageKey
        )

        if(!exists) {
            throw new AuthError("File object not found", 404)
        }

        const downloadUrl = await storageProvider.generateSignedDownloadUrl({
            objectKey: file.storageKey,
            expiresIn: DOWNLOAD_URL_EXPIRATION
        })

        const expiresAt = new Date(
            Date.now() + DOWNLOAD_URL_EXPIRATION
        )

        return this.serializeDownload({
            downloadUrl,
            expiresAt,
            file: {
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size
            }
        })
    }

}
