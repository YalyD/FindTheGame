import * as gameRepository from '../repositories/gameRepository.js'
import * as userRepository from '../repositories/userRepository.js'

export async function listUpcomingForUser(userId: string) {
  const user = await userRepository.findById(userId, 'favoriteTeam')
  if (!user?.favoriteTeam) return []
  return gameRepository.findUpcomingForTeam(user.favoriteTeam)
}
