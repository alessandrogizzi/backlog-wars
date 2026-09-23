/**
 * Library filters and sorting, as pure, testable functions.
 * The `LibraryView` merely passes the state of the controls.
 */
import type { GameStatus, PlatformGroup } from '@shared/catalog'
import { platformGroupOf } from '@shared/catalog'
import type { Game } from '../db/types'
import { observedPleasure } from './picker'
import { playedMinutes, referenceMinutes, remainingMinutes } from './duration'

export type LibrarySortKey =
  | 'updated'
  | 'title'
  | 'effort'
  | 'pleasure'
  | 'priority'
  | 'time'
  | 'lastPlayed'
  | 'duration'
  | 'remaining'
  | 'metacritic'

export const LIBRARY_SORT_OPTIONS: Array<{ value: LibrarySortKey; labelKey: string }> = [
  { value: 'updated', labelKey: 'library.sort.updated' },
  { value: 'title', labelKey: 'library.sort.title' },
  { value: 'metacritic', labelKey: 'library.sort.metacritic' },
  { value: 'effort', labelKey: 'library.sort.effort' },
  { value: 'pleasure', labelKey: 'library.sort.pleasure' },
  { value: 'priority', labelKey: 'library.sort.priority' },
  { value: 'time', labelKey: 'library.sort.time' },
  { value: 'duration', labelKey: 'library.sort.duration' },
  { value: 'remaining', labelKey: 'library.sort.remaining' },
  { value: 'lastPlayed', labelKey: 'library.sort.lastPlayed' }
]

/** Quick Metascore filter: all, only well reviewed, only unrated. */
export type MetacriticFilter = 'all' | 'good' | 'missing'

export interface LibraryFilters {
  search: string
  statuses: GameStatus[]
  platform: string
  genre: string
  groups: PlatformGroup[]
  onlyFavorites: boolean
  metacritic: MetacriticFilter
  sort: LibrarySortKey
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  search: '',
  statuses: [],
  platform: 'all',
  genre: 'all',
  groups: [],
  onlyFavorites: false,
  metacritic: 'all',
  sort: 'updated'
}

/** Metacritic "green" threshold: 75 and up. */
export const GOOD_METASCORE = 75

function sorters(): Record<LibrarySortKey, (a: Game, b: Game) => number> {
  return {
    updated: (a, b) => b.updatedAt - a.updatedAt,
    title: (a, b) => a.title.localeCompare(b.title, 'it'),
    // Games without a Metascore end up at the bottom, not at zero.
    metacritic: (a, b) => (b.metacritic ?? -1) - (a.metacritic ?? -1) || a.title.localeCompare(b.title, 'it'),
    effort: (a, b) => b.effortEstimate - a.effortEstimate,
    pleasure: (a, b) => observedPleasure(b) - observedPleasure(a),
    priority: (a, b) => b.priority - a.priority,
    time: (a, b) => playedMinutes(b) - playedMinutes(a),
    duration: (a, b) => (referenceMinutes(b) ?? 0) - (referenceMinutes(a) ?? 0),
    remaining: (a, b) => (remainingMinutes(b) ?? 0) - (remainingMinutes(a) ?? 0),
    // Games that were never played end up at the bottom.
    lastPlayed: (a, b) => (b.lastPlayedAt ?? -1) - (a.lastPlayedAt ?? -1)
  }
}

export function matchesLibraryFilters(game: Game, filters: LibraryFilters): boolean {
  const needle = filters.search.trim().toLowerCase()
  if (needle) {
    const haystack = [
      game.title,
      game.developer ?? '',
      game.publisher ?? '',
      game.platform,
      ...game.genres,
      ...game.tags
    ]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  if (filters.statuses.length > 0 && !filters.statuses.includes(game.status)) return false
  if (filters.platform !== 'all' && game.platform !== filters.platform) return false
  if (filters.groups.length > 0 && !filters.groups.includes(platformGroupOf(game.platform))) return false
  if (filters.genre !== 'all' && !game.genres.includes(filters.genre)) return false
  if (filters.onlyFavorites && game.favorite !== 1) return false
  if (filters.metacritic === 'good' && (game.metacritic ?? 0) < GOOD_METASCORE) return false
  if (filters.metacritic === 'missing' && (game.metacritic ?? 0) > 0) return false
  return true
}

export function filterAndSortGames(games: Game[], filters: LibraryFilters): Game[] {
  return games.filter((game) => matchesLibraryFilters(game, filters)).sort(sorters()[filters.sort])
}

/** Games without a Metascore, newest first: the basis for bulk enrichment. */
export function gamesMissingMetacritic(games: Game[], limit = 15): Game[] {
  return games
    .filter((game) => (game.metacritic ?? 0) <= 0)
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, limit)
}

/** Average of the available Metascores (null if none is rated). */
export function averageMetacritic(games: Game[]): number | null {
  const scores = games.map((game) => game.metacritic ?? 0).filter((score) => score > 0)
  if (scores.length === 0) return null
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}
