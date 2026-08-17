import express, { Router } from 'express'
import { getFile, handleDeleteFile, handleMoveFile, handleRenameFile } from './file.controller'
import { authMiddleware } from '../../middleware/auth.middleware'


const router: Router = express.Router()

// File rows are created only by the upload flow (POST /uploads/initiate ->
// POST /uploads/complete), which derives the storage key server-side. There is
// deliberately no endpoint that lets a client name the object a file points at.
router.get('/:fileId', authMiddleware, getFile)
router.delete('/:fileId', authMiddleware, handleDeleteFile)
router.post('/:fileId', authMiddleware, handleRenameFile)
router.patch('/:fileId/move', authMiddleware, handleMoveFile)

export default router