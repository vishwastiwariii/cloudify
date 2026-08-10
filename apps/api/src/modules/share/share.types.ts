export interface CreatePublicShareInput {
    fileId: string, 
    password?: string,
    expiresAt?: Date
}

export interface PublicShareResponse { 
    id: string, 
    fileId: string, 
    shareUrl: string, 
    expiresAt: Date | null, 
    hasPassword: boolean,
    isActive: boolean,
    createdAt: Date
}

export interface PublicShareDownloadResponse {
    downloadUrl: string, 
    expiresAt: Date
}

export interface PublicShareAccessInput {
    token: string, 
    password?: string
}