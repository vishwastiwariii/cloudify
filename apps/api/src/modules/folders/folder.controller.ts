import type { Request, Response } from "express";
import { AuthError } from "../auth/auth.service";
import { createFolderSchema, folderIdParamsSchema, moveFolderSchema, updateFolderSchema } from "@repo/validation";
import { FolderService } from "./folder.service";

const folderService = new FolderService()

export async function getAllFolder(req: Request, res: Response) {
    try {
        if(!req.user) {
            throw new AuthError("Authentication Required", 401); 
        }

        const result = await folderService.getAllFolder(req.user.id)

        return res.status(200).json({
            success: true, 
            data: result, 
            message: "All folders are listed below"
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

export async function getFolder(req: Request, res: Response) {
    try {
        if(!req.user) {
            throw new AuthError("Authentication Required", 401);
        }

        const validatedData = folderIdParamsSchema.parse(req.params)

        const result = await folderService.getFolder(validatedData.folderId, req.user.id)

        return res.status(200).json({
            success: true, 
            message: "Folder fetched successfully",
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

export async function handleCreateFolder (req: Request, res: Response) {
    try {

        if(!req.user){
            throw new AuthError("Authentication Required", 401)
        }

        const validatedData = createFolderSchema.parse(req.body)

        const result = await folderService.createFolder(validatedData, req.user.id)

        return res.status(200).json({
            success: true, 
            message: "Folder created successfully", 
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

export async function handleUpdateFolder (req: Request, res: Response) {
    try {
        if(!req.user) {
            throw new AuthError("Authentication Required", 401);
        }

        const validatedData = updateFolderSchema.parse({
            body: req.body,
            params: req.params
        })

        const result = await folderService.updateFolder(validatedData, req.user.id)

        return res.status(200).json({
            success: true, 
            message: "Folder Updated Successfully", 
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

export async function handleMoveFolder (req: Request, res: Response) {
    try {
        if(!req.user) {
            throw new AuthError("Authentication Required", 401);
        }

        const validatedData = moveFolderSchema.parse(req.body)

        const result = await folderService.moveFolder(validatedData, req.user.id)

        return res.status(200).json({
            success: true, 
            data: result, 
            message: "Folder Moved Successfully"
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

export async function handleDeleteFolder (req: Request, res: Response) {
    try {
        if(!req.user) {
            throw new AuthError("Authentication Required", 401);
        }

        const validatedData = folderIdParamsSchema.parse(req.params)

        const result = await folderService.deleteFolder(validatedData.folderId, req.user.id)

        return res.status(200).json({
            success: true, 
            message: "Folder Deleted Successfully", 
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