/**
 * Statistics and dashboard: pure functions over games + sessions.
 * Covered by the tests in tests/stats.test.ts.
 */
import type { GameStatus } from '@shared/catalog'
import { GAME_STATUSES } from '@shared/catalog'
import { clamp, todayIso } from '@shared/format'
import { platformGroupOf, type PlatformGroup } from '@shared/catalog'
import type { Game, PlaySession } from '../db/types'
import { manualMinutes, playedMinutes, referenceMinutes, remainingMinutes } from './duration'

const DAY_MS = 86_400_000

/** Sentinel used when a game has no genre: the view translates it. */
export const UNKNOWN_GENRE = 'unknown'

export interface Bucket {
  label: string
  minutes: number
  sessions: number
}

export interface GameTimeBucket {
  game: Game
  minutes: number
  sessions: number
  avgSatisfaction: number | null
  avgEffort: number | null
  /** Pleasure per unit of effort: how much the time spent "pays off". */
  efficiency: number | null
}

export interface EffortBucket {
  effort: number
  sessions: number
  minutes: number
  avgSatisfaction: number | null
}

/** Time aggregated by platform group (PC, console, retro…). */
export interface GroupBucket {
  group: PlatformGroup
  minutes: number
  games: number
}

export interface Dashboard {
  totalMinutes: number
  /** Share of `totalMinutes` declared by hand (hours already played outside the app). */
  manualMinutes: number
  /** Games marked as already started. */
  startedGames: number
  totalSessions: number
  totalGames: number
  gamesWithSessions: number
  byStatus: Record<GameStatus, number>
  avgSatisfaction: number | null
  avgEffort: number | null
  avgSessionMinutes: number | null
  minutesLast30: number
  sessionsLast30: number
  activeDaysLast30: number
  streakDays: number
  weeks: Array<{ weekStart: string; label: string; minutes: number; sessions: number }>
  /** Estimated hours to finish what is in the backlog (main story). */
  estimatedBacklogMinutes: number
  /** Estimated hours to 100% the backlog. */
  completionistBacklogMinutes: number
  /** How much is left to finish the games in progress. */
  remainingMinutes: number
  /** Games with a known duration. */
  gamesWithDuration: number
  /** Average Metascore of the games that have a score. */
  averageMetacritic: number | null
  /** How many games have a Metascore. */
  gamesWithMetacritic: number
  /** Time actually played on retrogaming platforms. */
  retroMinutes: number
  retroGames: number
  groupSpread: GroupBucket[]
  effortBuckets: EffortBucket[]
  topByTime: GameTimeBucket[]
  bestValue: GameTimeBucket[]
  platformSpread: Bucket[]
  genreSpread: Bucket[]
  recentSessions: PlaySession[]
}

