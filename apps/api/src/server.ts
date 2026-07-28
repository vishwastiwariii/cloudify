import config from './config/env'
import prisma from '@repo/db'
import app from './app'

const PORT = config.port

async function main () {
    try {
        await prisma.$queryRaw`SELECT 1`
        console.log("Prisma connected to database successfully")

        app.listen(PORT, () => {
            console.log(`Server is started at ${PORT}`)
        })
    } catch (error) {
        console.error("Internal Server Error", error)
    }
}

main()