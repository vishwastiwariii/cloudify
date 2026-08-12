export interface DashboardStorage {
    used: string, 
    limit: string, 
    percentage: number, 
    available: string
}

export interface DashboardStatistics {
    files: number, 
    folder: number
}

export interface DashboardRecentFile {
    id: string, 
    name: string, 
    mimeType: string, 
    size: string, 
    folderId: string | null, 
    createdAt: Date, 
    updatedAt: Date
}

export type DashboardFileType = 
        | "image"
        | "audio"
        | "video"
        | "document"
        | "other"
        | "archive"

export interface DashboardFileTypeStats {
    type: DashboardFileType, 
    files: number, 
    size: string
}

export interface DashboardResponse {
    storage: DashboardStorage,
    statistics: DashboardStatistics,
    recentFiles: DashboardRecentFile[],
    fileType: DashboardFileTypeStats[]
}