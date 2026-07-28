import dotenv from 'dotenv'
dotenv.config({ quiet: true })

interface Config {
    node_env: string
    jwt: {
        secret: string
        refreshSecret: string
    }
    redisUrl: string
    smtp: {
        host: string
        port: number
        user: string
        pass: string
    }
    clientUrl: string, 
    port: number
}

const REQUIRED = [ 
    "JWT_SECRET", 
    "JWT_REFRESH_SECRET",
    "REDIS_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "CLIENT_URL", 
    "PORT", 
    "NODE_ENV"
]


function getEnv(key: string) {
    const value = process.env[key]

    if(!value){
        throw new Error(`Missing required ${key}`)
    }

    return value
}


const config: Config = {
    jwt: {
        secret: getEnv("JWT_SECRET"),
        refreshSecret: getEnv("JWT_REFRESH_SECRET"),
    },
    redisUrl: getEnv("REDIS_URL"),
    smtp: {
        host: getEnv("SMTP_HOST"),
        port: Number(getEnv("SMTP_PORT")),
        user: getEnv("SMTP_USER"),
        pass: getEnv("SMTP_PASS"),
    },
    clientUrl: getEnv("CLIENT_URL"),
    port: Number(getEnv("PORT")), 
    node_env: getEnv("NODE_ENV")
}

export default config