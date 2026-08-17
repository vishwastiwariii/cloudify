import type { GetFilesOptions, GetSignedUrlConfig } from "@google-cloud/storage";
import { bucket } from "./storage";
import type { GenerateSignedDownloadUrlOptions, GenerateSignedUploadUrlOptions, ListObjectsOptions, ListObjectsResult, ObjectMetaData } from "./storage.interface";


export class GoogleStorageProvider {

    async generateSignedUploadUrl (
        options: GenerateSignedUploadUrlOptions
    ) : Promise<string> {
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
    ) : Promise<string> {
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

    async listObjects (
        options: ListObjectsOptions = {}
    ): Promise<ListObjectsResult> {
        // autoPaginate off so one call is one page: paging is the caller's to
        // drive, otherwise the client walks the whole bucket and buffers every
        // object in memory before returning.
        const [files, nextQuery] = await bucket.getFiles({
            autoPaginate: false,
            ...(options.prefix !== undefined && { prefix: options.prefix }),
            ...(options.pageToken !== undefined && { pageToken: options.pageToken }),
            ...(options.maxResults !== undefined && { maxResults: options.maxResults })
        })

        const nextPageToken = (nextQuery as Partial<GetFilesOptions>).pageToken

        return {
            objects: files.map((file) => ({
                objectKey: file.name,
                size: Number(file.metadata.size ?? 0),
                ...(file.metadata.timeCreated !== undefined && { createdAt: new Date(file.metadata.timeCreated) }),
                ...(file.metadata.updated !== undefined && { updatedAt: new Date(file.metadata.updated) })
            })),
            ...(nextPageToken !== undefined && { nextPageToken })
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