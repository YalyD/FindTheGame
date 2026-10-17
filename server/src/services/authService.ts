import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { IUser } from '../models/User.js'
import { env } from '../lib/env.js'
import { HttpError } from '../lib/errors.js'
import * as userRepository from '../repositories/userRepository.js'

let _googleClient: OAuth2Client | null = null
function googleClient(): OAuth2Client {
  if (!_googleClient) _googleClient = new OAuth2Client(env().GOOGLE_CLIENT_ID)
  return _googleClient
}

export function isProfileComplete(user: IUser): boolean {
  return Boolean(user.favoriteTeam && user.address && user.car?.brand)
}

export function issueToken(user: IUser) {
  const profileComplete = isProfileComplete(user)
  const token = jwt.sign(
    { userId: user._id!.toString(), profileComplete },
    env().JWT_SECRET,
    { expiresIn: '7d' },
  )
  return { token, profileComplete }
}

export async function loginWithGoogle(credential: string) {
  let payload
  try {
    const ticket = await googleClient().verifyIdToken({
      idToken: credential,
      audience: env().GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch {
    throw new HttpError(401, 'invalid_google_token')
  }
  if (!payload?.sub) {
    throw new HttpError(401, 'invalid_google_token')
  }

  const user = await userRepository.upsertByGoogleId({
    googleId: payload.sub,
    email: payload.email ?? '',
    name: payload.name ?? '',
    picture: payload.picture ?? '',
  })

  return { ...issueToken(user), name: user.name }
}
