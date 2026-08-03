

export interface GenerateSignedUploadUrlOptions {
    objectKey: string, 
    contentType: string, 
    expiresIn?: number
}

export interface GenerateSignedDownloadUrlOptions {
    objectKey: string, 
    expiresIn?: number
}

export interface ObjectMetaData {
    objectKey: string, 
    size: number, 
    contentType: string, 
    etag?: string, 
    md5Hash?: string;
    updatedAt?: Date;
}