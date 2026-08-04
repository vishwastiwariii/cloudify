import type { Request, Response } from 'express'
import { completeUploadSchema, initiateUploadSchema } from '@repo/validation'
import { AuthError } from '../auth/auth.service'
import { UploadService } from './uploads.service'

const uploadService = new UploadService()

export async function handleInitiateUpload(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const validatedData = initiateUploadSchema.parse(req.body)

        const result = await uploadService.initiateUpload(validatedData, req.user.id)

        return res.status(200).json({
            success: true,
            message: 'Upload initiated successfully',
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

export async function handleCompleteUpload(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const validatedData = completeUploadSchema.parse(req.body)

        const result = await uploadService.completeUpload(validatedData, req.user.id)

        return res.status(200).json({
            success: true,
            message: 'Upload completed successfully',
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
