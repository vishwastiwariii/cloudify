import express, { Router } from 'express'
import { handleLogin, handleSignup } from './auth.controller'

const router: Router = express.Router()

router.post('/signup', handleSignup)
router.post('/login', handleLogin)

export default router