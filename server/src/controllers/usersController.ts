import { Response } from 'express'
import { AuthRequest } from '../middleware/requireAuth.js'
import * as userService from '../services/userService.js'
import { PhoneBody, ProfileBody } from '../validators/users.js'

export async function getMe(req: AuthRequest, res: Response) {
  res.json(await userService.getProfile(req.user!.userId))
}

export async function updateMe(req: AuthRequest, res: Response) {
  res.json(await userService.updateProfile(req.user!.userId, req.body as ProfileBody))
}

export async function updateMyPhone(req: AuthRequest, res: Response) {
  const { phone } = req.body as PhoneBody
  await userService.updatePhone(req.user!.userId, phone)
  res.json({ ok: true })
}
