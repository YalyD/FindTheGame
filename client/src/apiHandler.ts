// All calls to the FindTheGame server live here, grouped by resource into
// one `api` object. Components never use axios directly — they call
// api.<section>.<action>(), e.g. api.rideRequests.create(token, input).
import axios from 'axios'

function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

// If the server responded with { error: '...' }, use that message; otherwise the fallback.
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return err.response.data.error
  }
  return fallback
}

export const api = {
  auth: {
    async googleLogin(credential: string): Promise<AuthState> {
      const res = await axios.post<AuthState>('/api/auth/google', { credential })
      return res.data
    },
  },

  users: {
    async fetchProfile(token: string): Promise<ProfileSnapshot> {
      const res = await axios.get<ProfileSnapshot>('/api/users/me', authHeaders(token))
      return res.data
    },

    // Returns the refreshed JWT issued by the server after the profile change.
    async updateProfile(token: string, profile: ProfileUpdate): Promise<string> {
      const res = await axios.patch<{ token: string }>('/api/users/me', profile, authHeaders(token))
      return res.data.token
    },
  },

  games: {
    async fetchAll(token: string): Promise<Game[]> {
      const res = await axios.get<Game[]>('/api/games', authHeaders(token))
      return res.data
    },
  },

  rideRequests: {
    async create(
      token: string,
      input: { gameId: string; origin: string; seatsNeeded: number },
    ): Promise<CreatedRequest> {
      const res = await axios.post<CreatedRequest>('/api/ride-requests', input, authHeaders(token))
      return res.data
    },

    async fetchMine(token: string): Promise<PopulatedRequest[]> {
      const res = await axios.get<PopulatedRequest[]>('/api/ride-requests/mine', authHeaders(token))
      return res.data
    },

    async cancel(token: string, id: string): Promise<void> {
      await axios.patch(`/api/ride-requests/${id}/cancel`, {}, authHeaders(token))
    },
  },

  rideOffers: {
    async create(
      token: string,
      input: { gameId: string; origin: string; seatsAvailable: number },
    ): Promise<void> {
      await axios.post('/api/ride-offers', input, authHeaders(token))
    },

    async fetchMine(token: string): Promise<PopulatedOffer[]> {
      const res = await axios.get<PopulatedOffer[]>('/api/ride-offers/mine', authHeaders(token))
      return res.data
    },

    async cancel(token: string, id: string): Promise<void> {
      await axios.patch(`/api/ride-offers/${id}/cancel`, {}, authHeaders(token))
    },

    async fetchForGame(token: string, gameId: string): Promise<RideOffer[]> {
      const res = await axios.get<RideOffer[]>(`/api/ride-offers/game/${gameId}`, authHeaders(token))
      return res.data
    },

    async join(token: string, offerId: string, requestId: string): Promise<void> {
      await axios.post(`/api/ride-offers/${offerId}/join`, { requestId }, authHeaders(token))
    },
  },

  notifications: {
    async fetchAll(token: string): Promise<INotification[]> {
      const res = await axios.get<INotification[]>('/api/notifications', authHeaders(token))
      return res.data
    },

    async markAllRead(token: string): Promise<void> {
      await axios.patch('/api/notifications/read-all', {}, authHeaders(token))
    },
  },

  push: {
    async fetchVapidPublicKey(): Promise<string> {
      const res = await axios.get<{ key: string }>('/api/push/vapid-public-key')
      return res.data.key
    },

    async subscribe(token: string, subscription: PushSubscriptionJSON): Promise<void> {
      await axios.post('/api/push/subscribe', subscription, authHeaders(token))
    },
  },
}
