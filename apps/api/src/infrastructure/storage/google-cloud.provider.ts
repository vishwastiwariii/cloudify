import type { GetSignedUrlConfig } from "@google-cloud/storage";
import { bucket } from "./storage";
import type { GenerateSignedDownloadUrlOptions, GenerateSignedUploadUrlOptions, ObjectMetaData } from "./storage.interface";


export class GoogleStorageProvider {

    async generateSignedUploadUrl (
        options: GenerateSignedUploadUrlOptions
    ) : Promise<String> {
        const file = bucket.file(options.objectKey)

        const config: GetSignedUrlConfig = {
            version: 'v4', 
            action: "write", 
            expires: Date.now() + (options.expiresIn ?? 15 * 60 * 1000), 
            contentType: options.contentType
        }

        const [url] = await file.getSignedUrl(config)

        return url; 
    }


    async generateSignedDownloadUrl (
        options: GenerateSignedDownloadUrlOptions
    ) : Promise<String> {
        const file = bucket.file(options.objectKey)

        const config : GetSignedUrlConfig = {
            version: "v4", 
            action: "read", 
            expires: Date.now() + (options.expiresIn ?? 15 * 60 * 1000)
        }

        const [url] = await file.getSignedUrl(config)

        return url
    }


    async objectExists (
        objectKey: string
    ): Promise<boolean> {
        const file = bucket.file(objectKey)

        const [exists] = await file.exists()

        return exists
    }


    async getObjectMetaData (
        objectKey: string
    ) : Promise<ObjectMetaData> {
        const file = bucket.file(objectKey)

        const [metadata] = await file.getMetadata()

        return {
            objectKey,
            size: Number(metadata.size),
            contentType: metadata.contentType ?? "",
            ...(metadata.etag !== undefined && { etag: metadata.etag }),
            ...(metadata.md5Hash !== undefined && { md5Hash: metadata.md5Hash }),
            ...(metadata.updated !== undefined && { updatedAt: new Date(metadata.updated) })
        }
    }

    async deleteObject (
        objectKey: string
    ): Promise<void> {
        const file = bucket.file(objectKey)
        
        await file.delete({
            ignoreNotFound: true
        })
    }
}