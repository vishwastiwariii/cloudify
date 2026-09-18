// pm2 process definition for the API on EC2.
// package.json has "type": "module", so this file must stay CommonJS (.cjs)
// or pm2/Node will try to parse it as ESM and fail.
//
// Usage (from apps/api/, with NODE_ENV=production already exported so
// src/config/env.ts loads .env.production.local instead of .env):
//   NODE_ENV=production pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup   # follow the printed command to run pm2 on boot

module.exports = {
    apps: [
        {
            name: 'cloudify-api',
            cwd: __dirname,
            script: 'pnpm',
            args: 'start',
            interpreter: 'none',
            env: {
                NODE_ENV: 'production',
            },
            autorestart: true,
            max_restarts: 10,
            restart_delay: 3000,
            out_file: 'logs/out.log',
            error_file: 'logs/error.log',
            time: true,
        },
    ],
}
