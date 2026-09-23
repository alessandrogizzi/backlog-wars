/**
 * Selection engine ("Backlog Wars").
 * Pure, deterministic functions: randomness comes from an injected RNG,
 * so tests can verify the results.
 */
import { platformGroupOf, type GameStatus, type PlatformGroup } from '@shared/catalog'
import type { PickWeights } from '@shared/types'
import { clamp } from '@shared/format'
import type { Game } from '../db/types'
import { durationFit, referenceMinutes, remainingMinutes } from './duration'

export interface PickFilters {
  statuses: GameStatus[]
  /** 'all' or the name of a platform. */
  platform: string
  /** 'all' or the name of a genre. */
  genre: string
  /** Allowed platform groups (empty = all), e.g. retro, console, pc. */
  groups: PlatformGroup[]
  /** Energy I have right now (1-5): the draw rewards compatible games. */
  targetEffort: number
  /** Maximum tolerated effort: hard filter. */
  maxEffort: number
  /** Minimum pleasure (1-5), computed from the observed pleasure. */
  minPleasure: number
  /** Maximum duration (hours) of the main story: 0 = no limit. */
  maxHours: number
  /** Time you actually have right now (hours): 0 = not specified. */
  timeAvailableHours: number
  onlyNeverPlayed: boolean
  /** Excludes games played in the last N days. */
  avoidRecentDays: number
  onlyFavorites: boolean
}

export const DEFAULT_PICK_FILTERS: PickFilters = {
  statuses: ['backlog', 'playing'],
  platform: 'all',
  genre: 'all',
  groups: [],
  targetEffort: 2,
  maxEffort: 5,
  minPleasure: 1,
  maxHours: 0,
  timeAvailableHours: 0,
  onlyNeverPlayed: false,
  avoidRecentDays: 0,
  onlyFavorites: false
}

export interface ScoreBreakdown {
  effort: number
  pleasure: number
  priority: number
  novelty: number
  /** How well the game fits the time you have available. */
  duration: number
}

export interface ScoredGame {
  game: Game
  /** Score 0-100 (higher = a better fit right now). */
  score: number
  breakdown: ScoreBreakdown
}

const DAY_MS = 86_400_000
/** Small base bonus: no eligible game is left without a chance. */
const WEIGHT_FLOOR = 0.03

/** How compatible the game is with the available energy (0-1). */
export function effortFit(game: Game, targetEffort: number): number {
  const target = clamp(targetEffort, 1, 5)
  const diff = game.effortEstimate - target
  if (diff <= 0) {
    // Lighter than needed: fine, just a small discount.
    return clamp(1 - Math.abs(diff) * 0.04, 0.8, 1)
  }
  // Heavier than the energy I have: full penalty.
  return clamp(1 - diff / 4, 0, 1)
}

/** Pleasure 0-1: combines the declared rating with the real satisfaction from sessions. */
export function pleasureScore(game: Game): number {
  const declared = clamp(game.pleasure, 1, 5) / 5
  if (game.avgSatisfaction === null || game.avgSatisfaction === undefined || game.sessionCount === 0) {
    return declared
  }
  const observed = clamp(game.avgSatisfaction, 1, 5) / 5
  const trust = Math.min(1, game.sessionCount / 3)
  return declared * (1 - trust) + observed * trust
}

/** "Observed" pleasure: the real average satisfaction, when there is one. */
export function observedPleasure(game: Game): number {
  if (game.avgSatisfaction === null || game.avgSatisfaction === undefined || game.sessionCount === 0) {
    return game.pleasure
  }
  return game.avgSatisfaction
}

/** How much it "owes" a play (0-1): never played = maximum. */
export function noveltyScore(game: Game, now: number): number {
  if (!game.lastPlayedAt) return 1
  const days = (now - game.lastPlayedAt) / DAY_MS
  return clamp(days / 90, 0, 1)
}

export function priorityScore(game: Game): number {
  const base = clamp(game.priority, 1, 5) / 5
  return clamp(base + (game.favorite === 1 ? 0.15 : 0), 0, 1)
}

