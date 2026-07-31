import prisma from "@repo/db";
import type { UpdateAvatarDto, UpdateNameDto } from "@repo/validation";
import { AuthError } from "../auth/auth.service";
import { USER_PUBLIC_SELECT } from "./user.constants";

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
            select: USER_PUBLIC_SELECT
        })

        return this.serializeUser(user)
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: USER_PUBLIC_SELECT
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
            select: USER_PUBLIC_SELECT
        })

        return this.serializeUser(user)
    }
}
