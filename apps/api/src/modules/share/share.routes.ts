import express, { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { getPublicDownloadUrl, getShare, handleCreateShare, handleDisableShare } from './share.controller'

const router: Router = express.Router()

router.post('/:fileId/share', authMiddleware, handleCreateShare)
router.get('/:fileId/share', authMiddleware, getShare)
router.delete('/:fileId/share', authMiddleware, handleDisableShare)

// mounted separately because share links are public, with no authMiddleware
export const publicShareRouter: Router = express.Router()

publicShareRouter.get('/:token', getPublicDownloadUrl)
publicShareRouter.post('/:token', getPublicDownloadUrl)

export default router
