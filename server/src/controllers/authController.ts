import { Request, Response } from 'express'
import * as authService from '../services/authService.js'
import { GoogleBody } from '../validators/auth.js'

export async function googleLogin(req: Request, res: Response) {
  const { credential } = req.body as GoogleBody
  res.json(await authService.loginWithGoogle(credential))
}
