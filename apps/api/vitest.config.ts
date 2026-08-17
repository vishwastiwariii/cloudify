import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./src/test/setup.ts'],
        // The e2e suite needs Postgres and Redis running, so it is a separate
        // opt-in target (`pnpm test:e2e`) rather than part of the default run.
        exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e.test.ts'],
    },
})
