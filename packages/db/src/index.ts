import dotenv from 'dotenv'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from "@prisma/adapter-pg"

// Loaded here, not left to the consumer: the connection string is read once when
// this module is evaluated, so an app that happens to reach `@repo/db` before its
// own env module would otherwise build the adapter with an undefined string and
// fail later with an opaque driver error. Already-set vars are never overwritten.
dotenv.config()

const connectionString = process.env.DATABASE_URL

if(!connectionString) {
    throw new Error("Missing required DATABASE_URL")
}

const adapter = new PrismaPg({
    connectionString
})

const prisma = new PrismaClient({
    adapter
})


export default prisma
