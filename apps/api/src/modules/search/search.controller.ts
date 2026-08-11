import type { Request, Response } from "express";
import { AuthError } from "../auth/auth.service";
import { searchSchema } from "@repo/validation";
import { SearchService } from "./search.service";

const searchService = new SearchService()

export async function getFiles (req: Request, res: Response) {
    try {
        if(!req.user) {
            throw new AuthError("Authentication Required", 401)
        }

        const validatedData = searchSchema.parse({ query: req.query })

        const result = await searchService.searchFiles(req.user.id, validatedData.query)

        return res.status(200).json({
            success: true,
            data: result,
            message: "Files Fetched Successfully"
        })
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
        }

        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({ success: false, message: error.message, errors: [] });
        }

        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error', errors: [] });
    }
}