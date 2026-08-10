import type { Request, Response } from 'express'
import { AuthError } from '../auth/auth.service';
import { DownloadService } from './download.service';
import { downloadFileSchema } from '@repo/validation';

const downloadService = new DownloadService()

export async function getDownloadUrl(req: Request, res: Response) {
    try {
        if(!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const validatedData = downloadFileSchema.parse({ params: req.params })

        const result = await downloadService.getDownloadUrl(req.user.id, validatedData.params.fileId)

        return res.status(200).json({
            success: true, 
            data: result, 
            message: "Download URL generated successfully"
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