import { Alert, Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { ACTIVITY } from '../constants'
import { api } from '../apiHandler'
import { LoadingCards } from '../components/shared/LoadingCards'
import { RequestCard } from '../components/activity/RequestCard'
import { OfferCard } from '../components/activity/OfferCard'
import { CreateRideOffer } from './CreateRideOffer'

interface Props {
  token: string
  onViewOffers: (req: PopulatedRequest) => void
}

export function MyActivity({ token, onViewOffers }: Props) {
  const [tab, setTab] = useState(0)
  const [requests, setRequests] = useState<PopulatedRequest[]>([])
  const [offers, setOffers] = useState<PopulatedOffer[]>([])
  const [loadingReq, setLoadingReq] = useState(true)
  const [loadingOff, setLoadingOff] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingOffer, setEditingOffer] = useState<PopulatedOffer | null>(null)

  function loadOffers() {
    return api.rideOffers
      .fetchMine(token)
      .then(setOffers)
      .catch(() => setError(ACTIVITY.errorLoadOffers))
      .finally(() => setLoadingOff(false))
  }

  useEffect(() => {
    api.rideRequests
      .fetchMine(token)
      .then(setRequests)
      .catch(() => setError(ACTIVITY.errorLoadRequests))
      .finally(() => setLoadingReq(false))

    loadOffers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function cancelRequest(id: string) {
    await api.rideRequests.cancel(token, id)
    setRequests((prev) => prev.filter((r) => r._id !== id))
  }

  async function closeOffer(id: string) {
    await api.rideOffers.close(token, id)
    setOffers((prev) => prev.map((o) => (o._id === id ? { ...o, status: 'closed' as const } : o)))
  }

  async function reopenOffer(id: string) {
    await api.rideOffers.open(token, id)
    setOffers((prev) =>
      prev.map((o) =>
        o._id === id ? { ...o, status: o.seatsAvailable > 0 ? 'open' : 'full' } : o,
      ),
    )
  }

  async function cancelOffer(id: string) {
    await api.rideOffers.cancel(token, id)
    setOffers((prev) => prev.filter((o) => o._id !== id))
  }

  async function acceptPassenger(offerId: string, passengerId: string) {
    await api.rideOffers.acceptPassenger(token, offerId, passengerId)
    setOffers((prev) =>
      prev.map((o) => {
        if (o._id !== offerId) return o
        const passenger = o.pendingPassengers.find((p) => p._id === passengerId)
        const updated: PopulatedOffer = {
          ...o,
          pendingPassengers: o.pendingPassengers.filter((p) => p._id !== passengerId),
          passengers: passenger ? [...o.passengers, passenger] : o.passengers,
          seatsAvailable: Math.max(0, o.seatsAvailable - 1),
        }
        return updated
      }),
    )
  }

  async function rejectPassenger(offerId: string, passengerId: string) {
    await api.rideOffers.rejectPassenger(token, offerId, passengerId)
    setOffers((prev) =>
      prev.map((o) =>
        o._id === offerId
          ? { ...o, pendingPassengers: o.pendingPassengers.filter((p) => p._id !== passengerId) }
          : o,
      ),
    )
  }

  if (editingOffer) {
    return (
      <CreateRideOffer
        game={editingOffer.game}
        token={token}
        mode="edit"
        offerId={editingOffer._id}
        initialOrigin={editingOffer.origin}
        initialSeats={editingOffer.seatsAvailable}
        onSuccess={() => {
          setEditingOffer(null)
          setLoadingOff(true)
          loadOffers()
        }}
        onCancel={() => setEditingOffer(null)}
      />
    )
  }

  return (
    <Box>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth">
        <Tab label={ACTIVITY.myRequestsTab(requests.length)} />
        <Tab label={ACTIVITY.myOffersTab(offers.length)} />
      </Tabs>

      <Box sx={{ p: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {tab === 0 && (
          <>
            {loadingReq ? (
              <LoadingCards />
            ) : requests.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {ACTIVITY.noRequests}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {requests.map((req) => (
                  <RequestCard key={req._id} req={req} onCancel={cancelRequest} onViewOffers={onViewOffers} />
                ))}
              </Stack>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            {loadingOff ? (
              <LoadingCards />
            ) : offers.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {ACTIVITY.noOffers}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {offers.map((offer) => (
                  <OfferCard
                    key={offer._id}
                    offer={offer}
                    onClose={closeOffer}
                    onReopen={reopenOffer}
                    onCancel={cancelOffer}
                    onEdit={setEditingOffer}
                    onAcceptPassenger={acceptPassenger}
                    onRejectPassenger={rejectPassenger}
                  />
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