export function passesFilters(game: Game, filters: PickFilters, now: number): boolean {
  if (filters.statuses.length > 0 && !filters.statuses.includes(game.status)) return false
  if (filters.platform !== 'all' && game.platform !== filters.platform) return false
  if (filters.groups.length > 0 && !filters.groups.includes(platformGroupOf(game.platform))) return false
  if (filters.genre !== 'all' && !game.genres.includes(filters.genre)) return false
  if (game.effortEstimate > filters.maxEffort) return false
  if (pleasureScore(game) * 5 < filters.minPleasure - 0.001) return false
  if (filters.maxHours > 0) {
    const reference = referenceMinutes(game)
    // Games with no known duration stay in the running: the filter does not rule them out.
    if (reference !== undefined && reference > filters.maxHours * 60) return false
  }
  if (filters.onlyNeverPlayed && game.sessionCount > 0) return false
  if (filters.onlyFavorites && game.favorite !== 1) return false
  if (filters.avoidRecentDays > 0 && game.lastPlayedAt) {
    const days = (now - game.lastPlayedAt) / DAY_MS
    if (days < filters.avoidRecentDays) return false
  }
  return true
}

export function scoreGame(game: Game, filters: PickFilters, weights: PickWeights, now: number): ScoredGame {
  const breakdown: ScoreBreakdown = {
    effort: effortFit(game, filters.targetEffort),
    pleasure: pleasureScore(game),
    priority: priorityScore(game),
    novelty: noveltyScore(game, now),
    duration: durationFit(remainingMinutes(game), filters.timeAvailableHours)
  }
  const totalWeight =
    weights.effort + weights.pleasure + weights.priority + weights.novelty + weights.duration
  const score =
    totalWeight <= 0
      ? 0
      : (breakdown.effort * weights.effort +
          breakdown.pleasure * weights.pleasure +
          breakdown.priority * weights.priority +
          breakdown.novelty * weights.novelty +
          breakdown.duration * weights.duration) /
        totalWeight
  return { game, score: Math.round(score * 1000) / 10, breakdown }
}

export function buildPool(
  games: Game[],
  filters: PickFilters,
  weights: PickWeights,
  now: number = Date.now()
): ScoredGame[] {
  return games
    .filter((game) => passesFilters(game, filters, now))
    .map((game) => scoreGame(game, filters, weights, now))
    .sort((a, b) => b.score - a.score)
}

/** Weighted draw: higher scores come out more often, but chance still leads. */
export function weightedPick(pool: ScoredGame[], rng: () => number = Math.random): ScoredGame | null {
  if (pool.length === 0) return null
  const weights = pool.map((entry) => entry.score / 100 + WEIGHT_FLOOR)
  const total = weights.reduce((sum, value) => sum + value, 0)
  let ticket = rng() * total
  for (let index = 0; index < pool.length; index += 1) {
    ticket -= weights[index]
    if (ticket <= 0) return pool[index]
  }
  return pool[pool.length - 1]
}

/** Uniform draw: pure chance, like a roulette. */
export function uniformPick(pool: ScoredGame[], rng: () => number = Math.random): ScoredGame | null {
  if (pool.length === 0) return null
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  return pool[index]
}

/** Deterministic RNG (mulberry32) for reproducible tests and tournaments. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Sampling without replacement, with probability proportional to the score. */
export function weightedSample(pool: ScoredGame[], size: number, rng: () => number): ScoredGame[] {
  const remaining = [...pool]
  const picked: ScoredGame[] = []
  while (picked.length < size && remaining.length > 0) {
    const chosen = weightedPick(remaining, rng)
    if (!chosen) break
    picked.push(chosen)
    remaining.splice(remaining.indexOf(chosen), 1)
  }
  return picked
}

/* --------------------------- Tournament -------------------------------- */

export interface BracketMatch {
  id: string
  round: number
  slot: number
  a: Game | null
  b: Game | null
  winner: number | null
}

export interface Bracket {
  size: number
  rounds: BracketMatch[][]
  pool: Game[]
  championId: number | null
}

