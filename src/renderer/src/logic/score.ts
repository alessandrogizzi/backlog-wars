/**
 * Personal score of a game: my own verdict, independent of Metacritic.
 * Pure and testable, like the rest of `logic/`.
 */
import type { Game } from '../db/types'

/** Highest value the personal score slider offers. */
export const MAX_PERSONAL_SCORE = 10

/**
 * The personal score, 0 when the game has not been rated (or was saved before
 * the field existed). Always an integer inside 0-MAX_PERSONAL_SCORE.
 */
export function personalScore(game: Partial<Pick<Game, 'personalScore'>>): number {
  const value = game.personalScore
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(MAX_PERSONAL_SCORE, Math.max(0, Math.round(value)))
}
