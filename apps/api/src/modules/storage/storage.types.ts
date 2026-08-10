export interface StorageUsage {
    used: bigint
    limit: bigint
    available: bigint
    percentage: number
}

export interface SerializedStorageUsage {
    used: string
    limit: string
    available: string
    percentage: number
}
