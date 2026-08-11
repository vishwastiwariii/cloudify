import express, { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { getFiles } from './search.controller'

const router: Router = express.Router()

router.get('/', authMiddleware, getFiles)

export default router