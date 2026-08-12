import prisma from "@repo/db";
import { AuthError } from "../auth/auth.service";
import type {
    DashboardFileType,
    DashboardFileTypeStats,
    DashboardRecentFile,
    DashboardResponse,
    DashboardStorage
} from "./dashboard.types";

const DASHBOARD_RECENT_FILES_LIMIT = 10

export class DashboardService {
    async getDashboard(userId: string) : Promise<DashboardResponse> {
        const [
            user,
            fileCount,
            folderCount,
            recentFiles,
            fileTypeGroups
        ] = await Promise.all(
            [
                this.getStorage(userId),

                this.getFileCount(userId),

                this.getFolderCount(userId),

                this.getRecentFiles(userId),

                this.getFileTypeStatistics(userId)
            ]
        )

        return {
            storage: this.buildStorageResponse(
                user.storageUsed,
                user.storageLimit
            ),

            statistics: {
                files: fileCount,
                folder: folderCount
            },

            recentFiles,

            fileType: fileTypeGroups
        }
    }


    private async getStorage (userId: string) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },

            select: {
                storageUsed: true,
                storageLimit: true
            }
        })

        if(!user) {
            throw new AuthError("User not found", 404)
        }

        return user
    }

    private async getFileCount (userId: string) : Promise<number> {
        return prisma.file.count({
            where: {
                ownerId: userId,
                deletedAt: null
            }
        })
    }

    private async getFolderCount (userId: string) : Promise<number> {
        return prisma.folder.count({
            where: {
                ownerId: userId,
                deletedAt: null
            }
        })
    }

    private async getRecentFiles (userId: string) : Promise<DashboardRecentFile[]> {
        const files = await prisma.file.findMany({
            where: {
                ownerId: userId,
                deletedAt: null
            },

            select: {
                id: true,
                name: true,
                mimeType: true,
                size: true,
                folderId: true,
                createdAt: true,
                updatedAt: true
            },

            orderBy: {
                updatedAt: "desc"
            },

            take:
               DASHBOARD_RECENT_FILES_LIMIT
        })

        return files.map((file) => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size.toString(),
            folderId: file.folderId,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
        }))
    }

    private async getFileTypeStatistics (userId: string) : Promise<DashboardFileTypeStats[]> {
        // Grouped in the database so this stays one row per distinct mimeType
        // instead of one row per file.
        const mimeGroups = await prisma.file.groupBy({
            by: ["mimeType"],

            where :{
                ownerId: userId,
                deletedAt: null
            },

            _count: {
                _all: true
            },

            _sum: {
                size: true
            }
        })

        const groups = new Map<DashboardFileType, {
            files: number,
            size: bigint
        }
        >();

        for (const group of mimeGroups) {
            const type = this.getFileType(group.mimeType)

            const existing = groups.get(type)

            if(existing) {
                existing.files += group._count._all
                existing.size += group._sum.size ?? 0n
            } else {
                groups.set(type, {
                    files: group._count._all,
                    size: group._sum.size ?? 0n
                })
            }
        }

        return Array.from(
            groups.entries()
        ).map(([type, stats]) => ({
            type,

            files: stats.files,
            size: stats.size.toString()
        }))
    }

    private getFileType (mimeType: string) : DashboardFileType {
        if (mimeType.startsWith("image/")) {
        return "image";
        }

        if (mimeType.startsWith("video/")) {
        return "video";
        }

        if (mimeType.startsWith("audio/")) {
        return "audio";
        }

        if (
        mimeType === "application/pdf" ||
        mimeType.startsWith("text/") ||
        mimeType.includes("document") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("presentation")
        ) {
        return "document";
        }

        if (
        mimeType.includes("zip") ||
        mimeType.includes("rar") ||
        mimeType.includes("7z") ||
        mimeType.includes("tar") ||
        mimeType.includes("gzip")
        ) {
        return "archive";
        }

        return "other";
    }

    private buildStorageResponse (
        storageUsed: bigint,
        storageLimit: bigint
    ) : DashboardStorage {
        const available = storageLimit > storageUsed ? storageLimit - storageUsed : 0n;

        // Scaled by 10000 so integer division keeps two decimal places of percent.
        const percentage = storageLimit === 0n ? 0 : Number(
            (
                (storageUsed * 10000n)/storageLimit
            )
        )/100

        return {
            used: storageUsed.toString(),
            limit: storageLimit.toString(),
            available: available.toString(),
            percentage
        }
    }
}
