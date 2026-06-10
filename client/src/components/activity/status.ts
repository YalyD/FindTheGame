import { ACTIVITY } from '../../constants'

export const REQUEST_STATUS: Record<
  PopulatedRequest['status'],
  { label: string; color: 'info' | 'success' | 'default' }
> = {
  open: { label: ACTIVITY.requestStatus.open, color: 'info' },
  matched: { label: ACTIVITY.requestStatus.matched, color: 'success' },
  cancelled: { label: ACTIVITY.requestStatus.cancelled, color: 'default' },
}

export const OFFER_STATUS: Record<
  PopulatedOffer['status'],
  { label: string; color: 'info' | 'warning' | 'default' }
> = {
  open: { label: ACTIVITY.offerStatus.open, color: 'info' },
  full: { label: ACTIVITY.offerStatus.full, color: 'warning' },
  cancelled: { label: ACTIVITY.offerStatus.cancelled, color: 'default' },
}
