import express, { Router } from 'express'
import { handleCompleteUpload, handleInitiateUpload } from './uploads.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router: Router = express.Router()

router.post('/initiate', authMiddleware, handleInitiateUpload)
router.post('/complete', authMiddleware, handleCompleteUpload)

export default router
