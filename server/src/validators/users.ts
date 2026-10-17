import { z } from 'zod'
import { isKnownBrand } from '../lib/fuelCost.js'

const currentYear = new Date().getFullYear()

const israeliPhone = /^0(5\d|[2-489])[-\s]?\d{7}$/

export const profileBody = z.object({
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

export const phoneBody = z.object({
  phone: z.string().trim().regex(israeliPhone, 'invalid_phone'),
})

export type ProfileBody = z.infer<typeof profileBody>
export type PhoneBody = z.infer<typeof phoneBody>
