import express, { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { getUsage } from './storage.controller'

const router: Router = express.Router()

router.get('/', authMiddleware, getUsage)

export default router