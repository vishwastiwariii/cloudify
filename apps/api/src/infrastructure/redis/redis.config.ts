import config from "../../config/env";

const redisUrl = new URL(config.redisUrl);

// `new URL` keeps credentials percent-encoded, so passwords containing
// characters like @ : / must be decoded before being sent to Redis.
function decode(value: string) {
    return value ? decodeURIComponent(value) : undefined;
}

// Path is "/<db>" ("" or "/" means db 0).
const db = Number(redisUrl.pathname.slice(1)) || 0;

const isTls = redisUrl.protocol === "rediss:";

export const redisConfig = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || (isTls ? 6380 : 6379)),
    username: decode(redisUrl.username),
    password: decode(redisUrl.password),
    db,
    maxRetriesPerRequest: null,
    ...(isTls ? { tls: { servername: redisUrl.hostname } } : {}),
};
