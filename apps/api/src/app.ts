import express from 'express'
import type { Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import config from './config/env'
import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/user.routes'
import folderRoutes from './modules/folders/folder.routes'
import fileRoutes from './modules/files/file.routes'
import uploadRoutes from './modules/upload/uploads.routes'
import storageRoutes from './modules/storage/storage.routes'
import downloadRoutes from './modules/download/download.routes'
import shareRoutes, { publicShareRouter } from './modules/share/share.routes'
import { errorHandler } from './middleware/error.middleware'

const app: Express = express()

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100,
})

app.use(cors({ origin: config.clientUrl, credentials: true }))
app.use(express.json({limit: "1mb"}))
app.use(cookieParser())
app.use(limiter)

app.use('/auth', authRoutes)
app.use('/user', userRoutes)
app.use('/folders', folderRoutes)
app.use('/files', fileRoutes)
app.use('/files', downloadRoutes)
app.use('/files', shareRoutes)
app.use('/share', publicShareRouter)
app.use('/uploads', uploadRoutes)
app.use('/storage', storageRoutes)

app.use(errorHandler)

export default app