import axios from 'axios'

function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.error
    if (typeof msg === 'string' && msg.length > 0 && !/^[a-z_]+$/.test(msg)) {
      return msg
    }
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

    async updateProfile(token: string, profile: ProfileUpdate): Promise<string> {
      const res = await axios.patch<{ token: string }>('/api/users/me', profile, authHeaders(token))
      return res.data.token
    },

    async updatePhone(token: string, phone: string): Promise<void> {
      await axios.patch('/api/users/me/phone', { phone }, authHeaders(token))
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

    async update(
      token: string,
      id: string,
      input: { seatsAvailable: number },
    ): Promise<void> {
      await axios.patch(`/api/ride-offers/${id}`, input, authHeaders(token))
    },

    async open(token: string, id: string): Promise<void> {
      await axios.patch(`/api/ride-offers/${id}/open`, {}, authHeaders(token))
    },

    async fetchMine(token: string): Promise<PopulatedOffer[]> {
      const res = await axios.get<PopulatedOffer[]>('/api/ride-offers/mine', authHeaders(token))
      return res.data
    },

    async cancel(token: string, id: string): Promise<void> {
      await axios.patch(`/api/ride-offers/${id}/cancel`, {}, authHeaders(token))
    },

    async close(token: string, id: string): Promise<void> {
      await axios.patch(`/api/ride-offers/${id}/close`, {}, authHeaders(token))
    },

    async fetchForGame(token: string, gameId: string, passengerOrigin?: string): Promise<RideOffer[]> {
      const params = passengerOrigin ? { passengerOrigin } : {}
      const res = await axios.get<RideOffer[]>(`/api/ride-offers/game/${gameId}`, { ...authHeaders(token), params })
      return res.data
    },

    async join(token: string, offerId: string, requestId: string): Promise<void> {
      await axios.post(`/api/ride-offers/${offerId}/join`, { requestId }, authHeaders(token))
    },

    async acceptPassenger(token: string, offerId: string, passengerId: string): Promise<void> {
      await axios.post(`/api/ride-offers/${offerId}/accept-passenger`, { passengerId }, authHeaders(token))
    },

    async rejectPassenger(token: string, offerId: string, passengerId: string): Promise<void> {
      await axios.post(`/api/ride-offers/${offerId}/reject-passenger`, { passengerId }, authHeaders(token))
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
