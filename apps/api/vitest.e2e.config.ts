import { defineConfig } from 'vitest/config'

// Requires Postgres and Redis (docker-compose up). Runs against the real
// database and queues, so it is kept out of the default `pnpm test` run.
export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./src/test/setup.ts'],
        include: ['**/*.e2e.test.ts'],
        // Real queues and rows are shared state: parallel files would collide.
        fileParallelism: false,
    },
})
