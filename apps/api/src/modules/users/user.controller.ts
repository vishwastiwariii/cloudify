import type { Request, Response } from "express"
import { UserService } from "./user.service"
import { AuthError } from "../auth/auth.service"
import { updateAvatarSchema, updateNameSchema } from "@repo/validation"

const userService = new UserService()

export async function handleMe(req: Request, res: Response) {
    try {

        if (!req.user) {
            throw new AuthError('Authentication required', 401)
        }

        const result = await userService.getMe(req.user.id)

        return res.status(200).json({
            success: true,
            data: result,
            message: "User details fetched successfully"
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

export async function handleUpdateName(req: Request, res: Response) {
    try {

        if (!req.user) {
            throw new AuthError('Authentication required', 401)
        }

        const validatedData = updateNameSchema.parse(req.body)

        const result = await userService.updateName(validatedData, req.user.id)

        return res.status(200).json({
            success: true,
            data: result,
            message: "Name updated successfully"
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

export async function handleUpdateAvatar(req: Request, res: Response) {
    try {

        if (!req.user) {
            throw new AuthError('Authentication required', 401)
        }

        const validatedData = updateAvatarSchema.parse(req.body)

        const result = await userService.updateAvatar(validatedData, req.user.id)

        return res.status(200).json({
            success: true,
            data: result,
            message: "Avatar updated successfully"
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
