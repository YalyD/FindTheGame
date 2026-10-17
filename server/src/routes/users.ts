import { Router, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { User } from '../models/User.js'
import { env } from '../lib/env.js'
import { isKnownBrand } from '../lib/fuelCost.js'
import { HttpError } from '../middleware/errorHandler.js'

export const usersRouter = Router()

usersRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId, 'name email picture favoriteTeam address phone car')
  if (!user) throw new HttpError(404, 'user_not_found')
  res.json({
    name: user.name,
    email: user.email,
    picture: user.picture,
    favoriteTeam: user.favoriteTeam ?? '',
    address: user.address ?? '',
    phone: user.phone ?? '',
    car: user.car ?? null,
  })
})

const currentYear = new Date().getFullYear()

const israeliPhone = /^0(5\d|[2-489])[-\s]?\d{7}$/

const profileBody = z.object({
  favoriteTeam: z.string().trim().min(2).max(60),
  address: z.string().trim().min(3).max(200),
  phone: z.string().trim().regex(israeliPhone, 'invalid_phone').optional(),
  car: z.object({
    brand: z.string().trim().min(1).max(40).refine(isKnownBrand, 'unknown_brand'),
    model: z.string().trim().min(1).max(40),
    year: z.number().int().min(1990).max(currentYear + 1),
    seats: z.number().int().min(2).max(8),
  }),
})

usersRouter.patch(
  '/me',
  requireAuth,
  validate(profileBody),
  async (req: AuthRequest, res: Response) => {
    const { favoriteTeam, address, phone, car } = req.body as z.infer<typeof profileBody>

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { favoriteTeam, address, phone: phone ?? '', car },
      { new: true },
    )

    if (!user) throw new HttpError(404, 'user_not_found')

    const profileComplete = Boolean(user.favoriteTeam && user.address && user.car?.brand)

    const token = jwt.sign(
      { userId: user._id.toString(), profileComplete },
      env().JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.json({ token, profileComplete })
  },
)

const phoneBody = z.object({
  phone: z.string().trim().regex(israeliPhone, 'invalid_phone'),
})

usersRouter.patch(
  '/me/phone',
  requireAuth,
  validate(phoneBody),
  async (req: AuthRequest, res: Response) => {
    const { phone } = req.body as z.infer<typeof phoneBody>
    const user = await User.findByIdAndUpdate(req.user!.userId, { phone }, { new: true })
    if (!user) throw new HttpError(404, 'user_not_found')
    res.json({ ok: true })
  },
)
