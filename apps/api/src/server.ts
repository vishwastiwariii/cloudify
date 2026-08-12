import config from './config/env'
import prisma from '@repo/db'
import app from './app'
import { redis } from './infrastructure/redis'
import http from "node:http";

const PORT = config.port
let server: http.Server | null = null;
let isShuttingDown = false;

async function main () {
    try {
        await prisma.$queryRaw`SELECT 1`
        console.log("Prisma connected to database successfully")

        await redis.connect()
        console.log("Redis connected successfully")

        server = app.listen(PORT, () => {
            console.log(`Server is started at ${PORT}`)
        })

        server.on("error", (error) => {
            console.error(
                "HTTP Server error: ",
                error
            )

            process.exit(1)
        })
    } catch (error) {
        console.error("Internal Server Error", error)
        await shutdown()
    }
}

async function shutdown () {
    if(isShuttingDown) {
        return 
    }
    
    isShuttingDown = true

    console.log("Graceful shutdown started...")

    try {
        if(server) {
            await new Promise<void> (
                (resolve) => {
                    server!.close(() => {
                        console.log("HTTP server closed")
                    })

                    resolve()
                }
            )
        }

        if(redis.status === "ready" || redis.status === "connecting") {
            await redis.quit()

            console.log("Redis connection closed")
        }

        console.log("Graceful Shutdown Completed")

        process.exit(0)
    } catch (error) {
        console.error("Error during graceful shutdown", error)

        process.exit(1)
    }
}

process.on(
    'SIGTERM', 
    shutdown
)

process.on(
    'SIGINT',
    shutdown
)

main()