import prisma from "@repo/db"

export function register(email, password) {
    const existing = prisma.user.findFirst({
        email: email
    })
}