import { Skeleton, Stack } from '@mui/material'

interface Props {
  count?: number
  height?: number
}

export function LoadingCards({ count = 2, height = 150 }: Props) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={height} />
      ))}
    </Stack>
  )
}