/** Monday of the week containing the given ISO date. */
export function isoWeekStart(iso: string): string {
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  const day = (date.getDay() + 6) % 7 // 0 = Monday
  date.setDate(date.getDate() - day)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

/** Consecutive days with at least one session, starting from today (or yesterday). */
export function computeStreak(days: Set<string>, today: string): number {
  let streak = 0
  const cursor = new Date(`${today}T12:00:00`)
  if (!days.has(today)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  for (let guard = 0; guard < 3650; guard += 1) {
    const offset = cursor.getTimezoneOffset() * 60_000
    const iso = new Date(cursor.getTime() - offset).toISOString().slice(0, 10)
    if (!days.has(iso)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function gameBucket(game: Game, sessions: PlaySession[]): GameTimeBucket {
  // The time includes logged sessions and hours declared by hand.
  const minutes = playedMinutes({ totalMinutes: sessions.reduce((sum, session) => sum + session.minutes, 0), playedBeforeMinutes: game.playedBeforeMinutes })
  const avgSatisfaction = average(sessions.map((session) => session.satisfaction))
  const avgEffort = average(sessions.map((session) => session.effort))
  const efficiency =
    avgSatisfaction !== null && avgEffort !== null && avgEffort > 0 ? round(avgSatisfaction / avgEffort) : null
  return { game, minutes, sessions: sessions.length, avgSatisfaction, avgEffort, efficiency }
}

export function computeDashboard(
  games: Game[],
  sessions: PlaySession[],
  options: { now?: number; weeks?: number } = {}
): Dashboard {
  const now = options.now ?? Date.now()
  const weekCount = options.weeks ?? 8
  const today = todayIso(now)

  const byStatus = GAME_STATUSES.reduce<Record<GameStatus, number>>(
    (acc, status) => ({ ...acc, [status.id]: 0 }),
    {} as Record<GameStatus, number>
  )
  for (const game of games) byStatus[game.status] += 1

  const sessionsByGame = new Map<number, PlaySession[]>()
  for (const session of sessions) {
    const list = sessionsByGame.get(session.gameId)
    if (list) list.push(session)
    else sessionsByGame.set(session.gameId, [session])
  }

  const trackedMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0)
  const manualTotal = games.reduce((sum, game) => sum + manualMinutes(game), 0)
  const totalMinutes = trackedMinutes + manualTotal
  const cutoff30 = now - 30 * DAY_MS
  const last30 = sessions.filter((session) => session.startedAt >= cutoff30)
  const activeDays = new Set(sessions.map((session) => session.date))

  const weeks: Dashboard['weeks'] = []
  for (let index = weekCount - 1; index >= 0; index -= 1) {
    const reference = todayIso(now - index * 7 * DAY_MS)
    const weekStart = isoWeekStart(reference)
    const weekEnd = todayIso(new Date(`${weekStart}T12:00:00`).getTime() + 7 * DAY_MS)
    const inWeek = sessions.filter((session) => session.date >= weekStart && session.date < weekEnd)
    weeks.push({
      weekStart,
      label: `${weekStart.slice(8, 10)}/${weekStart.slice(5, 7)}`,
      minutes: inWeek.reduce((sum, session) => sum + session.minutes, 0),
      sessions: inWeek.length
    })
  }

  const effortBuckets: EffortBucket[] = [1, 2, 3, 4, 5].map((effort) => {
    const inBucket = sessions.filter((session) => session.effort === effort)
    return {
      effort,
      sessions: inBucket.length,
      minutes: inBucket.reduce((sum, session) => sum + session.minutes, 0),
      avgSatisfaction: average(inBucket.map((session) => session.satisfaction))
    }
  })

  // Games with only hours declared by hand also count (no logged sessions).
  const perGame: GameTimeBucket[] = games
    .map((game) => gameBucket(game, sessionsByGame.get(game.id!) ?? []))
    .filter((bucket) => bucket.sessions > 0 || bucket.minutes > 0)

  const platformMap = new Map<string, Bucket>()
  const genreMap = new Map<string, Bucket>()
  const groupMap = new Map<PlatformGroup, GroupBucket>()
  for (const game of games) {
    const group = platformGroupOf(game.platform)
    const entry = groupMap.get(group) ?? { group, minutes: 0, games: 0 }
    entry.games += 1
    groupMap.set(group, entry)
  }
  for (const bucket of perGame) {
    const group = platformGroupOf(bucket.game.platform)
    const entry = groupMap.get(group)
    if (entry) entry.minutes += bucket.minutes
  }
  for (const bucket of perGame) {
    const { game } = bucket
    const platform = platformMap.get(game.platform) ?? { label: game.platform, minutes: 0, sessions: 0 }
    platform.minutes += bucket.minutes
    platform.sessions += bucket.sessions
    platformMap.set(game.platform, platform)

    const genres = game.genres.length > 0 ? game.genres : [UNKNOWN_GENRE]
    for (const genre of genres) {
      const entry = genreMap.get(genre) ?? { label: genre, minutes: 0, sessions: 0 }
      entry.minutes += bucket.minutes
      entry.sessions += bucket.sessions
      genreMap.set(genre, entry)
    }
  }

  const backlogGames = games.filter((game) => game.status === 'backlog' || game.status === 'wishlist')
  const inProgressGames = games.filter((game) => game.status === 'playing')
  const estimatedBacklogMinutes = backlogGames.reduce((sum, game) => sum + (referenceMinutes(game) ?? 0), 0)
  const completionistBacklogMinutes = backlogGames.reduce(
    (sum, game) => sum + (game.durationCompletionist ?? referenceMinutes(game) ?? 0),
    0
  )
  const remainingTotal = inProgressGames.reduce((sum, game) => sum + (remainingMinutes(game) ?? 0), 0)
  const retroBuckets = perGame.filter((bucket) => platformGroupOf(bucket.game.platform) === 'retro')

  return {
    totalMinutes,
    manualMinutes: manualTotal,
    startedGames: games.filter((game) => game.startedAt !== undefined || manualMinutes(game) > 0).length,
    totalSessions: sessions.length,
    totalGames: games.length,
    gamesWithSessions: perGame.length,
    byStatus,
    avgSatisfaction: average(sessions.map((session) => session.satisfaction)),
    avgEffort: average(sessions.map((session) => session.effort)),
    avgSessionMinutes: sessions.length ? Math.round(totalMinutes / sessions.length) : null,
    minutesLast30: last30.reduce((sum, session) => sum + session.minutes, 0),
    sessionsLast30: last30.length,
    activeDaysLast30: new Set(last30.map((session) => session.date)).size,
    streakDays: computeStreak(activeDays, today),
    estimatedBacklogMinutes,
    completionistBacklogMinutes,
    remainingMinutes: remainingTotal,
    gamesWithDuration: games.filter((game) => referenceMinutes(game) !== undefined).length,
    averageMetacritic: average(
      games.map((game) => game.metacritic ?? 0).filter((score) => score > 0)
    ),
    gamesWithMetacritic: games.filter((game) => (game.metacritic ?? 0) > 0).length,
    retroMinutes: retroBuckets.reduce((sum, bucket) => sum + bucket.minutes, 0),
    retroGames: retroBuckets.length,
    groupSpread: [...groupMap.values()].sort((a, b) => b.minutes - a.minutes || b.games - a.games),
    weeks,
    effortBuckets,
    topByTime: [...perGame].sort((a, b) => b.minutes - a.minutes).slice(0, 5),
    bestValue: perGame
      .filter((bucket) => bucket.efficiency !== null && bucket.minutes >= 30)
      .sort((a, b) => (b.efficiency ?? 0) - (a.efficiency ?? 0))
      .slice(0, 5),
    platformSpread: [...platformMap.values()].sort((a, b) => b.minutes - a.minutes),
    genreSpread: [...genreMap.values()].sort((a, b) => b.minutes - a.minutes).slice(0, 8),
    recentSessions: [...sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, 6)
  }
}

/** Simple moving average, used for the bar charts. */
export function normalize(values: number[]): number[] {
  const max = Math.max(1, ...values)
  return values.map((value) => clamp(value / max, 0, 1))
}
