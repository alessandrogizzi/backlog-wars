import type { GameMetadata } from '@shared/types'
import { progressiveQueries, rankByTitle, titleSimilarity } from '@shared/text'
import { fetchJson, postJson, ProviderError } from './http'
import { parseHltbSearch } from './parse'

/**
 * HowLongToBeat has no official API: the site exposes two endpoints used
 * by its own interface.
 *   1. GET  /api/search/site/init?t=<timestamp>  → { token }
 *   2. POST /api/search/site  (x-auth-token header) → results with durations
 * The token is reused and refreshed automatically (it expires, and in that
 * case the API replies 403).
 */
const BASE = 'https://howlongtobeat.com'
const TOKEN_TTL_MS = 25 * 60 * 1000
const CACHE_TTL_MS = 10 * 60 * 1000

let cachedToken: { value: string; fetchedAt: number } | null = null
const searchCache = new Map<string, { results: GameMetadata[]; fetchedAt: number }>()

/** Below this threshold the match is too weak to be proposed. */
export const MIN_DURATION_MATCH = 0.6

function commonHeaders(): Record<string, string> {
  return { Referer: `${BASE}/`, Origin: BASE }
}

async function getToken(force = false): Promise<string> {
  const now = Date.now()
  if (!force && cachedToken && now - cachedToken.fetchedAt < TOKEN_TTL_MS) return cachedToken.value
  const json = await fetchJson<{ token?: string }>(`${BASE}/api/search/site/init?t=${now}`, {
    headers: commonHeaders(),
    timeoutMs: 15_000
  })
  const token = json?.token
  if (!token) throw new ProviderError('HowLongToBeat did not provide a search token.', 'forbidden')
  cachedToken = { value: token, fetchedAt: now }
  return token
}

function buildBody(query: string, limit: number): unknown {
  return {
    searchType: 'games',
    searchTerms: query.split(' ').filter(Boolean),
    searchPage: 1,
    size: Math.min(Math.max(limit, 1), 50),
    searchOptions: {
      games: {
        userId: 0,
        platform: { mode: 'include', values: [] },
        sortCategory: 'popular',
        rangeCategory: 'main',
        rangeTime: { min: 0, max: 0 },
        gameplay: {
          perspective: { mode: 'include', values: [] },
          flow: { mode: 'include', values: [] },
          genre: { mode: 'include', values: [] }
        },
        year: { mode: 'include', values: [] },
        modifier: ''
      },
      users: { sortCategory: 'postcount' },
      lists: { sortCategory: 'follows' },
      filter: '',
      sort: 0,
      randomizer: 0
    },
    useCache: true
  }
}

async function singleQuery(query: string, limit: number, token: string): Promise<GameMetadata[]> {
  const json = await postJson<unknown>(`${BASE}/api/search/site`, buildBody(query, limit), {
    headers: { ...commonHeaders(), 'x-auth-token': token },
    timeoutMs: 20_000
  })
  return parseHltbSearch(json)
}

async function runQuery(query: string, limit: number): Promise<GameMetadata[]> {
  const token = await getToken()
  try {
    return await singleQuery(query, limit, token)
  } catch (error) {
    // Expired token: refresh it only once.
    if (error instanceof ProviderError && /token|403|401/i.test(error.message)) {
      return singleQuery(query, limit, await getToken(true))
    }
    throw error
  }
}

/**
 * Searches HowLongToBeat. If the full phrase gives no useful results,
 * it retries with a shorter query and merges the results.
 */
export async function searchHltb(query: string, limit = 12): Promise<GameMetadata[]> {
  const cacheKey = `${query.toLowerCase()}|${limit}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.results

  const candidates = progressiveQueries(query)
  const collected = new Map<string, GameMetadata>()

  for (const [index, candidate] of candidates.entries()) {
    const results = await runQuery(candidate, limit)
    for (const result of results) {
      if (!collected.has(result.providerId)) collected.set(result.providerId, result)
    }
    // The first query is enough if it already gave solid results.
    if (collected.size >= 3 || index === candidates.length - 1) break
    // At most two attempts so as not to stress the service.
    if (index >= 1) break
  }

  const ranked = rankByTitle([...collected.values()], query)
  const results = ranked.length > 0 ? ranked : [...collected.values()]
  searchCache.set(cacheKey, { results, fetchedAt: Date.now() })
  return results
}

/** Durations for a known title: best match + alternatives. */
export async function lookupDurations(
  title: string,
  year?: number
): Promise<{ best: { metadata: GameMetadata; score: number } | null; alternatives: Array<{ metadata: GameMetadata; score: number }> }> {
  const results = await searchHltb(title, 12)
  const scored = results
    .map((metadata) => {
      let score = titleSimilarity(title, metadata.title)
      // The year is a great disambiguator (remakes, re-releases, same-name titles).
      if (year && metadata.releaseYear && Math.abs(metadata.releaseYear - year) <= 1) score = Math.min(1, score + 0.1)
      return { metadata, score: Math.round(score * 100) / 100 }
    })
    .sort((a, b) => b.score - a.score)

  const withDurations = scored.filter((entry) => entry.metadata.durations && (entry.metadata.durations.main || entry.metadata.durations.allStyles))
  const usable = withDurations.length > 0 ? withDurations : scored
  const [first, ...rest] = usable
  const best = first && first.score >= MIN_DURATION_MATCH ? first : null
  const alternatives = (best ? rest : usable).slice(0, 5)
  return { best, alternatives }
}
