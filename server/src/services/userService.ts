import { HttpError } from '../lib/errors.js'
import * as userRepository from '../repositories/userRepository.js'
import { issueToken } from './authService.js'
import { ProfileBody } from '../validators/users.js'

export async function getProfile(userId: string) {
  const user = await userRepository.findById(
    userId,
    'name email picture favoriteTeam address phone car',
  )
  if (!user) throw new HttpError(404, 'user_not_found')
  return {
    name: user.name,
    email: user.email,
    picture: user.picture,
    favoriteTeam: user.favoriteTeam ?? '',
    address: user.address ?? '',
    phone: user.phone ?? '',
    car: user.car ?? null,
  }
}

export async function updateProfile(userId: string, profile: ProfileBody) {
  const { favoriteTeam, address, phone, car } = profile
  const user = await userRepository.updateById(userId, {
    favoriteTeam,
    address,
    phone: phone ?? '',
    car,
  })
  if (!user) throw new HttpError(404, 'user_not_found')
  return issueToken(user)
}

export async function updatePhone(userId: string, phone: string) {
  const user = await userRepository.updateById(userId, { phone })
  if (!user) throw new HttpError(404, 'user_not_found')
}
