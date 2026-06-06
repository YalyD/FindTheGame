import { Alert, Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ACTIVITY } from '../constants'
import { LoadingCards } from '../components/shared/LoadingCards'
import { RequestCard } from '../components/activity/RequestCard'
import { OfferCard } from '../components/activity/OfferCard'
import type { PopulatedOffer, PopulatedRequest } from '../components/activity/types'

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

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios
      .get<PopulatedRequest[]>('/api/ride-requests/mine', { headers })
      .then((res) => setRequests(res.data))
      .catch(() => setError(ACTIVITY.errorLoadRequests))
      .finally(() => setLoadingReq(false))

    axios
      .get<PopulatedOffer[]>('/api/ride-offers/mine', { headers })
      .then((res) => setOffers(res.data))
      .catch(() => setError(ACTIVITY.errorLoadOffers))
      .finally(() => setLoadingOff(false))
  }, [token])

  async function cancelRequest(id: string) {
    await axios.patch(`/api/ride-requests/${id}/cancel`, {}, { headers })
    setRequests((prev) => prev.filter((r) => r._id !== id))
  }

  async function cancelOffer(id: string) {
    await axios.patch(`/api/ride-offers/${id}/cancel`, {}, { headers })
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