export function bracketSizes(): number[] {
  return [4, 8, 16]
}

/** Builds a single-elimination bracket with the games drawn from the pool. */
export function buildBracket(pool: ScoredGame[], size: number, rng: () => number): Bracket {
  const participants = shuffle(
    weightedSample(pool, Math.min(size, pool.length), rng).map((entry) => entry.game),
    rng
  )
  const roundCount = Math.max(1, Math.round(Math.log2(size)))
  const rounds: BracketMatch[][] = []
  for (let round = 0; round < roundCount; round += 1) {
    const matchCount = size / 2 ** (round + 1)
    const matches: BracketMatch[] = []
    for (let slot = 0; slot < matchCount; slot += 1) {
      matches.push({
        id: `r${round}m${slot}`,
        round,
        slot,
        a: round === 0 ? (participants[slot * 2] ?? null) : null,
        b: round === 0 ? (participants[slot * 2 + 1] ?? null) : null,
        winner: null
      })
    }
    rounds.push(matches)
  }
  return resolveByes({ size, rounds, pool: participants, championId: null })
}

/** Automatically advances games left alone in a match (a bye). */
export function resolveByes(bracket: Bracket): Bracket {
  let current = bracket
  for (let round = 0; round < current.rounds.length; round += 1) {
    for (const match of current.rounds[round]) {
      if (match.winner !== null) continue
      if (match.a && !match.b) current = pickWinner(current, match.id, match.a.id!)
      else if (match.b && !match.a) current = pickWinner(current, match.id, match.b.id!)
    }
  }
  return current
}

function findMatch(bracket: Bracket, matchId: string): BracketMatch | undefined {
  for (const round of bracket.rounds) {
    const found = round.find((match) => match.id === matchId)
    if (found) return found
  }
  return undefined
}

/** Records a match winner and advances them to the next round. */
export function pickWinner(bracket: Bracket, matchId: string, winnerId: number): Bracket {
  const next: Bracket = {
    ...bracket,
    rounds: bracket.rounds.map((round) => round.map((match) => ({ ...match }))),
    championId: bracket.championId
  }
  const match = findMatch(next, matchId)
  if (!match) return next
  const winner = match.a?.id === winnerId ? match.a : match.b?.id === winnerId ? match.b : null
  if (!winner) return next
  match.winner = winnerId

  const nextRound = next.rounds[match.round + 1]
  if (!nextRound) {
    next.championId = winnerId
    return next
  }
  const target = nextRound[Math.floor(match.slot / 2)]
  if (!target) return next
  if (match.slot % 2 === 0) target.a = winner
  else target.b = winner
  return next
}

export function championOf(bracket: Bracket): Game | null {
  if (bracket.championId === null) return null
  return bracket.pool.find((game) => game.id === bracket.championId) ?? null
}

/**
 * Filter summary in a neutral form (it ends up in the draw records):
 * short tokens independent of the interface language.
 */
export function describeFilters(filters: PickFilters): string {
  const parts: string[] = []
  parts.push(filters.statuses.length > 0 ? filters.statuses.join('/') : 'no-status')
  if (filters.platform !== 'all') parts.push(filters.platform)
  if (filters.groups.length > 0) parts.push(filters.groups.join('/'))
  if (filters.genre !== 'all') parts.push(filters.genre)
  parts.push(`effort<=${filters.maxEffort}`)
  parts.push(`energy=${filters.targetEffort}`)
  if (filters.minPleasure > 1) parts.push(`pleasure>=${filters.minPleasure}`)
  if (filters.maxHours > 0) parts.push(`max-hours=${filters.maxHours}`)
  if (filters.timeAvailableHours > 0) parts.push(`available=${filters.timeAvailableHours}h`)
  if (filters.onlyNeverPlayed) parts.push('never-played')
  if (filters.onlyFavorites) parts.push('favorites-only')
  if (filters.avoidRecentDays > 0) parts.push(`avoid-last=${filters.avoidRecentDays}d`)
  return parts.join(' · ')
}

