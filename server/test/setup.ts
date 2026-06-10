import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import mongoose from 'mongoose'
import { OAuth2Client } from 'google-auth-library'

// Globally stub verifyIdToken on the OAuth2Client prototype. Auth tests
// override the implementation via mockGoogleVerify.mockResolvedValueOnce(...).
// Default behavior: reject as "invalid token" so anything other than an
// explicitly-configured test fails the auth check.
export const mockGoogleVerify = vi.fn().mockRejectedValue(new Error('no mock set'))
vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockImplementation((...args) =>
  mockGoogleVerify(...args),
)

// No real network in tests: the fuel-cost estimate (fueleconomy.gov,
// Nominatim, OSRM) degrades to null when fetch rejects. Tests that need
// specific responses override this with mockFetch.mockResolvedValueOnce(...).
export const mockFetch = vi.fn().mockRejectedValue(new Error('network disabled in tests'))
vi.stubGlobal('fetch', mockFetch)

// Set env BEFORE any module imports loadEnv().
// The test database is a separate DB on the dev `mongo` container — never the
// app's working database, so cleanup is safe.
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-at-least-thirty-two-characters-long'
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://mongo:27017/findthegame-test'
process.env.PORT = '4001'

const { loadEnv } = await import('../src/lib/env.js')
loadEnv()

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!)
})

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase()
  }
  await mongoose.disconnect()
})

beforeEach(async () => {
  const db = mongoose.connection.db
  if (!db) return
  const collections = await db.collections()
  await Promise.all(collections.map((c) => c.deleteMany({})))
})
