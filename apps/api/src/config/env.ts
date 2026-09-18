import dotenv from 'dotenv'

// No hosting platform injects env vars for us on a bare EC2 box, so pick the
// file by NODE_ENV (set by pm2's ecosystem config before this module loads).
dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env.production.local' : '.env',
    quiet: true
})

interface Config {
    node_env: string
    jwt: {
        secret: string
        refreshSecret: string
    }
    redisUrl: string
    clientUrl: string,
    port: number,
    queuePrefix: string,
    gcp_bucket_name: string,
    gcp_project_id: string, 
    gcp_client_email: string, 
    gcp_private_key: string
}

const REQUIRED = [ 
    "JWT_SECRET", 
    "JWT_REFRESH_SECRET",
    "REDIS_URL",
    "CLIENT_URL", 
    "PORT", 
    "NODE_ENV",
    "GCP_PROJECT_ID",
    "GCP_BUCKET_NAME", 
    "GCP_CLIENT_EMAIL", 
    "GCP_PRIVATE_KEY"
]


function getEnv(key: string) {
    const value = process.env[key]

    if(!value){
        throw new Error(`Missing required ${key}`)
    }

    return value
}

// Lowercased so the value is comparable regardless of how it was written in
const nodeEnv = getEnv("NODE_ENV").toLowerCase()


const config: Config = {
    jwt: {
        secret: getEnv("JWT_SECRET"),
        refreshSecret: getEnv("JWT_REFRESH_SECRET"),
    },
    redisUrl: getEnv("REDIS_URL"),
    clientUrl: getEnv("CLIENT_URL"),
    port: Number(getEnv("PORT")),
    node_env: nodeEnv,
    queuePrefix: process.env.QUEUE_PREFIX || `bull:${nodeEnv}`,
    gcp_bucket_name: getEnv("GCP_BUCKET_NAME"),
    gcp_client_email: getEnv("GCP_CLIENT_EMAIL"),
    // A PEM key survives a single-line .env only as literal "\n" escapes, which
    // the crypto layer rejects with an opaque DECODER error.
    gcp_private_key: getEnv("GCP_PRIVATE_KEY").replace(/\\n/g, "\n"),
    gcp_project_id: getEnv("GCP_PROJECT_ID")
}

export default config