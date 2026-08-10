import prisma from '@repo/db'
import type { SerializedStorageUsage, StorageUsage } from './storage.types'
import { AuthError } from '../auth/auth.service'

export class StorageService {

    private serializeUsage(usage: StorageUsage): SerializedStorageUsage {
        return {
            ...usage,
            used: usage.used.toString(),
            limit: usage.limit.toString(),
            available: usage.available.toString()
        }
    }

    async getUsage(userId: string): Promise<SerializedStorageUsage> {
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                deletedAt: null
            },
            select: {
                storageLimit: true,
                storageUsed: true
            }
        })

        if (!user) {
            throw new AuthError('User not found', 404)
        }

        const used = user.storageUsed
        const limit = user.storageLimit

        const available = limit > used ? limit - used : 0n

        // bigint division truncates, so scale first to keep one decimal place
        const percentage = limit === 0n ? 100 : Math.min(100, Number((used * 1000n) / limit) / 10)

        return this.serializeUsage({
            used,
            limit,
            available,
            percentage
        })
    }

    async checkQuota(userId: string, additionalBytes: bigint): Promise<void> {
        if (additionalBytes < 0n) {
            throw new AuthError('File size cannot be negative', 400)
        }

        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                deletedAt: null
            },
            select: {
                storageUsed: true,
                storageLimit: true
            }
        })

        if (!user) {
            throw new AuthError('User not found', 404)
        }

        const projectedUsage = user.storageUsed + additionalBytes

        if (projectedUsage > user.storageLimit) {
            throw new AuthError('Storage limit exceeded', 413)
        }
    }

    async incrementUsage(userId: string, bytes: bigint): Promise<void> {
        if (bytes < 0n) {
            throw new AuthError('Storage increment cannot be negative', 400)
        }

        if (bytes === 0n) {
            return
        }

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findFirst({
                where: {
                    id: userId,
                    deletedAt: null
                },
                select: {
                    storageLimit: true
                }
            })

            if (!user) {
                throw new AuthError('User not found', 404)
            }

            // the quota is re-checked inside the update itself, so concurrent
            // uploads can never both pass a stale checkQuota and overshoot
            const result = await tx.user.updateMany({
                where: {
                    id: userId,
                    deletedAt: null,
                    storageUsed: {
                        lte: user.storageLimit - bytes
                    }
                },
                data: {
                    storageUsed: {
                        increment: bytes
                    }
                }
            })

            if (result.count === 0) {
                throw new AuthError('Storage limit exceeded', 413)
            }
        })
    }

    async decrementUsage(userId: string, bytes: bigint): Promise<void> {
        if (bytes < 0n) {
            throw new AuthError('Storage decrement cannot be negative', 400)
        }

        if (bytes === 0n) {
            return
        }

        const result = await prisma.user.updateMany({
            where: {
                id: userId,
                deletedAt: null,
                storageUsed: {
                    gte: bytes
                }
            },
            data: {
                storageUsed: {
                    decrement: bytes
                }
            }
        })

        if (result.count > 0) {
            return
        }

        // the row exists but has drifted below `bytes` — clamp instead of going negative
        const clamped = await prisma.user.updateMany({
            where: {
                id: userId,
                deletedAt: null
            },
            data: {
                storageUsed: 0n
            }
        })

        if (clamped.count === 0) {
            throw new AuthError('User not found', 404)
        }
    }

    async recalculateUsage(userId: string): Promise<bigint> {
        // trashed files still occupy the bucket, so soft-deleted rows are counted too
        const result = await prisma.file.aggregate({
            where: {
                ownerId: userId
            },
            _sum: {
                size: true
            }
        })

        const actualUsage = result._sum.size ?? 0n

        const updated = await prisma.user.updateMany({
            where: {
                id: userId,
                deletedAt: null
            },
            data: {
                storageUsed: actualUsage
            }
        })

        if (updated.count === 0) {
            throw new AuthError('User not found', 404)
        }

        return actualUsage
    }
}
