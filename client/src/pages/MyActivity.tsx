import { Alert, Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { ACTIVITY } from '../constants'
import { api } from '../apiHandler'
import { LoadingCards } from '../components/shared/LoadingCards'
import { RequestCard } from '../components/activity/RequestCard'
import { OfferCard } from '../components/activity/OfferCard'

interface Props {
  token: string
}

export function MyActivity({ token }: Props) {
  const [tab, setTab] = useState(0)
  const [requests, setRequests] = useState<PopulatedRequest[]>([])
  const [offers, setOffers] = useState<PopulatedOffer[]>([])
  const [loadingReq, setLoadingReq] = useState(true)
  const [loadingOff, setLoadingOff] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.rideRequests
      .fetchMine(token)
      .then(setRequests)
      .catch(() => setError(ACTIVITY.errorLoadRequests))
      .finally(() => setLoadingReq(false))

    api.rideOffers
      .fetchMine(token)
      .then(setOffers)
      .catch(() => setError(ACTIVITY.errorLoadOffers))
      .finally(() => setLoadingOff(false))
  }, [token])

  async function cancelRequest(id: string) {
    await api.rideRequests.cancel(token, id)
    setRequests((prev) => prev.filter((r) => r._id !== id))
  }

  async function cancelOffer(id: string) {
    await api.rideOffers.cancel(token, id)
    setOffers((prev) => prev.filter((o) => o._id !== id))
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
                  <RequestCard key={req._id} req={req} onCancel={cancelRequest} />
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
                  <OfferCard key={offer._id} offer={offer} onCancel={cancelOffer} />
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
