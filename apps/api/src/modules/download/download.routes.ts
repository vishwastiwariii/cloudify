import express, { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { getDownloadUrl } from './download.controller'

const router: Router = express.Router()

router.get('/:fileId/download', authMiddleware, getDownloadUrl)

export default router