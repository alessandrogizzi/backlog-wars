/**
 * Video game title matching: used by the main process (picking the right source)
 * and by the renderer (showing how reliable a match is).
 * Pure functions, no dependencies.
 */
import type { GameMetadata } from './types'

const EDITION_NOISE =
  /\b(definitive|complete|ultimate|deluxe|enhanced|special|gold|goty|game of the year|remastered|remaster|remake|hd|edition|version|classic)\b/g

/** Words too common to identify a game in progressive searches. */
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'and',
  'il',
  'lo',
  'la',
  'i',
  'gli',
  'le',
  'di',
  'e',
  'edition',
  'definitive',
  'remastered',
  'complete'
])

/**
 * Normalises a title for comparison: lowercase, with trademarks, punctuation,
 * leading articles and edition noise ("Definitive Edition", "GOTY", …) removed.
 */
export function normalizeTitle(value: string): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[®™©]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(EDITION_NOISE, ' ')
    .replace(/^(the|a|an|il|lo|la|i|gli|le)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Similarity 0-1 between the user query and the title of a result. */
export function titleSimilarity(query: string, title: string): number {
  const left = normalizeTitle(query)
  const right = normalizeTitle(title)
  if (!left || !right) return 0
  if (left === right) return 1
  if (right.startsWith(left)) return 0.9
  if (left.startsWith(right)) return 0.85
  if (right.includes(left)) return 0.7
  if (left.includes(right)) return 0.65
  const queryTokens = new Set(left.split(' '))
  const titleTokens = new Set(right.split(' '))
  let common = 0
  for (const token of queryTokens) if (titleTokens.has(token)) common += 1
  if (common === 0) return 0
  const coverage = common / queryTokens.size
  const jaccard = common / new Set([...queryTokens, ...titleTokens]).size
  return Math.round(Math.max(coverage * 0.6, jaccard) * 100) / 100
}

const RANK_THRESHOLD = 0.34

/** Sorts any list by title similarity and discards the noise. */
export function rankBySimilarity<T>(
  items: T[],
  query: string,
  getTitle: (item: T) => string,
  threshold = RANK_THRESHOLD
): Array<{ item: T; score: number }> {
  return items
    .map((item) => ({ item, score: titleSimilarity(query, getTitle(item)) }))
    .filter((entry) => entry.score >= threshold)
    .sort((a, b) => b.score - a.score)
}

/**
 * Reorders results by similarity to the searched title and discards the noise.
 * Needed because some sources (GOG, Metacritic) search very permissively.
 */
export function rankByTitle(results: GameMetadata[], query: string, threshold = RANK_THRESHOLD): GameMetadata[] {
  return rankBySimilarity(results, query, (result) => result.title, threshold).map((entry) => entry.item)
}

/**
 * Queries to try in order: the full phrase, then progressively shorter versions.
 * Some sources find nothing if the phrase does not appear literally in the title.
 */
export function progressiveQueries(query: string): string[] {
  const cleaned = (query ?? '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return []
  const words = cleaned.split(' ')
  const candidates: string[] = [cleaned]
  const significant = words.filter((word) => !STOPWORDS.has(word.toLowerCase()))
  if (significant.length > 0 && significant.length < words.length) candidates.push(significant.join(' '))
  for (const size of [3, 2]) {
    if (significant.length > size) candidates.push(significant.slice(0, size).join(' '))
  }
  return [...new Set(candidates)]
}

/** Source preference when similarity ties (richer metadata first). */
const PROVIDER_RANK: Record<string, number> = { rawg: 0, steam: 1, gog: 2, hltb: 3 }

export interface MergedSearchOptions {
  limit?: number
  /** Minimum similarity to merge HLTB durations into a result from another source. */
  durationMatchThreshold?: number
}

/**
 * Merges the results of every source into a single list:
 * - HowLongToBeat durations are attached to the matching game from other sources
 *   (and HLTB platforms enrich the known ones, useful for retrogaming);
 * - games found only on HLTB (typically console/retro) stay as results of their own;
 * - the result is sorted by similarity to the searched title.
 */
export function mergeSearchResults(
  results: GameMetadata[],
  query: string,
  options: MergedSearchOptions = {}
): GameMetadata[] {
  const threshold = options.durationMatchThreshold ?? 0.8
  const limit = options.limit ?? 24
  const hltbEntries = results.filter((entry) => entry.provider === 'hltb')
  const others = results.filter((entry) => entry.provider !== 'hltb')
  const consumed = new Set<GameMetadata>()
  const merged: GameMetadata[] = []

  for (const entry of others) {
    const match = hltbEntries
      .filter((candidate) => !consumed.has(candidate))
      .map((candidate) => ({ candidate, score: titleSimilarity(entry.title, candidate.title) }))
      .sort((a, b) => b.score - a.score)[0]

    if (match && match.score >= threshold && match.candidate.durations) {
      consumed.add(match.candidate)
      merged.push({
        ...entry,
        durations: match.candidate.durations,
        platforms: [...new Set([...entry.platforms, ...match.candidate.platforms])],
        releaseYear: entry.releaseYear ?? match.candidate.releaseYear
      })
    } else {
      merged.push(entry)
    }
  }

  for (const entry of hltbEntries) {
    if (!consumed.has(entry)) merged.push(entry)
  }

  return merged
    .map((entry) => ({ entry, score: titleSimilarity(query, entry.title) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (PROVIDER_RANK[a.entry.provider] ?? 9) - (PROVIDER_RANK[b.entry.provider] ?? 9)
    })
    .map((scored) => scored.entry)
    .slice(0, limit)
}
