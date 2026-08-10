import prisma from "@repo/db";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import type { CreatePublicShareInput, PublicShareDownloadResponse, PublicShareResponse } from "./share.types";
import { storageProvider } from "../../infrastructure/storage";
import config from "../../config/env";
import { AuthError } from "../auth/auth.service";
import { PUBLIC_SHARE_DOWNLOAD_URL_EXPIRATION, PUBLIC_SHARE_TOKEN_BYTES } from "./share.constants";


export class ShareService {

    private generateToken(): string {
        return crypto
        .randomBytes(PUBLIC_SHARE_TOKEN_BYTES)
        .toString("base64url");
    }

    private async verifyFileOwnership (userId: string, fileId: string) {
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                ownerId: userId
            }, select: {
                id: true,
                ownerId: true,
                deletedAt: true
            }
        })

        if(!file) {
            throw new AuthError("File does not exists", 404)
        }

        return file
    }

    private toPublicShareResponse(
        id: string,
        fileId: string,
        token: string,
        expiresAt: Date | null,
        passwordHash: string | null,
        isActive: boolean,
        createdAt: Date
    ): PublicShareResponse {
        return {
        id,
        fileId,
        shareUrl:
            `${config.clientUrl}/s/${token}`,
        expiresAt,
        hasPassword:
            Boolean(passwordHash),
        isActive,
        createdAt,
        };
    }

    async createShare (userId: string, data: CreatePublicShareInput) : Promise<PublicShareResponse> {
        const file = await this.verifyFileOwnership(userId, data.fileId)

        if(file.deletedAt !== null) {
            throw new AuthError("File is already deleted", 404)
        }

        const existingShare = await prisma.publicShare.findUnique({
            where: {
                fileId: file.id
            }
        })

        if(existingShare) {
            throw new AuthError("Already a public link available", 409)
        }

        const token = this.generateToken()

        let passwordHash: string | null = null;

        if(data.password) {
            passwordHash = await bcrypt.hash(data.password, 12)
        }

        const share = await prisma.publicShare.create({
            data: {
                fileId: file.id,
                token,
                passwordHash,
                expiresAt: data.expiresAt ?? null
            }
        })

        return this.toPublicShareResponse(
            share.id,
            share.fileId,
            share.token,
            share.expiresAt,
            share.passwordHash,
            share.isActive,
            share.createdAt
        )
    }

    async getShare (userId: string, fileId: string) : Promise<PublicShareResponse> {
        const file = await this.verifyFileOwnership(
            userId,
            fileId
        )

        const share = await prisma.publicShare.findUnique({
            where: {
                fileId: file.id
            }
        })

        if(!share) {
            throw new AuthError("File Id is not valid", 404)
        }

        return this.toPublicShareResponse(
            share.id,
            share.fileId,
            share.token,
            share.expiresAt,
            share.passwordHash,
            share.isActive,
            share.createdAt
        )
    }

    async disableShare (userId: string, fileId: string) : Promise<void>{
        const file = await this.verifyFileOwnership(userId, fileId)

        const share = await prisma.publicShare.findUnique({
            where: {
                fileId: file.id
            }
        })

        if(!share) {
            throw new AuthError("Public Share is not found", 404)
        }

        if(!share.isActive) {
            return;
        }

        await prisma.publicShare.update({
            where: {
                id: share.id
            }, data: {
                isActive: false
            }
        })
    }

    async getPublicDownloadUrl (token: string, password?: string) : Promise<PublicShareDownloadResponse> {
        const share = await prisma.publicShare.findUnique({
            where: {
                token
            }, include: {
                file: {
                    select: {
                        id: true,
                        storageKey: true,
                        deletedAt: true
                    }
                }
            }
        })

        if(!share) {
            throw new AuthError("Public Share Not Found", 404)
        }

        if (!share.isActive) {
            throw new AuthError(
                "Public share is no longer active.", 410
            );
        }

        if (
            share.expiresAt &&
            share.expiresAt <= new Date()
        ) {
            throw new AuthError(
                "Public share has expired.", 410
            );
        }

        if (share.file.deletedAt !== null) {
            throw new AuthError(
                "File is no longer available.", 404
            );
        }

        if(share.passwordHash) {
            if(!password) {
                throw new AuthError("Password is required", 401)
            }

            const passwordValid = await bcrypt.compare(password, share.passwordHash)

            if(!passwordValid) {
                throw new AuthError("Invalid Password", 401)
            }
        }

        const exists = await storageProvider.objectExists(share.file.storageKey)

        if(!exists) {
            throw new AuthError("File object not found", 404)
        }

        const downloadUrl = await storageProvider.generateSignedDownloadUrl({
            objectKey: share.file.storageKey,
            expiresIn: PUBLIC_SHARE_DOWNLOAD_URL_EXPIRATION
        })

        const expiresAt = new Date(
            Date.now() + PUBLIC_SHARE_DOWNLOAD_URL_EXPIRATION
        )

        return {
            downloadUrl,
            expiresAt
        }
    }
}
