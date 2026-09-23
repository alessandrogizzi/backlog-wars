import type { GameMetadata } from '@shared/types'
import { progressiveQueries, rankByTitle } from '@shared/text'
import { fetchJson } from './http'
import { parseGogSearch } from './parse'

/**
 * GOG catalog (the same API used by the site, no key required).
 * Search is phrase-based: "the witcher 3" does not find "The Witcher 3: Wild Hunt",
 * so we try several progressive queries and re-rank the results by similarity.
 */
const CATALOG = 'https://catalog.gog.com/v1/catalog'
const CACHE_TTL_MS = 10 * 60 * 1000
const searchCache = new Map<string, { results: GameMetadata[]; fetchedAt: number }>()

function catalogUrl(query: string, limit: number, country: string, currency: string): string {
  const url = new URL(CATALOG)
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 48)))
  url.searchParams.set('locale', 'en-US')
  url.searchParams.set('order', 'desc:trending')
  url.searchParams.set('page', '1')
  url.searchParams.set('countryCode', (country || 'IT').toUpperCase())
  url.searchParams.set('currencyCode', (currency || 'EUR').toUpperCase())
  url.searchParams.set('query', query)
  url.searchParams.set('productType', 'in:game')
  return url.toString()
}

async function runQuery(query: string, limit: number, country: string, currency: string): Promise<GameMetadata[]> {
  const json = await fetchJson<unknown>(catalogUrl(query, limit, country, currency), { timeoutMs: 15_000 })
  return parseGogSearch(json)
}

export async function searchGog(
  query: string,
  limit = 12,
  country = 'IT',
  currency = 'EUR'
): Promise<GameMetadata[]> {
  const cacheKey = `${query.toLowerCase()}|${limit}|${country}|${currency}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.results

  const candidates = progressiveQueries(query)
  const collected = new Map<string, GameMetadata>()
  let bestRanked: GameMetadata[] = []

  for (const [index, candidate] of candidates.entries()) {
    const results = await runQuery(candidate, limit, country, currency)
    for (const result of results) {
      if (!collected.has(result.providerId)) collected.set(result.providerId, result)
    }
    bestRanked = rankByTitle([...collected.values()], query)
    if (bestRanked.length >= 3) break
    if (index >= 1) break // at most two requests
  }

  const results = bestRanked.length > 0 ? bestRanked : [...collected.values()]
  searchCache.set(cacheKey, { results, fetchedAt: Date.now() })
  return results
}
