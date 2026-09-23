/**
 * Play duration logic (HowLongToBeat): how much is left, how long it is,
 * and how well it fits the time you have available. Pure, testable functions.
 */
import type { GameStatus } from '@shared/catalog'
import { clamp, formatMinutes } from '@shared/format'
import type { Game } from '../db/types'

/** Under 4 hours it is an evening, over 50 it is a months-long project. */
export const EFFORT_BY_DURATION: Array<{ maxMinutes: number; effort: number }> = [
  { maxMinutes: 4 * 60, effort: 1 },
  { maxMinutes: 10 * 60, effort: 2 },
  { maxMinutes: 25 * 60, effort: 3 },
  { maxMinutes: 50 * 60, effort: 4 },
  { maxMinutes: Number.POSITIVE_INFINITY, effort: 5 }
]

export type DurationFields = Pick<
  Game,
  | 'durationMain'
  | 'durationMainExtra'
  | 'durationCompletionist'
  | 'durationAllStyles'
  | 'totalMinutes'
  | 'playedBeforeMinutes'
>

export type PlaytimeFields = Pick<Game, 'totalMinutes' | 'playedBeforeMinutes' | 'startedAt' | 'status' | 'sessionCount'>

/** Hours declared by hand, outside the tracked sessions. */
export function manualMinutes(game: Partial<Pick<Game, 'playedBeforeMinutes'>>): number {
  const value = game.playedBeforeMinutes
  return typeof value === 'number' && value > 0 ? Math.round(value) : 0
}

/**
 * Total time played: logged sessions + hours declared by hand.
 * This is the value to use for "how much is left" and for time statistics.
 */
export function playedMinutes(game: Partial<Pick<Game, 'totalMinutes' | 'playedBeforeMinutes'>>): number {
  return Math.max(0, Math.round(game.totalMinutes ?? 0)) + manualMinutes(game)
}

/**
 * A game counts as already started if I logged a start date, declared some
 * hours, already have sessions, or its status is "playing".
 */
export function hasStarted(game: Partial<PlaytimeFields>): boolean {
  if ((game.startedAt ?? 0) > 0) return true
  if (manualMinutes(game) > 0) return true
  if ((game.sessionCount ?? 0) > 0) return true
  return game.status === ('playing' as GameStatus)
}

/** Reference duration: main story, otherwise the average across all styles. */
export function referenceMinutes(game: Partial<DurationFields>): number | undefined {
  const main = game.durationMain
  if (typeof main === 'number' && main > 0) return main
  const all = game.durationAllStyles
  if (typeof all === 'number' && all > 0) return all
  return undefined
}

/** How much is left to finish, in minutes (never negative). Accounts for declared hours. */
export function remainingMinutes(game: Partial<DurationFields>): number | undefined {
  const reference = referenceMinutes(game)
  if (reference === undefined) return undefined
  return Math.max(0, reference - playedMinutes(game))
}

/** How complete it is, 0-1 (useful for the progress bar). */
export function completionRatio(game: Partial<DurationFields>): number | undefined {
  const reference = referenceMinutes(game)
  if (!reference) return undefined
  return clamp(playedMinutes(game) / reference, 0, 1)
}

/** Effort suggested from the duration: helps fill in the form without thinking. */
export function suggestEffortFromMinutes(minutes?: number | null): number | undefined {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return undefined
  return EFFORT_BY_DURATION.find((bucket) => minutes <= bucket.maxMinutes)?.effort
}

/**
 * How well a game "fits" the available time (0-1).
 * Without duration data or declared time it returns a neutral value,
 * so the factor penalises no one.
 */
export function durationFit(remaining: number | undefined, availableHours: number): number {
  if (remaining === undefined || availableHours <= 0) return 0.5
  const available = availableHours * 60
  if (remaining <= available) return 1
  return clamp(available / remaining, 0.05, 1)
}

/** Compact label for cards and badges: "8h 30m" / "≈40h". */
export function formatDuration(minutes?: number | null): string {
  if (typeof minutes !== 'number' || minutes <= 0) return '—'
  if (minutes >= 600) return `≈${Math.round(minutes / 60)}h`
  return formatMinutes(minutes)
}

