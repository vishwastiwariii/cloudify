import type { Request, Response, NextFunction } from "express"
import { AuthError } from "../modules/auth/auth.service"

export function errorHandler (error: any, _req: Request, res: Response, _next: NextFunction) {
    if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.issues })
    }

    if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ message: error.message })
    }

    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
}
