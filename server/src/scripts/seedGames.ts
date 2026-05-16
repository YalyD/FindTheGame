import 'dotenv/config'
import mongoose from 'mongoose'
import { Game } from '../models/Game.js'

const games = [
  {
    homeTeam: 'מכבי תל אביב',
    awayTeam: 'הפועל באר שבע',
    date: new Date('2026-05-20T19:00:00'),
    stadium: 'בלומפילד',
    city: 'תל אביב',
    competition: 'ליגת העל',
  },
  {
    homeTeam: 'בית"ר ירושלים',
    awayTeam: 'מכבי חיפה',
    date: new Date('2026-05-21T20:00:00'),
    stadium: 'טדי',
    city: 'ירושלים',
    competition: 'ליגת העל',
  },
  {
    homeTeam: 'הפועל תל אביב',
    awayTeam: 'מכבי נתניה',
    date: new Date('2026-05-22T19:30:00'),
    stadium: 'בלומפילד',
    city: 'תל אביב',
    competition: 'ליגת העל',
  },
  {
    homeTeam: 'מכבי חיפה',
    awayTeam: 'מכבי תל אביב',
    date: new Date('2026-05-27T20:00:00'),
    stadium: 'סמי עופר',
    city: 'חיפה',
    competition: 'ליגת העל',
  },
  {
    homeTeam: 'הפועל באר שבע',
    awayTeam: 'בית"ר ירושלים',
    date: new Date('2026-05-28T19:00:00'),
    stadium: 'טרנר',
    city: 'באר שבע',
    competition: 'ליגת העל',
  },
  {
    homeTeam: 'אירוני קרית שמונה',
    awayTeam: 'הפועל חיפה',
    date: new Date('2026-06-01T19:00:00'),
    stadium: 'מגנום',
    city: 'קרית שמונה',
    competition: 'ליגת העל',
  },
  {
    homeTeam: 'מכבי תל אביב',
    awayTeam: 'בית"ר ירושלים',
    date: new Date('2026-06-05T20:00:00'),
    stadium: 'בלומפילד',
    city: 'תל אביב',
    competition: 'גביע המדינה',
  },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(uri)
  await Game.deleteMany({})
  await Game.insertMany(games)
  console.log(`Seeded ${games.length} games`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
