import type { Request, Response } from 'express'
import { AuthError } from '../auth/auth.service'
import { createFileSchema, deleteFileSchema, getFileSchema, listFileSchema, moveFileSchema, renameFileSchema } from '@repo/validation'
import { FileService } from './file.service'

const fileService = new FileService()

export async function getAllFile(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const validatedData = listFileSchema.parse({
            query: {
                ...req.query,
                folderId: req.params.folderId ?? req.query.folderId
            }
        })

        const result = await fileService.getAllFile(req.user.id, validatedData.query)

        return res.status(200).json({
            success: true,
            data: result,
            message: 'All files are listed below'
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

export async function getFile(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401);
        }

        const validatedData = getFileSchema.parse({ params: req.params })

        const result = await fileService.getFile(validatedData.params.fileId, req.user.id)

        return res.status(200).json({
            success: true,
            message: 'File fetched successfully',
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

export async function handleCreateFile(req: Request, res: Response) {
    try {

        if (!req.user) {
            throw new AuthError('Authentication Required', 401)
        }

        const validatedData = createFileSchema.parse(req.body)

        const result = await fileService.createFile(validatedData, req.user.id)

        return res.status(200).json({
            success: true,
            message: 'File created successfully',
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

export async function handleRenameFile(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401);
        }

        const validatedData = renameFileSchema.parse({
            body: req.body,
            params: req.params
        })

        const result = await fileService.renameFile(validatedData, req.user.id)

        return res.status(200).json({
            success: true,
            message: 'File Renamed Successfully',
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

export async function handleMoveFile(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401);
        }

        const validatedData = moveFileSchema.parse({
            body: req.body,
            params: req.params
        })

        const result = await fileService.moveFile(validatedData, req.user.id)

        return res.status(200).json({
            success: true,
            data: result,
            message: 'File Moved Successfully'
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

export async function handleDeleteFile(req: Request, res: Response) {
    try {
        if (!req.user) {
            throw new AuthError('Authentication Required', 401);
        }

        const validatedData = deleteFileSchema.parse({ params: req.params })

        const result = await fileService.deleteFile(validatedData.params.fileId, req.user.id)

        return res.status(200).json({
            success: true,
            message: 'File Deleted Successfully',
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
