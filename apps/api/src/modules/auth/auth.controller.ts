import type { Request, Response } from 'express'
import { SignupSchema, LoginSchema } from '@repo/validation'
import { AuthService, AuthError } from './auth.service'

const authService = new AuthService()

export async function handleSignup (req: Request, res: Response) {
    try {
        const validatedData = SignupSchema.parse(req.body)

        const result = await authService.signUp(validatedData)

        return res.status(200).json({
            success: true, 
            data: result, 
            message: "User registered successfully" 
        })
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.errors });
        }
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export async function handleLogin (req: Request, res: Response) {
    try {
        const validatedData = LoginSchema.parse(req.body)

        const result = await authService.login(validatedData)

        return res.status(200).json({
            success: true,  
            data: result,
            message: "Login succedded",
        })
    } catch(error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ errors: error.errors });
        }
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}