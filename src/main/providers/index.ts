import type {
  DurationsRequest,
  DurationsResponse,
  GameMetadata,
  GogdbInfo,
  GogdbRequest,
  LinkPreview,
  LinkPreviewRequest,
  MetacriticDetails,
  MetacriticDetailsRequest,
  MetacriticRequest,
  MetacriticResponse,
  MetadataDetailsRequest,
  MetadataSearchRequest,
  MetadataSearchResponse,
  MetadataSourceStatus,
  ProviderId
} from '@shared/types'
import { normalizeGenres, normalizePlatforms } from '@shared/catalog'
import { mergeSearchResults, titleSimilarity } from '@shared/text'
import { fetchGogdbProduct } from './gogdb'
import { ProviderError } from './http'
import { lookupDurations, searchHltb } from './hltb'
import { searchGog } from './gog'
import { rawgDetails, searchRawg } from './rawg'
import { fetchLinkPreview } from './linkPreview'
import { metacriticDetails, searchMetacritic } from './metacritic'
import { searchSteam, steamDetails } from './steam'

export { ProviderError }

/** Below this similarity the score found is not applied automatically. */
export const MIN_METACRITIC_MATCH = 0.6

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/** Sources queried in automatic mode (RAWG only when the key is set). */
export function defaultSources(hasRawgKey: boolean): ProviderId[] {
  return hasRawgKey ? ['steam', 'gog', 'hltb', 'rawg'] : ['steam', 'gog', 'hltb']
}

function singleSourceSearch(request: MetadataSearchRequest, provider: ProviderId): Promise<GameMetadata[]> {
  const query = request.query.trim()
  const limit = request.limit ?? 12
  switch (provider) {
    case 'steam':
      return searchSteam(query, request.steamCountry ?? 'IT')
    case 'gog':
      return searchGog(query, limit, request.gogCountry ?? 'IT', request.gogCurrency ?? 'EUR')
    case 'hltb':
      return searchHltb(query, limit)
    case 'rawg':
      return searchRawg(query, request.rawgApiKey, limit)
    default:
      throw new ProviderError(`Unknown search source: ${String(provider)}`, 'unknown')
  }
}

function describeFailure(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Metadata search. In `auto` mode it queries all available sources in
 * parallel and merges the results: HowLongToBeat durations are attached to the
 * matching game, so a single result has cover, genres and durations.
 */
export async function searchMetadata(request: MetadataSearchRequest): Promise<MetadataSearchResponse> {
  const query = request.query.trim()
  if (query.length < 2) {
    return { provider: 'steam', results: [], warning: 'Scrivi almeno 2 caratteri per cercare.', sources: [] }
  }

  if (request.provider !== 'auto') {
    const provider = request.provider
    const results = await singleSourceSearch(request, provider)
    return {
      provider,
      results: mergeSearchResults(results, query, { limit: 30 }),
      sources: [{ provider, count: results.length }]
    }
  }

  const hasRawgKey = Boolean((request.rawgApiKey ?? '').trim())
  const plan = defaultSources(hasRawgKey)
  const settled = await Promise.allSettled(
    plan.map(async (provider) => ({ provider, results: await singleSourceSearch(request, provider) }))
  )

  const sources: MetadataSourceStatus[] = []
  const collected: GameMetadata[] = []
  const failures: string[] = []

  settled.forEach((outcome, index) => {
    const provider = plan[index]
    if (outcome.status === 'fulfilled') {
      sources.push({ provider, count: outcome.value.results.length })
      collected.push(...outcome.value.results)
    } else {
      const error = describeFailure(outcome.reason)
      sources.push({ provider, count: 0, error })
      failures.push(`${provider.toUpperCase()}: ${error}`)
    }
  })

  const results = mergeSearchResults(collected, query, { limit: 24 })
  const warning = failures.length > 0 ? `Alcune fonti non hanno risposto → ${failures.join(' · ')}` : undefined
  const primary = results[0]?.provider ?? plan[0]
  return { provider: primary, results, warning, sources }
}

function gogdbToMetadata(info: GogdbInfo): GameMetadata {
  return {
    provider: 'gog',
    providerId: String(info.id),
    title: info.title,
    coverUrl: info.boxartUrl,
    description: info.description,
    genres: normalizeGenres(info.tags),
    platforms: normalizePlatforms(info.buildSystems),
    releaseDate: info.releaseDate,
    releaseYear: info.releaseYear,
    developers: info.developers,
    publishers: info.publishers,
    externalUrl: info.storeUrl,
    usesDosbox: info.usesDosbox
  }
}

/**
 * Details for a single game. For GOG the source is GOGDB: the GOG catalog does
 * not expose descriptions, while GOGDB publishes product.json with description,
 * boxart and information about builds and DOSBox.
 */
export async function getMetadataDetails(request: MetadataDetailsRequest): Promise<GameMetadata | null> {
  switch (request.provider) {
    case 'rawg':
      return rawgDetails(request.providerId, request.rawgApiKey)
    case 'steam':
      return steamDetails(request.providerId, request.steamCountry ?? 'IT')
    case 'gog': {
      const info = await fetchGogdbProduct(request.providerId)
      return info ? gogdbToMetadata(info) : null
    }
    case 'hltb':
      // HowLongToBeat does not expose a per-id endpoint: the data already comes from search.
      return null
    default:
      return null
  }
}

export async function getDurations(request: DurationsRequest): Promise<DurationsResponse> {
  const title = request.title.trim()
  if (title.length < 2) throw new ProviderError('A game title is required to look up durations.', 'invalidUrl')
  return lookupDurations(title, request.year)
}

export async function getGogdbInfo(request: GogdbRequest): Promise<GogdbInfo | null> {
  return fetchGogdbProduct(request.productId)
}

/** Preview (title, description, image) of a linked page. */
export async function getLinkPreview(request: LinkPreviewRequest): Promise<LinkPreview | null> {
  return fetchLinkPreview(request.url)
}

/**
 * Metacritic score for a title: picks the best match
 * by combining title similarity, year and platform.
 */
export async function getMetacriticMatch(
  request: MetacriticRequest
): Promise<MetacriticResponse> {
  const title = request.title.trim()
  if (title.length < 2) throw new ProviderError('A game title is required to look up the Metacritic score.', 'invalidUrl')
  const candidates = await searchMetacritic(title, 10, request.apiKey)
  if (candidates.length === 0) return { best: null, alternatives: [] }

  const scored = candidates
    .map((candidate) => {
      let score = titleSimilarity(title, candidate.title)
      if (request.year && candidate.year && Math.abs(candidate.year - request.year) <= 1) score += 0.1
      if (request.platform && candidate.platforms.includes(request.platform)) score += 0.05
      // An entry without a score is less useful than one with a Metascore.
      if (candidate.score === undefined) score -= 0.05
      return { candidate, score: Math.round(clamp01(score) * 100) / 100 }
    })
    .sort((a, b) => b.score - a.score)

  const [first, ...rest] = scored
  const best = first && first.score >= MIN_METACRITIC_MATCH ? first : null
  return { best, alternatives: (best ? rest : scored).slice(0, 6).map((entry) => entry.candidate) }
}

export async function getMetacriticDetails(request: MetacriticDetailsRequest): Promise<MetacriticDetails | null> {
  return metacriticDetails(request.slug, request.apiKey)
}
