import type { Request, Response, NextFunction } from "express"
import { AUTH_COOKIE_NAME } from "../modules/auth/auth.constants"
import { AuthService, AuthError } from "../modules/auth/auth.service"

const authService = new AuthService()

export async function authMiddleware (req: Request, _res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.[AUTH_COOKIE_NAME]

        if(!token) {
            throw new AuthError("Authentication Required", 401)
        }

        const user = await authService.authenticate(token); 

        req.user = user; 

        next()
    } catch (error: any) {
        next(error)
    }
}