import type { Request, Response } from 'express'
import { accessShareSchema, createShareSchema, disableShareSchema, getShareSchema } from '@repo/validation'
import { AuthError } from '../auth/auth.service'
import { ShareService } from './share.service'

const shareService = new ShareService()

export async function handleCreateShare(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const validatedData = createShareSchema.parse({
            body: req.body,
            params: req.params
        })

        const result = await shareService.createShare(req.user.id, {
            fileId: validatedData.params.fileId,
            ...(validatedData.body.password !== undefined && { password: validatedData.body.password }),
            ...(validatedData.body.expiresAt !== undefined && { expiresAt: validatedData.body.expiresAt })
        })

        return res.status(200).json({
            success: true,
            message: 'Share link created successfully',
            data: result
        })
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.issues });
        }

        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getShare(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const validatedData = getShareSchema.parse({ params: req.params })

        const result = await shareService.getShare(req.user.id, validatedData.params.fileId)

        return res.status(200).json({
            success: true,
            message: 'Share link fetched successfully',
            data: result
        })
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.issues });
        }

        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function handleDisableShare(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const validatedData = disableShareSchema.parse({ params: req.params })

        await shareService.disableShare(req.user.id, validatedData.params.fileId)

        return res.status(200).json({
            success: true,
            message: 'Share link disabled successfully',
            data: null
        })
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.issues });
        }

        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// public route, so there is deliberately no req.user guard here
export async function getPublicDownloadUrl(req: Request, res: Response) {
    try {
        const validatedData = accessShareSchema.parse({
            body: req.body,
            params: req.params
        })

        const result = await shareService.getPublicDownloadUrl(
            validatedData.params.token,
            validatedData.body.password
        )

        return res.status(200).json({
            success: true,
            message: 'Download URL generated successfully',
            data: result
        })
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.issues });
        }

        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
