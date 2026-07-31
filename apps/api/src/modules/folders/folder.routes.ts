import express, { Router } from 'express'
import { getAllFolder, getFolder, handleCreateFolder, handleDeleteFolder, handleMoveFolder, handleUpdateFolder } from './folder.controller'
import { authMiddleware } from '../../middleware/auth.middleware'

const router: Router = express.Router()

router.post('/', authMiddleware, handleCreateFolder)
router.get('/', authMiddleware, getAllFolder)
router.get('/:folderId', authMiddleware, getFolder)
router.post('/:folderId/move', authMiddleware, handleMoveFolder)
router.delete('/:folderId', authMiddleware, handleDeleteFolder)
router.patch('/:folderId', authMiddleware, handleUpdateFolder)

export default router