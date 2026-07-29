import express, { Router } from 'express'
import { handleMe, handleUpdateAvatar, handleUpdateName } from './user.controller'
import { authMiddleware } from '../../middleware/auth.middleware'


const router: Router = express.Router()

router.get('/me', authMiddleware, handleMe)
router.patch('/name', authMiddleware, handleUpdateName)
router.patch('/avatar', authMiddleware, handleUpdateAvatar)

export default router