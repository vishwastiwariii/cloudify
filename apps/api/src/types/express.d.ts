import "express"

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string,
                email: string,
                username: string | null,
                name: string,
                isVerified: boolean,
                verifiedAt: Date | null,
                deletedAt: Date | null,
                createdAt: Date,
                updatedAt: Date,
            }
        }
    }
}

export {}