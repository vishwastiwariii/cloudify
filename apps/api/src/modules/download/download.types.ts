export interface DownloadFile {
    id: string
    name: string
    mimeType: string
    size: bigint
}

export interface DownloadResponse {
    downloadUrl: string
    expiresAt: Date
    file: DownloadFile
}

export interface SerializedDownloadFile {
    id: string
    name: string
    mimeType: string
    size: string
}

export interface SerializedDownloadResponse {
    downloadUrl: string
    expiresAt: Date
    file: SerializedDownloadFile
}
