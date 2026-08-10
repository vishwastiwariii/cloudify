import type { Request, Response } from 'express'
import { AuthError } from '../auth/auth.service'
import { StorageService } from './storage.service'

const storageService = new StorageService()

export async function getUsage(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const result = await storageService.getUsage(req.user.id)

        return res.status(200).json({
            success: true,
            message: 'Storage usage fetched successfully',
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
