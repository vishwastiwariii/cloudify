import express, { Router } from 'express'
import { getFile, handleCreateFile, handleDeleteFile, handleMoveFile, handleRenameFile } from './file.controller'
import { authMiddleware } from '../../middleware/auth.middleware'


const router: Router = express.Router()

router.post('/', authMiddleware, handleCreateFile)
router.get('/:fileId', authMiddleware, getFile)
router.delete('/:fileId', authMiddleware, handleDeleteFile)
router.post('/:fileId', authMiddleware, handleRenameFile)
router.patch('/:fileId/move', authMiddleware, handleMoveFile)

export default router