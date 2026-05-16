import 'dotenv/config'
import mongoose from 'mongoose'
import { initWebPush, sendPushToUser } from '../lib/webpush.js'
import { User } from '../models/User.js'

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(uri)

  initWebPush()

  const users = await User.find({}, 'name email')
  if (users.length === 0) {
    console.log('No users found')
    await mongoose.disconnect()
    return
  }

  for (const user of users) {
    console.log(`Sending push to ${user.name}...`)
    await sendPushToUser(user._id.toString(), {
      title: 'Find The Game — בדיקה',
      body: `שלום ${user.name}! ההתראות שלך עובדות בהצלחה 🎉`,
    })
    console.log('Done.')
  }

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
