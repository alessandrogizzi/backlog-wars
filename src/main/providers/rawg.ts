import type { GameMetadata } from '@shared/types'
import { fetchJson, ProviderError } from './http'
import { parseRawgDetails, parseRawgSearch } from './parse'

const BASE = 'https://api.rawg.io/api'

function requireKey(apiKey?: string): string {
  const key = (apiKey ?? '').trim()
  if (!key) {
    throw new ProviderError(
      'A RAWG API key is required: create one for free at rawg.io/apidocs and paste it in Settings.',
      'missingKey'
    )
  }
  return key
}

export async function searchRawg(query: string, apiKey: string | undefined, limit = 12): Promise<GameMetadata[]> {
  const key = requireKey(apiKey)
  const url = new URL(`${BASE}/games`)
  url.searchParams.set('key', key)
  url.searchParams.set('search', query)
  url.searchParams.set('search_precise', 'true')
  url.searchParams.set('page_size', String(Math.min(Math.max(limit, 1), 40)))
  const json = await fetchJson<unknown>(url.toString())
  return parseRawgSearch(json)
}

export async function rawgDetails(id: string, apiKey: string | undefined): Promise<GameMetadata | null> {
  const key = requireKey(apiKey)
  const url = new URL(`${BASE}/games/${encodeURIComponent(id)}`)
  url.searchParams.set('key', key)
  const json = await fetchJson<unknown>(url.toString())
  return parseRawgDetails(json)
}
