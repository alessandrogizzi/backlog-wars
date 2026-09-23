import type { GogdbInfo } from '@shared/types'
import { fetchJson, ProviderError } from './http'
import { parseGogdbProduct } from './parse'

/**
 * GOGDB (https://www.gogdb.org) collects data about GOG products: builds, changelogs,
 * descriptions and images. On the site they explain that there is no search API but that
 * *all* the data is exposed as JSON under /data, and they ask to use those instead
 * of scraping and to limit requests: here we use the JSON files and keep a cache.
 */
const BASE = 'https://www.gogdb.org/data/products'
const CACHE_TTL_MS = 60 * 60 * 1000

const cache = new Map<string, { info: GogdbInfo; fetchedAt: number }>()

export async function fetchGogdbProduct(productId: string): Promise<GogdbInfo | null> {
  const id = String(productId ?? '').trim()
  if (!/^\d+$/.test(id)) {
    throw new ProviderError('Invalid GOG product id: GOGDB uses the numeric ids from gog.com.', 'invalidUrl')
  }

  const cached = cache.get(id)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.info

  const json = await fetchJson<unknown>(`${BASE}/${id}/product.json`, { timeoutMs: 20_000 })
  const info = parseGogdbProduct(json)
  if (!info) throw new ProviderError(`GOGDB has no data for product ${id}.`, 'notFound', { id })
  cache.set(id, { info, fetchedAt: Date.now() })
  return info
}
