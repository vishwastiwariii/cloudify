import { z } from 'zod'

export const SignupSchema = z.object({
    email: z.string().email('Invalid Email Address'),
    password: z.string().min(8, 'Password must be 8 characters long'),
    name: z.string().min(2)
})

export const LoginSchema = z.object({
    email: z.string().email('Invalid Email Address'),
    password: z.string().min(1, 'Password is required')
})

export type SignupDto = z.infer<typeof SignupSchema>
export type LoginDto = z.infer<typeof LoginSchema>