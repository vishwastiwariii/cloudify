import prisma from "@repo/db";
import type { UpdateAvatarDto, UpdateNameDto } from "@repo/validation";
import { AuthError } from "../auth/auth.service";

const userSelect = {
    id: true,
    name: true,
    email: true,
    username: true,
    avatar: true,
    isVerified: true,
    storageLimit: true,
    storageUsed: true,
    createdAt: true,
    updatedAt: true
}

export class UserService {
    private serializeUser<T extends { storageLimit: bigint, storageUsed: bigint }>(user: T) {
        return {
            ...user,
            storageLimit: user.storageLimit.toString(),
            storageUsed: user.storageUsed.toString()
        }
    }

    async updateName(dto: UpdateNameDto, userId: string) {
        const { name } = dto

        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                name: name
            },
            select: userSelect
        })

        return this.serializeUser(user)
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: userSelect
        })

        if(!user) {
            throw new AuthError("User not found", 401)
        }

        return this.serializeUser(user)
    }

    async updateAvatar(dto: UpdateAvatarDto, userId: string) {
        const { avatarUrl } = dto

        const user = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                avatar: avatarUrl
            },
            select: userSelect
        })

        return this.serializeUser(user)
    }
}
