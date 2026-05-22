import 'dotenv/config'
import { loadEnv } from './lib/env.js'

// Validate env BEFORE any other module (especially routes) reads process.env.
const env = loadEnv()

const { createApp } = await import('./app.js')
const { connectDb } = await import('./db.js')
const { initWebPush } = await import('./lib/webpush.js')

async function main() {
  await connectDb()
  initWebPush()
  const app = createApp()
  app.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`)
  })
}

main().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
