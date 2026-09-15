# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cloudify is a pnpm/Turborepo monorepo. `apps/api` is an Express backend (auth, users, file storage in progress); `apps/web` is a mostly-unmodified Next.js starter app. Shared logic lives in `packages/`.

## Commands

All commands run from the repo root via Turborepo unless noted.

- `pnpm dev` — run all apps in dev mode (turbo, persistent)
- `pnpm build` — build all apps/packages
- `pnpm lint` — lint all apps/packages
- `pnpm check-types` — typecheck all apps/packages (no emit)
- `pnpm format` — prettier `--write` across `**/*.{ts,tsx,md}`

Docker (Postgres, Redis, MinIO, Mailpit, api, web): `docker-compose up`.

### API (`apps/api`)

Run these from `apps/api/`, or prefix with `pnpm --filter api`:

- `pnpm dev` — `tsx watch src/server.ts`
- `pnpm test` — `vitest run` (all tests, once)
- `pnpm test:watch` — `vitest` (watch mode)
- Single test file: `pnpm test src/test/auth.service.test.ts` (or `npx vitest run <path>` from `apps/api/`)
- Single test by name: `npx vitest run -t "<test name>"` from `apps/api/`

Test env vars are set in `apps/api/src/test/setup.ts` (loaded via `vitest.config.ts` `setupFiles`) — tests don't need a real `.env`.

### DB (`packages/db`, Prisma)

Run from `packages/db/`:

- `pnpm db:generate` — `prisma generate`
- `pnpm db:migrate` — `prisma migrate dev`
- `pnpm db:deploy` — `prisma migrate deploy`

Generated client is checked into `packages/db/generated/prisma` and imported as `@repo/db` (default export `prisma`, a `PrismaClient` wired with the `@prisma/adapter-pg` driver adapter, reading `DATABASE_URL`).

## Architecture

### Monorepo layout

- `apps/api` — Express 5 API, TypeScript, ESM (`"type": "module"`)
- `apps/web` — Next.js app, still close to the `create-turbo` starter (not yet built out)
- `packages/db` — Prisma schema + generated client, exported as `@repo/db`
- `packages/validation` — shared Zod schemas/DTOs, exported as `@repo/validation`
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` — shared frontend config/components (standard turborepo-starter packages)

Workspace packages are consumed via TS path/`exports` pointing at source (`.ts`) directly — no build step needed between packages in dev (e.g. `@repo/db`'s `exports` is `./src/index.ts`, `@repo/validation`'s is `./index.ts`).

### API module structure

Each domain lives under `apps/api/src/modules/<name>/` with a consistent file split:

- `<name>.routes.ts` — Express `Router`, maps paths to controller handlers
- `<name>.controller.ts` — parses/validates request with a Zod schema from `@repo/validation`, calls the service, shapes the HTTP response, catches errors inline (ZodError → 400, `AuthError`/domain error → its `statusCode`, else 500 + log)
- `<name>.service.ts` — business logic, talks to `prisma` directly (no repository layer)
- `<name>.constants.ts` — module-local constants (e.g. cookie name/options)

Routes are mounted in `apps/api/src/app.ts` (currently only `/auth` — see `authRoutes`). `error.middleware.ts` (`errorHandler`) duplicates the same ZodError/AuthError/500 branching as a catch-all `app.use`, so most controllers' try/catch is a belt-and-suspenders pattern, not the sole error path.

The `users` module (`apps/api/src/modules/users/`) exists as scaffolding but is not implemented or mounted yet.

### Auth flow

- JWT stored in an httpOnly cookie (`AUTH_COOKIE_NAME` = `accessToken`, see `auth.constants.ts`), not a bearer header.
- `AuthService` (`auth.service.ts`) owns sign/verify, cookie set/clear, and password hashing (bcrypt, cost 12). `toSafeUser` strips `password`, `storageLimit`, `storageUsed` before returning a user.
- `authMiddleware` (`middleware/auth.middleware.ts`) reads the cookie, calls `AuthService.authenticate`, and attaches the result to `req.user` (typed via `apps/api/src/types/express.d.ts` global augmentation).
- Domain errors use `AuthError extends Error` with a `statusCode`, thrown from the service layer and translated to HTTP status by controllers/`errorHandler`.
- The `Session`/`Token` Prisma models (refresh sessions, email verification / password reset tokens) exist in the schema but aren't wired into `AuthService` yet — current auth is a single long-lived (7d) access token, no refresh flow.

### Validation

`@repo/validation` exports Zod schemas and their inferred DTO types together (e.g. `SignupSchema` / `SignupDto`) per domain file (`auth.validation.ts`, `user.validation.ts`), re-exported from `index.ts`. Controllers call `Schema.parse(req.body)`; failures are `ZodError`s handled centrally.

### Database schema (`packages/db/prisma/`)

Schema is split across multiple `.prisma` files (`schema.prisma` for generator/datasource, `user.prisma`, `auth.prisma`, `enums.prisma`) rather than one monolithic file. Key models: `User` (soft-delete via `deletedAt`, per-user `storageLimit`/`storageUsed` as `BigInt`), `Session`, `Token` (typed by `TokenType` enum: `EMAIL_VERIFICATION`, `PASSWORD_RESET`).

### Config

`apps/api/src/config/env.ts` loads `.env` via `dotenv` and fails fast (throws) if any required var is missing: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CLIENT_URL`, `PORT`, `NODE_ENV`. Redis and SMTP (Mailpit locally) are required by config even though nothing in the current codebase uses them yet.

### API response shape

All JSON responses follow:

```json
{ "success": true, "message": "", "data": {} }
{ "success": false, "message": "", "errors": [] }
```
