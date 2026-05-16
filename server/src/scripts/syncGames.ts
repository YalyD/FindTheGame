import 'dotenv/config'
import mongoose from 'mongoose'
import { Game } from '../models/Game.js'
import { RideRequest } from '../models/RideRequest.js'
import { RideOffer } from '../models/RideOffer.js'

const KEY = process.env.RAPIDAPI_KEY!
const HOST = 'sportapi7.p.rapidapi.com'

// English (SportAPI) → Hebrew
const TEAM_MAP: Record<string, string> = {
  'Maccabi Tel Aviv':            'מכבי תל אביב',
  'Hapoel Tel Aviv':             'הפועל תל אביב',
  'Beitar Jerusalem':            'בית"ר ירושלים',
  'Hapoel Jerusalem':            'הפועל ירושלים',
  'Maccabi Haifa':               'מכבי חיפה',
  'Hapoel Haifa':                'הפועל חיפה',
  "Hapoel Be'er Sheva":          'הפועל באר שבע',
  'Hapoel Petach Tikva':         'הפועל פתח תקווה',
  'Bnei Sakhnin':                'בני סכנין',
  'Hapoel Ironi Kiryat Shmona':  'עירוני קריית שמונה',
  'Ashdod SC':                   'מ.ס. אשדוד',
  'Maccabi Bney Reine':          'מכבי בני ריינה',
  'Maccabi Bnei Reineh':         'מכבי בני ריינה',
  'Maccabi Netanya':             'מכבי נתניה',
  'Ironi Dorot Tiberias':        'עירוני טבריה',
}

const COMPETITION_MAP: Record<string, string> = {
  'Premier League, Championship Round': 'ליגת העל - בית עליון',
  'Premier League, Relegation Round':   'ליגת העל - בית תחתון',
  'Premier League':                     'ליגת העל',
  'State Cup':                          'גביע המדינה',
}

// Hebrew home team → { stadium, city }
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

function translate(name: string, map: Record<string, string>) {
  return map[name] ?? name
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
      const homeTeam = translate(e.homeTeam.name, TEAM_MAP)
      const awayTeam = translate(e.awayTeam.name, TEAM_MAP)
      const venue = getVenue(homeTeam)
      games.push({
        homeTeam,
        awayTeam,
        date: new Date(e.startTimestamp * 1000),
        stadium: venue.stadium,
        city: venue.city,
        competition: translate(e.tournament.name, COMPETITION_MAP),
      })
    }
  }

  // Dedupe: same teams + same date
  const seen = new Set<string>()
  return games.filter((g) => {
    const k = `${g.homeTeam}|${g.awayTeam}|${g.date.toISOString()}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(uri)

  console.log('Fetching Israeli games from SportAPI...')
  const games = await fetchIsraeliGames(30)
  console.log(`Found ${games.length} games (after dedupe)`)

  await Game.deleteMany({})
  if (games.length > 0) {
    await Game.insertMany(games)
  }
  console.log(`Seeded ${games.length} games into MongoDB`)

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
