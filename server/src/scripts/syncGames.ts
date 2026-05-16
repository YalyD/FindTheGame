import 'dotenv/config'
import mongoose from 'mongoose'
import { Game } from '../models/Game.js'

const KEY = process.env.RAPIDAPI_KEY!
const HOST = 'sportapi7.p.rapidapi.com'

// Home team → { stadium, city }
const STADIUM_MAP: Record<string, { stadium: string; city: string }> = {
  'Maccabi Tel Aviv':              { stadium: 'אצטדיון בלומפילד', city: 'תל אביב' },
  'Hapoel Tel Aviv':               { stadium: 'אצטדיון בלומפילד', city: 'תל אביב' },
  'Beitar Jerusalem':              { stadium: 'אצטדיון טדי', city: 'ירושלים' },
  'Hapoel Jerusalem':              { stadium: 'אצטדיון טדי', city: 'ירושלים' },
  'Maccabi Haifa':                 { stadium: 'אצטדיון סמי עופר', city: 'חיפה' },
  'Hapoel Haifa':                  { stadium: 'אצטדיון סמי עופר', city: 'חיפה' },
  'Hapoel Be\'er Sheva':           { stadium: 'אצטדיון טרנר', city: 'באר שבע' },
  'Hapoel Petach Tikva':           { stadium: 'אצטדיון המושבה', city: 'פתח תקווה' },
  'Bnei Sakhnin':                  { stadium: 'אצטדיון דוחא', city: 'סח\'נין' },
  'Hapoel Ironi Kiryat Shmona':    { stadium: 'אצטדיון קריית שמונה', city: 'קריית שמונה' },
  'Ashdod SC':                     { stadium: 'אצטדיון יוד אלף', city: 'אשדוד' },
  'Maccabi Bney Reine':            { stadium: 'מגרש בני ריינה', city: 'בני ריינה' },
  'Maccabi Netanya':               { stadium: 'אצטדיון נתניה', city: 'נתניה' },
  'Ironi Dorot Tiberias':          { stadium: 'אצטדיון דורות', city: 'טבריה' },
  'Maccabi Bnei Reineh':           { stadium: 'מגרש בני ריינה', city: 'בני ריינה' },
}

function getVenue(homeTeam: string) {
  return STADIUM_MAP[homeTeam] ?? { stadium: 'אצטדיון לאומי', city: 'ישראל' }
}

function addDays(base: Date, n: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

async function fetchIsraeliGames(daysAhead = 30) {
  const base = new Date()
  const games: {
    homeTeam: string
    awayTeam: string
    date: Date
    stadium: string
    city: string
    competition: string
  }[] = []

  for (let i = 0; i <= daysAhead; i++) {
    const date = addDays(base, i)
    const url = `https://${HOST}/api/v1/sport/football/scheduled-events/${date}`
    const res = await fetch(url, {
      headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': HOST },
    })
    if (!res.ok) continue
    const text = await res.text()
    if (!text) continue
    const data = JSON.parse(text)

    const israeli = (data.events ?? []).filter(
      (e: { tournament: { category: { name: string } } }) =>
        e.tournament?.category?.name === 'Israel',
    )

    for (const e of israeli) {
      const venue = getVenue(e.homeTeam.name)
      games.push({
        homeTeam: e.homeTeam.name,
        awayTeam: e.awayTeam.name,
        date: new Date(e.startTimestamp * 1000),
        stadium: venue.stadium,
        city: venue.city,
        competition: e.tournament.name,
      })
    }
  }

  return games
}

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(uri)

  console.log('Fetching Israeli games from SportAPI...')
  const games = await fetchIsraeliGames(30)
  console.log(`Found ${games.length} games`)

  // Remove old games and re-seed with fresh data
  await Game.deleteMany({})
  if (games.length > 0) {
    await Game.insertMany(games)
  }
  console.log(`Seeded ${games.length} games into MongoDB`)

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
