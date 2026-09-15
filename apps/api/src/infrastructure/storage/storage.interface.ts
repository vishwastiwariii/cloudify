

export interface GenerateSignedUploadUrlOptions {
    objectKey: string, 
    contentType: string, 
    expiresIn?: number
}

export interface GenerateSignedDownloadUrlOptions {
    objectKey: string,
    expiresIn?: number,

    // When set, the URL downloads the object under this name instead of
    // letting the browser render it inline.
    fileName?: string
}

export interface ObjectMetaData {
    objectKey: string, 
    size: number, 
    contentType: string, 
    etag?: string, 
    md5Hash?: string;
    updatedAt?: Date;
}

export interface ListObjectsOptions {
    prefix?: string,
    pageToken?: string,
    maxResults?: number
}

// Trimmed down from the full object metadata: a listing returns thousands of
// entries at a time, and a sweep only needs the key and how old it is.
export interface ObjectSummary {
    objectKey: string,
    size: number,
    createdAt?: Date,
    updatedAt?: Date
}

export interface ListObjectsResult {
    objects: ObjectSummary[],

    // Absent once the listing is exhausted.
    nextPageToken?: string
}