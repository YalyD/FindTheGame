import { User, IUser } from '../models/User.js'

export function findById(id: string, fields?: string) {
  return User.findById(id, fields)
}

export function upsertByGoogleId(profile: {
  googleId: string
  email: string
  name: string
  picture: string
}) {
  return User.findOneAndUpdate(
    { googleId: profile.googleId },
    { $setOnInsert: profile },
    { upsert: true, new: true },
  )
}

export function updateById(
  id: string,
  update: Partial<Pick<IUser, 'favoriteTeam' | 'address' | 'phone' | 'car'>>,
) {
  return User.findByIdAndUpdate(id, update, { new: true })
}
