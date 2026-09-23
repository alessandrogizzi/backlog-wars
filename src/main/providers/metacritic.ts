import type { MetacriticCandidate, MetacriticDetails } from '@shared/types'
import { progressiveQueries, rankBySimilarity } from '@shared/text'
import { fetchJson, ProviderError } from './http'
import { parseMetacriticDetails, parseMetacriticSearch } from './parse'

/**
 * Metacritic has no public API: the site uses this JSON backend, which
 * also responds without authentication using the public key embedded
 * in its frontend. The key can be replaced from Settings if it changes.
 * Scores rarely change, so we keep a long cache (24 hours) to
 * avoid burdening the service.
 */
const BACKEND = 'https://backend.metacritic.com'
export const METACRITIC_PUBLIC_API_KEY = '1MOZgmNFxvmljaQR1X9KAij9Mo4xAY3u'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const searchCache = new Map<string, { results: MetacriticCandidate[]; fetchedAt: number }>()
const detailsCache = new Map<string, { details: MetacriticDetails; fetchedAt: number }>()

function resolveKey(apiKey?: string): string {
  const key = (apiKey ?? '').trim()
  return key.length > 0 ? key : METACRITIC_PUBLIC_API_KEY
}

function searchUrl(query: string, limit: number, apiKey?: string): string {
  const url = new URL(`${BACKEND}/finder/metacritic/search/${encodeURIComponent(query)}/web`)
  url.searchParams.set('offset', '0')
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 20)))
  url.searchParams.set('apiKey', resolveKey(apiKey))
  return url.toString()
}

function detailsUrl(slug: string, apiKey?: string): string {
  const url = new URL(`${BACKEND}/games/metacritic/${encodeURIComponent(slug)}/web`)
  url.searchParams.set('apiKey', resolveKey(apiKey))
  return url.toString()
}

function wrap(error: unknown): ProviderError {
  if (error instanceof ProviderError && /401|403|negato/i.test(error.message)) {
    return new ProviderError(
      'Metacritic rejected the request: the public key may have changed. You can set a new one in Settings.',
      'forbidden'
    )
  }
  return error instanceof ProviderError ? error : new ProviderError(String(error), 'unknown', { message: String(error) })
}

/**
 * Searches for a game on Metacritic. Metacritic's own search engine
 * is very permissive, so we try progressive queries and re-rank the
 * results by title similarity.
 */
export async function searchMetacritic(
  query: string,
  limit = 10,
  apiKey?: string
): Promise<MetacriticCandidate[]> {
  const cacheKey = `${query.toLowerCase()}|${limit}|${resolveKey(apiKey).slice(0, 8)}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.results

  const candidates = progressiveQueries(query)
  const collected = new Map<number, MetacriticCandidate>()
  let ranked: MetacriticCandidate[] = []

  try {
    for (const [index, candidate] of candidates.entries()) {
      const json = await fetchJson<unknown>(searchUrl(candidate, limit, apiKey), { timeoutMs: 15_000 })
      for (const result of parseMetacriticSearch(json)) collected.set(result.id, result)
      ranked = rankBySimilarity([...collected.values()], query, (entry) => entry.title).map((entry) => entry.item)
      if (ranked.length >= 3) break
      if (index >= 1) break // at most two requests
    }
  } catch (error) {
    throw wrap(error)
  }

  const results = ranked.length > 0 ? ranked : [...collected.values()]
  searchCache.set(cacheKey, { results, fetchedAt: Date.now() })
  return results
}

/** Details of a Metacritic entry (per-platform scores included). */
export async function metacriticDetails(slug: string, apiKey?: string): Promise<MetacriticDetails | null> {
  const clean = (slug ?? '').trim()
  if (!clean) throw new ProviderError('Missing Metacritic slug.', 'invalidUrl')
  const cached = detailsCache.get(clean)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.details

  try {
    const json = await fetchJson<unknown>(detailsUrl(clean, apiKey), { timeoutMs: 15_000 })
    const details = parseMetacriticDetails(json)
    if (details) detailsCache.set(clean, { details, fetchedAt: Date.now() })
    return details
  } catch (error) {
    throw wrap(error)
  }
}
