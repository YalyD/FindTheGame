import { Skeleton, Stack } from '@mui/material'

interface Props {
  count?: number
  height?: number
}

// Placeholder skeleton cards shown while a list is loading.
export function LoadingCards({ count = 2, height = 150 }: Props) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={height} />
      ))}
    </Stack>
  )
}
