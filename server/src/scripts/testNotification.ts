import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { Notification } from '../models/Notification.js'

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(uri)

  const users = await User.find({}, 'name email')
  if (users.length === 0) {
    console.log('No users found in DB')
    await mongoose.disconnect()
    return
  }

  console.log('Users in DB:')
  users.forEach((u) => console.log(`  ${u._id} — ${u.name} (${u.email})`))

  // Create a test notification for every user found
  for (const user of users) {
    await Notification.create({
      recipient: user._id,
      message: `זוהי התראת בדיקה — ${user.name} הצטרף להצעת הנסיעה שלך למשחק מכבי תל אביב נגד הפועל באר שבע`,
      read: false,
    })
    console.log(`Created notification for ${user.name}`)
  }

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
