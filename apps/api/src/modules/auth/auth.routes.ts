import express, { Router } from 'express'
import { handleLogin, handleLogout, handleSignup } from './auth.controller'

const router: Router = express.Router()

router.post('/signup', handleSignup)
router.post('/login', handleLogin)
router.post('/logout', handleLogout)

export default router