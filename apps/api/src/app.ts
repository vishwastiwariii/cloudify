import express from 'express'
import type { Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import config from './config/env'
import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/user.routes'
import { errorHandler } from './middleware/error.middleware'

const app: Express = express()

app.use(cors({ origin: config.clientUrl, credentials: true }))
app.use(express.json({limit: "1mb"}))
app.use(cookieParser())

app.use('/auth', authRoutes)
app.use('/user', userRoutes)

app.use(errorHandler)

export default app