import express from 'express'
import type { Express } from 'express'
import authRoutes from './modules/auth/auth.routes'

const app: Express = express()

app.use(express.json({limit: "1mb"}))

app.use('/auth', authRoutes)

export default app