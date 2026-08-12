import { Redis } from 'ioredis'
import config from '../../config/env'

export const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null, 
    enableReadyCheck: true, 
    lazyConnect: true
})

redis.on('connect', () => {
    console.log("Redis connected")
})

redis.on("ready", () => {
    console.log("Redis ready")
})

redis.on("error", (error) => {
    console.error(
        "Redis connection error: ", error
    )
})

redis.on("close", () => {
    console.log("Redis connection closed")
})