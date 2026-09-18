import express from 'express'
import type { Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import config from './config/env'
import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/user.routes'
import folderRoutes from './modules/folders/folder.routes'
import fileRoutes from './modules/files/file.routes'
import uploadRoutes from './modules/upload/uploads.routes'
import storageRoutes from './modules/storage/storage.routes'
import downloadRoutes from './modules/download/download.routes'
import searchRoutes from './modules/search/search.routes'
import dashboardRoutes from './modules/dashboard/dashboard.routes'
import shareRoutes, { publicShareRouter } from './modules/share/share.routes'
import { errorHandler } from './middleware/error.middleware'

const app: Express = express()

// EC2 sits behind nginx doing TLS termination, so Express needs to trust its
// X-Forwarded-* headers for req.secure and express-rate-limit's IP detection
// to work correctly.
if (config.node_env === 'production') {
    app.set('trust proxy', 1)
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100,
})

app.use(helmet())
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
app.use('/search', searchRoutes)
app.use('/dashboard', dashboardRoutes)

app.use(errorHandler)

export default app