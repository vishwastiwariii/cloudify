import type { SignupDto, LoginDto } from '@repo/validation'
import type { Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import prisma from '@repo/db'
import config from '../../config/env'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from './auth.constants'

export class AuthError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
    }
}

interface AuthTokenPayload {
    userId: string
    email: string
}

export class AuthService {

    private generateAuthToken(payload: AuthTokenPayload) {
        return jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' })
    }

    private verifyAuthToken(token: string): AuthTokenPayload {
        try {
            return jwt.verify(token, config.jwt.secret) as AuthTokenPayload
        } catch {
            throw new AuthError('Invalid or expired token', 401)
        }
    }

    private setAuthCookies(res: Response, token: string) {
        res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)
    }

    private clearAuthCookies(res: Response) {
        res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS)
    }

    private toSafeUser<T extends { password: string, storageLimit: bigint, storageUsed: bigint }>(user: T) {
        const { password, storageLimit, storageUsed, ...safeUser } = user
        return safeUser
    }

    async signUp(dto: SignupDto, res?: Response) {
        const { email, password, name } = dto

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(existingUser) {
            throw new AuthError('User already exists with the same email', 409)
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                email: email, 
                password: hashedPassword, 
                name: name,
            }
        })

        const token = this.generateAuthToken({ userId: user.id, email: user.email })

        if (res) {
            this.setAuthCookies(res, token)
        }

        return {
            user: this.toSafeUser(user),
            token
        }
    }

    async login(dto: LoginDto, res?: Response) {
        const { email, password } = dto

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user) {
            throw new AuthError('Invalid Email', 401)
        }

        const isValid = await bcrypt.compare(password, user.password)

        if(!isValid) {
            throw new AuthError('Invalid Password', 401)
        }

        const token = this.generateAuthToken({ userId: user.id, email: user.email })

        if (res) {
            this.setAuthCookies(res, token)
        }

        return { user: this.toSafeUser(user), token }
    }

    async authenticate(token: string) {
        const payload = this.verifyAuthToken(token)

        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId
            }
        })

        if (!user) {
            throw new AuthError('User not found', 401)
        }

        return this.toSafeUser(user)
    }

    async logout(res: Response) {
        this.clearAuthCookies(res)
    }
}