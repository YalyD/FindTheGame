import 'dotenv/config'
import axios from 'axios'
import mongoose from 'mongoose'
import { GameData } from '../repositories/gameRepository.js'
import { applySyncedGames } from '../services/gameSyncService.js'

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
const DAYS_AHEAD = 30

type SportEvent = {
  id: number
  homeTeam: { name: string }
  awayTeam: { name: string }
  startTimestamp: number
  tournament: { name: string }
}

async function api<T>(path: string): Promise<T> {
  try {
    const res = await axios.get<T>(`https://${HOST}${path}`, {
      headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': HOST },
    })
    return res.data
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw new Error(
        `SportAPI ${err.response.status} on ${path}: ${JSON.stringify(err.response.data)}`,
      )
    }
    throw err
  }
}

// Uses the league's fixture list rather than one request per day: the free plan
// only allows 50 requests, and the old per-date endpoint was removed.
async function fetchIsraeliGames(cutoff: number): Promise<GameData[]> {
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
        externalId: e.id,
        homeTeam,
        awayTeam,
        date: new Date(e.startTimestamp * 1000),
        stadium: venue.stadium,
        city: venue.city,
        competition: translate(e.tournament.name, COMPETITION_MAP),
      }
    })

  const seen = new Set<number>()
  return games.filter((g) => {
    if (seen.has(g.externalId)) return false
    seen.add(g.externalId)
    return true
  })
}

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  await mongoose.connect(uri)

  const from = new Date()
  const to = new Date(from.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000)

  console.log('Fetching Israeli games from SportAPI...')
  const games = await fetchIsraeliGames(to.getTime())
  console.log(`Found ${games.length} games (after dedupe)`)

  if (games.length === 0) {
    throw new Error('No games returned from SportAPI — leaving existing games untouched')
  }

  const result = await applySyncedGames(games, { from, to })
  console.log(
    `Created ${result.created}, updated ${result.updated}, removed ${result.removed} stale games`,
  )
  if (result.keptWithRides.length > 0) {
    console.warn(
      `Kept ${result.keptWithRides.length} games no longer listed by SportAPI because they have rides: ` +
        result.keptWithRides.join(', '),
    )
  }

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
