import type { GameMetadata } from '@shared/types'
import { fetchJson } from './http'
import { parseSteamAppDetails, parseSteamSearch } from './parse'

const STORE = 'https://store.steampowered.com/api'

export async function searchSteam(query: string, country = 'IT'): Promise<GameMetadata[]> {
  const url = new URL(`${STORE}/storesearch/`)
  url.searchParams.set('term', query)
  url.searchParams.set('l', 'italian')
  url.searchParams.set('cc', (country || 'IT').toUpperCase())
  const json = await fetchJson<unknown>(url.toString())
  return parseSteamSearch(json)
}

export async function steamDetails(appId: string, country = 'IT'): Promise<GameMetadata | null> {
  const url = new URL(`${STORE}/appdetails`)
  url.searchParams.set('appids', appId)
  url.searchParams.set('l', 'italian')
  url.searchParams.set('cc', (country || 'IT').toUpperCase())
  const json = await fetchJson<unknown>(url.toString())
  return parseSteamAppDetails(json, appId)
}
