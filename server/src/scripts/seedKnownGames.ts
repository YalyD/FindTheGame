import 'dotenv/config'
import mongoose from 'mongoose'
import { Game } from '../models/Game.js'
import { RideRequest } from '../models/RideRequest.js'
import { RideOffer } from '../models/RideOffer.js'

// Fixtures captured from SportAPI on 2026-05-16 (used when API quota is exhausted)
const FIXTURES: { home: string; away: string; date: string; comp: string }[] = [
  // 2026-05-16 Championship Round
  { home: 'הפועל תל אביב',       away: 'הפועל באר שבע',       date: '2026-05-16T18:00:00+03:00', comp: 'ליגת העל - בית עליון' },
  { home: 'מכבי חיפה',           away: 'הפועל פתח תקווה',     date: '2026-05-16T18:00:00+03:00', comp: 'ליגת העל - בית עליון' },
  { home: 'מכבי תל אביב',        away: 'בית"ר ירושלים',       date: '2026-05-16T20:30:00+03:00', comp: 'ליגת העל - בית עליון' },
  // 2026-05-18 Relegation Round
  { home: 'הפועל חיפה',          away: 'בני סכנין',           date: '2026-05-18T20:00:00+03:00', comp: 'ליגת העל - בית תחתון' },
  { home: 'עירוני קריית שמונה',  away: 'מ.ס. אשדוד',          date: '2026-05-18T20:00:00+03:00', comp: 'ליגת העל - בית תחתון' },
  { home: 'הפועל ירושלים',       away: 'עירוני טבריה',        date: '2026-05-18T20:00:00+03:00', comp: 'ליגת העל - בית תחתון' },
  { home: 'מכבי בני ריינה',      away: 'מכבי נתניה',          date: '2026-05-18T20:00:00+03:00', comp: 'ליגת העל - בית תחתון' },
  // 2026-05-19 Championship Round
  { home: 'הפועל באר שבע',       away: 'מכבי תל אביב',        date: '2026-05-19T20:00:00+03:00', comp: 'ליגת העל - בית עליון' },
  { home: 'הפועל פתח תקווה',     away: 'בית"ר ירושלים',       date: '2026-05-19T20:00:00+03:00', comp: 'ליגת העל - בית עליון' },
  { home: 'מכבי חיפה',           away: 'הפועל תל אביב',       date: '2026-05-19T20:30:00+03:00', comp: 'ליגת העל - בית עליון' },
  // 2026-05-23 Championship Round
  { home: 'בית"ר ירושלים',       away: 'הפועל תל אביב',       date: '2026-05-23T20:00:00+03:00', comp: 'ליגת העל - בית עליון' },
  { home: 'הפועל באר שבע',       away: 'מכבי חיפה',           date: '2026-05-23T20:00:00+03:00', comp: 'ליגת העל - בית עליון' },
  { home: 'הפועל פתח תקווה',     away: 'מכבי תל אביב',        date: '2026-05-23T20:30:00+03:00', comp: 'ליגת העל - בית עליון' },
]

const STADIUM_MAP: Record<string, { stadium: string; city: string }> = {
  'מכבי תל אביב':         { stadium: 'אצטדיון בלומפילד', city: 'תל אביב' },
  'הפועל תל אביב':        { stadium: 'אצטדיון בלומפילד', city: 'תל אביב' },
  'בית"ר ירושלים':        { stadium: 'אצטדיון טדי', city: 'ירושלים' },
  'הפועל ירושלים':        { stadium: 'אצטדיון טדי', city: 'ירושלים' },
  'מכבי חיפה':            { stadium: 'אצטדיון סמי עופר', city: 'חיפה' },
  'הפועל חיפה':           { stadium: 'אצטדיון סמי עופר', city: 'חיפה' },
  'הפועל באר שבע':        { stadium: 'אצטדיון טרנר', city: 'באר שבע' },
  'הפועל פתח תקווה':      { stadium: 'אצטדיון המושבה', city: 'פתח תקווה' },
  'בני סכנין':            { stadium: 'אצטדיון דוחא', city: 'סח\'נין' },
  'עירוני קריית שמונה':   { stadium: 'אצטדיון קריית שמונה', city: 'קריית שמונה' },
  'מ.ס. אשדוד':           { stadium: 'אצטדיון יוד אלף', city: 'אשדוד' },
  'מכבי בני ריינה':       { stadium: 'מגרש בני ריינה', city: 'בני ריינה' },
  'מכבי נתניה':           { stadium: 'אצטדיון נתניה', city: 'נתניה' },
  'עירוני טבריה':         { stadium: 'אצטדיון דורות', city: 'טבריה' },
}

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(uri)

  const docs = FIXTURES.map((f) => {
    const v = STADIUM_MAP[f.home] ?? { stadium: 'אצטדיון לאומי', city: 'ישראל' }
    return {
      homeTeam: f.home,
      awayTeam: f.away,
      date: new Date(f.date),
      stadium: v.stadium,
      city: v.city,
      competition: f.comp,
    }
  })

  await Game.deleteMany({})
  await Game.insertMany(docs)
  console.log(`Seeded ${docs.length} games`)

  const validIds = (await Game.find({}, '_id').lean()).map((g) => g._id)
  const r = await RideRequest.deleteMany({ game: { $nin: validIds } })
  const o = await RideOffer.deleteMany({ game: { $nin: validIds } })
  console.log(`Cleaned ${r.deletedCount} orphan requests, ${o.deletedCount} orphan offers`)

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
