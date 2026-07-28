import type { SignupDto, LoginDto } from '@repo/validation'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import prisma from '@repo/db'
import config from '../../config/env'

export class AuthError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
    }
}

export class AuthService {
    
    async signUp(dto: SignupDto) {
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
                name: name
            }
        })

        const token = jwt.sign(
            {userId: user.id, email: user.email},
            config.jwt.secret, 
            { expiresIn: '7d'}
        )

        const { password: _, ...safeUser } = user 
        return {
            user: safeUser, 
            token
        }
    }

    async login(dto: LoginDto) {
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

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            config.jwt.secret,
            { expiresIn: '7d'}
        )

        const { password: _, ...safeUser } = user
        return { user: safeUser, token}
    }
}