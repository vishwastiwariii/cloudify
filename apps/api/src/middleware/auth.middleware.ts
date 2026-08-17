import type { Request, Response, NextFunction } from "express"
import { AUTH_COOKIE_NAME } from "../modules/auth/auth.constants"
import { AuthService, AuthError } from "../modules/auth/auth.service"

const authService = new AuthService()

export async function authMiddleware (req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.[AUTH_COOKIE_NAME]

        if(!token) {
            throw new AuthError("Authentication Required", 401)
        }

        const user = await authService.authenticate(token); 

        req.user = user;

        next()
    } catch (error: any) {
        return res.status(401).json({
            success: false, 
            error: error, 
            message: "Invalid or expired session"
        })
    }
}