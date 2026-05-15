import 'dotenv/config'
import { createApp } from './app'
import { connectDb } from './db'

const PORT = Number(process.env.PORT) || 4000

async function main() {
  await connectDb()
  const app = createApp()
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
