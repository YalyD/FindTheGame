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
  'Maccabi Petach Tikva':        'מכבי פתח תקווה',
  'Hapoel Ramat Gan Givataim':   'הפועל רמת גן גבעתיים',
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
  'עירוני קריית שמונה':   { stadium: 'אצטדיון נתניה', city: 'נתניה' },
  'מ.ס. אשדוד':           { stadium: 'אצטדיון יוד אלף', city: 'אשדוד' },
  'מכבי בני ריינה':       { stadium: 'מגרש בני ריינה', city: 'בני ריינה' },
  'מכבי נתניה':           { stadium: 'אצטדיון נתניה', city: 'נתניה' },
  'עירוני טבריה':         { stadium: 'אצטדיון דורות', city: 'טבריה' },
  'מכבי פתח תקווה':       { stadium: 'אצטדיון המושבה', city: 'פתח תקווה' },
  'הפועל רמת גן גבעתיים': { stadium: 'אצטדיון רחובות', city: 'רחובות' },
}

function translate(name: string, map: Record<string, string>) {
  return map[name] ?? name
}

function getVenue(homeTeam: string) {
  return STADIUM_MAP[homeTeam] ?? { stadium: 'אצטדיון לאומי', city: 'ישראל' }
}

// SportAPI's unique-tournament id for the Israeli Premier League
const LEAGUE_ID = 266

type SportEvent = {
  homeTeam: { name: string }
  awayTeam: { name: string }
  startTimestamp: number
  tournament: { name: string }
}

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`https://${HOST}${path}`, {
    headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': HOST },
  })
  if (!res.ok) throw new Error(`SportAPI ${res.status} on ${path}: ${await res.text()}`)
  return res.json() as Promise<T>
}

// Uses the league's fixture list rather than one request per day: the free plan
// only allows 50 requests, and the old per-date endpoint was removed.
async function fetchIsraeliGames(daysAhead = 30) {
  const cutoff = Date.now() + daysAhead * 24 * 60 * 60 * 1000

  const { seasons } = await api<{ seasons: { id: number }[] }>(
    `/api/v1/unique-tournament/${LEAGUE_ID}/seasons`,
  )
  const seasonId = seasons[0].id

  const events: SportEvent[] = []
  for (let page = 0; ; page++) {
    const data = await api<{ events: SportEvent[]; hasNextPage: boolean }>(
      `/api/v1/unique-tournament/${LEAGUE_ID}/season/${seasonId}/events/next/${page}`,
    )
    events.push(...data.events)
    const last = data.events[data.events.length - 1]
    if (!data.hasNextPage || !last || last.startTimestamp * 1000 > cutoff) break
  }

  const games = events
    .filter((e) => e.startTimestamp * 1000 <= cutoff)
    .map((e) => {
      const homeTeam = translate(e.homeTeam.name, TEAM_MAP)
      const awayTeam = translate(e.awayTeam.name, TEAM_MAP)
      const venue = getVenue(homeTeam)
      return {
        homeTeam,
        awayTeam,
        date: new Date(e.startTimestamp * 1000),
        stadium: venue.stadium,
        city: venue.city,
        competition: translate(e.tournament.name, COMPETITION_MAP),
      }
    })

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

  // Replacing with nothing would wipe every game and cascade-delete all rides
  if (games.length === 0) {
    throw new Error('No games returned from SportAPI — leaving existing games untouched')
  }

  await Game.deleteMany({})
  await Game.insertMany(games)
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
