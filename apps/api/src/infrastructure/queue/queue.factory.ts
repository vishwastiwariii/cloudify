import {
    Queue,
    type ConnectionOptions,
    type DefaultJobOptions,
    type QueueOptions,
} from "bullmq";
import config from "../../config/env";
import { redisConfig } from "../redis/redis.config";

// `connection` is required by QueueOptions, but the factory supplies it, so
// callers only ever override it.
export type CreateQueueOptions = Omit<QueueOptions, "connection"> & {
    connection?: ConnectionOptions;
};

const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
    attempts: 3,

    backoff: {
        type: "exponential",
        delay: 2000,
    },

    removeOnComplete: {
        age: 24 * 60 * 60,
        count: 1000,
    },

    removeOnFail: {
        age: 7 * 24 * 60 * 60,
        count: 1000,
    },
};

// Every Queue opens its own Redis connection, so a queue name maps to exactly
// one instance for the lifetime of the process.
const queues = new Map<string, Queue<any>>();

export function createQueue<TData = unknown>(
    name: string,
    options: CreateQueueOptions = {}
): Queue<TData> {
    const existing = queues.get(name);

    if (existing) {
        return existing as Queue<TData>;
    }

    const { connection, defaultJobOptions, ...rest } = options;

    const queue = new Queue<TData>(name, {
        prefix: config.queuePrefix,
        ...rest,
        connection: connection ?? redisConfig,
        defaultJobOptions: {
            ...DEFAULT_JOB_OPTIONS,
            ...defaultJobOptions,
        },
    });

    // Queue extends EventEmitter: an unhandled 'error' (e.g. Redis going away)
    // would otherwise take down the process.
    queue.on("error", (error) => {
        console.error(`Queue "${name}" error: `, error);
    });

    queues.set(name, queue);

    return queue;
}

export function getQueue(name: string): Queue<any> | undefined {
    return queues.get(name);
}

export async function closeQueues(): Promise<void> {
    const open = [...queues.values()];

    queues.clear();

    const results = await Promise.allSettled(open.map((queue) => queue.close()));

    for (const result of results) {
        if (result.status === "rejected") {
            console.error("Error closing queue: ", result.reason);
        }
    }
}
