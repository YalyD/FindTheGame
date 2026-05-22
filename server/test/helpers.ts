import jwt from 'jsonwebtoken'
import { User, IUser } from '../src/models/User.js'
import { Game, IGame } from '../src/models/Game.js'

export interface TestUser {
  user: IUser
  token: string
  authHeader: { Authorization: string }
}

let counter = 0

export async function makeUser(overrides: Partial<IUser> = {}): Promise<TestUser> {
  counter++
  const user = await User.create({
    googleId: `google-${counter}-${Date.now()}`,
    email: `test${counter}@example.com`,
    name: overrides.name ?? `Test User ${counter}`,
    picture: '',
    favoriteTeam: 'מכבי תל אביב',
    address: 'Test St 1, Tel Aviv',
    car: { make: 'Toyota', model: 'Corolla', year: 2020, seats: 5 },
    ...overrides,
  })

  const profileComplete = Boolean(user.favoriteTeam && user.address && user.car?.make)
  const token = jwt.sign(
    { userId: user._id.toString(), profileComplete },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' },
  )
  return {
    user,
    token,
    authHeader: { Authorization: `Bearer ${token}` },
  }
}

export async function makeIncompleteUser(): Promise<TestUser> {
  return makeUser({ favoriteTeam: undefined, address: undefined, car: undefined })
}

export async function makeGame(overrides: Partial<IGame> = {}): Promise<IGame> {
  return Game.create({
    homeTeam: 'מכבי תל אביב',
    awayTeam: 'הפועל באר שבע',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    stadium: 'בלומפילד',
    city: 'תל אביב',
    competition: 'ליגת העל',
    ...overrides,
  })
}
