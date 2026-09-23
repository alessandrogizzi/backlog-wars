/**
 * Pure API response parsers. No dependency on Electron:
 * they can be tested with vitest without network.
 */
import type {
  GameMetadata,
  GogdbInfo,
  LinkPreview,
  MetacriticCandidate,
  MetacriticDetails
} from '@shared/types'
import {
  normalizeGenres,
  normalizePlatformList,
  normalizePlatformName,
  normalizePlatforms,
  yearFromDate
} from '@shared/catalog'
import { isoDateFromAny, stripHtml } from '@shared/format'

/* ------------------------------- RAWG ---------------------------------- */

interface RawgNamed {
  name?: string
}

interface RawgGame {
  id?: number
  slug?: string
  name?: string
  released?: string | null
  background_image?: string | null
  background_image_additional?: string | null
  metacritic?: number | null
  playtime?: number | null
  description_raw?: string | null
  description?: string | null
  genres?: RawgNamed[]
  platforms?: Array<{ platform?: RawgNamed }>
  parent_platforms?: Array<{ platform?: RawgNamed }>
  developers?: RawgNamed[]
  publishers?: RawgNamed[]
  website?: string | null
}

function rawgCover(game: RawgGame): string | undefined {
  const url = game.background_image ?? game.background_image_additional ?? undefined
  return url ? url : undefined
}

function rawgToMetadata(game: RawgGame): GameMetadata {
  const platforms = normalizePlatforms((game.platforms ?? []).map((p) => p.platform?.name ?? ''))
  const released = isoDateFromAny(game.released ?? undefined)
  return {
    provider: 'rawg',
    providerId: String(game.id ?? ''),
    title: (game.name ?? '').trim() || 'Senza titolo',
    coverUrl: rawgCover(game),
    description: stripHtml(game.description_raw ?? game.description ?? '') || undefined,
    genres: normalizeGenres((game.genres ?? []).map((g) => g.name ?? '')),
    platforms,
    releaseDate: released,
    releaseYear: yearFromDate(released ?? game.released ?? undefined),
    metacritic: typeof game.metacritic === 'number' ? game.metacritic : undefined,
    developers: (game.developers ?? []).map((d) => d.name ?? '').filter(Boolean),
    publishers: (game.publishers ?? []).map((p) => p.name ?? '').filter(Boolean),
    website: game.website ?? undefined,
    externalUrl: game.slug ? `https://rawg.io/games/${game.slug}` : undefined,
    playtimeHours: typeof game.playtime === 'number' && game.playtime > 0 ? game.playtime : undefined
  }
}

export function parseRawgSearch(json: unknown): GameMetadata[] {
  const payload = json as { results?: RawgGame[] } | null
  const results = payload?.results
  if (!Array.isArray(results)) return []
  return results.filter((game) => Boolean(game?.name)).map(rawgToMetadata)
}

export function parseRawgDetails(json: unknown): GameMetadata | null {
  const game = json as RawgGame | null
  if (!game || !game.name) return null
  return rawgToMetadata(game)
}

/* ------------------------------- Steam --------------------------------- */

interface SteamSearchItem {
  type?: string
  id?: number
  name?: string
  tiny_image?: string
  metascore?: string
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean }
}

interface SteamAppData {
  type?: string
  name?: string
  steam_appid?: number
  short_description?: string
  detailed_description?: string
  about_the_game?: string
  header_image?: string
  capsule_image?: string
  website?: string
  developers?: string[]
  publishers?: string[]
  genres?: Array<{ description?: string }>
  categories?: Array<{ description?: string }>
  release_date?: { coming_soon?: boolean; date?: string }
  metacritic?: { score?: number }
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean }
}

/** Vertical cover (600x900) from Steam's public CDN. */
export function steamCoverUrl(appId: string | number, hiRes = true): string {
  const file = hiRes ? 'library_600x900_2x.jpg' : 'library_600x900.jpg'
  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/${file}`
}

/** Horizontal cover, used as a fallback when the vertical one does not exist. */
export function steamHeaderUrl(appId: string | number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
}

function steamPlatformNames(platforms?: SteamAppData['platforms']): string[] {
  const names: string[] = []
  if (platforms?.windows) names.push('PC')
  if (platforms?.mac) names.push('macOS')
  if (platforms?.linux) names.push('Linux')
  return names
}

export function parseSteamSearch(json: unknown): GameMetadata[] {
  const payload = json as { items?: SteamSearchItem[] } | null
  const items = payload?.items
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => item && item.id !== undefined && item.name && (item.type === 'app' || item.type === undefined))
    .map((item) => {
      const appId = String(item.id)
      const score = Number(item.metascore)
      return {
        provider: 'steam' as const,
        providerId: appId,
        title: item.name ?? '',
        coverUrl: steamCoverUrl(appId),
        genres: [],
        platforms: steamPlatformNames(item.platforms),
        metacritic: Number.isFinite(score) && score > 0 ? score : undefined,
        developers: [],
        publishers: [],
        externalUrl: `https://store.steampowered.com/app/${appId}`
      }
    })
}

export function parseSteamAppDetails(json: unknown, appId: string): GameMetadata | null {
  const payload = json as Record<string, { success?: boolean; data?: SteamAppData }> | null
  const entry = payload?.[appId]
  if (!entry?.success || !entry.data) return null
  const data = entry.data
  const released = isoDateFromAny(data.release_date?.date)
  const description = stripHtml(data.detailed_description ?? data.about_the_game ?? '')
  return {
    provider: 'steam',
    providerId: appId,
    title: (data.name ?? '').trim(),
    coverUrl: steamCoverUrl(appId),
    description: description || undefined,
    shortDescription: stripHtml(data.short_description ?? '') || undefined,
    genres: normalizeGenres((data.genres ?? []).map((g) => g.description ?? '')),
    platforms: normalizePlatforms(steamPlatformNames(data.platforms)),
    releaseDate: released,
    releaseYear: yearFromDate(released ?? data.release_date?.date),
    metacritic: typeof data.metacritic?.score === 'number' ? data.metacritic.score : undefined,
    developers: (data.developers ?? []).filter(Boolean),
    publishers: (data.publishers ?? []).filter(Boolean),
    website: data.website ?? undefined,
    externalUrl: `https://store.steampowered.com/app/${appId}`
  }
}

/* --------------------------- HowLongToBeat ------------------------------ */

export const HLTB_IMAGE_BASE = 'https://howlongtobeat.com/games/'

interface HltbGame {
  game_id?: number
  game_name?: string
  game_image?: string
  comp_main?: number
  comp_plus?: number
  comp_100?: number
  comp_all?: number
  profile_platform?: string | null
  release_world?: number | null
  review_score?: number | null
}

/** HowLongToBeat exposes durations in seconds: here they become minutes. */
export function secondsToMinutes(value?: number | null): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined
  return Math.round(value / 60)
}

export function parseHltbSearch(json: unknown): GameMetadata[] {
  const payload = json as { data?: HltbGame[] } | null
  const list = payload?.data
  if (!Array.isArray(list)) return []
  return list
    .filter((game) => Boolean(game?.game_name))
    .map((game) => {
      const gameId = typeof game.game_id === 'number' ? game.game_id : undefined
      const url = gameId ? `https://howlongtobeat.com/game/${gameId}` : undefined
      return {
        provider: 'hltb' as const,
        providerId: String(gameId ?? game.game_name),
        title: (game.game_name ?? '').trim(),
        coverUrl: game.game_image ? `${HLTB_IMAGE_BASE}${game.game_image}` : undefined,
        genres: [],
        platforms: normalizePlatformList(game.profile_platform),
        releaseYear: yearFromDate(game.release_world ?? undefined),
        developers: [],
        publishers: [],
        externalUrl: url,
        durations: {
          main: secondsToMinutes(game.comp_main),
          mainExtra: secondsToMinutes(game.comp_plus),
          completionist: secondsToMinutes(game.comp_100),
          allStyles: secondsToMinutes(game.comp_all),
          hltbId: gameId,
          hltbUrl: url
        }
      }
    })
}

/* --------------------------------- GOG ---------------------------------- */

/** Image format used by gog-statics when the URL contains {formatter}. */
export const GOG_IMAGE_FORMATTER = 'product_card_v2_mobile_slider_639'

interface GogProduct {
  id?: string
  slug?: string
  title?: string
  coverVertical?: string
  coverHorizontal?: string
  developers?: string[]
  publishers?: string[]
  operatingSystems?: string[]
  releaseDate?: string | null
  genres?: Array<{ name?: string }>
  tags?: Array<{ name?: string }>
  storeLink?: string
  productType?: string
}

function gogImage(url?: string): string | undefined {
  if (!url) return undefined
  return url.includes('{formatter}') ? url.replace('{formatter}', GOG_IMAGE_FORMATTER) : url
}

export function parseGogSearch(json: unknown): GameMetadata[] {
  const payload = json as { products?: GogProduct[] } | null
  const products = payload?.products
  if (!Array.isArray(products)) return []
  return products
    .filter((product) => Boolean(product?.title))
    .map((product) => {
      const released = isoDateFromAny(product.releaseDate ?? undefined)
      const genreNames = [
        ...(product.genres ?? []).map((genre) => genre.name ?? ''),
        ...(product.tags ?? []).map((tag) => tag.name ?? '')
      ]
      return {
        provider: 'gog' as const,
        providerId: String(product.id ?? ''),
        title: (product.title ?? '').trim(),
        coverUrl: gogImage(product.coverVertical) ?? gogImage(product.coverHorizontal),
        genres: normalizeGenres(genreNames),
        platforms: normalizePlatforms(product.operatingSystems ?? []),
        releaseDate: released,
        releaseYear: yearFromDate(released),
        developers: (product.developers ?? []).filter(Boolean),
        publishers: (product.publishers ?? []).filter(Boolean),
        externalUrl: product.storeLink ?? (product.slug ? `https://www.gog.com/game/${product.slug}` : undefined)
      }
    })
}

/* -------------------------------- GOGDB --------------------------------- */

export const GOGDB_IMAGE_BASE = 'https://images.gog-statics.com/'

interface GogdbProduct {
  id?: number
  title?: string
  slug?: string
  description?: string
  developers?: string[]
  publishers?: string[]
  global_date?: string | null
  store_date?: string | null
  image_boxart?: string | null
  image_background?: string | null
  is_using_dosbox?: boolean
  builds?: Array<{ date_published?: string | null; os?: string | null }>
  tags?: Array<{ name?: string }>
  series?: { name?: string } | null
  type?: string
  link_store?: string | null
}

function gogdbImage(hash?: string | null): string | undefined {
  if (!hash) return undefined
  if (/^https?:\/\//i.test(hash)) return hash
  return `${GOGDB_IMAGE_BASE}${hash}.jpg`
}

/**
 * GOGDB data (https://www.gogdb.org/data/products/<id>/product.json).
 * GOGDB has no search API and explicitly asks to use the JSON files under /data
 * instead of scraping the pages: here we honor that request.
 */
export function parseGogdbProduct(json: unknown): GogdbInfo | null {
  const product = json as GogdbProduct | null
  if (!product || typeof product.id !== 'number' || !product.title) return null
  const builds = Array.isArray(product.builds) ? product.builds : []
  const buildDates = builds
    .map((build) => build.date_published)
    .filter((date): date is string => Boolean(date))
    .sort()
  const systems = [...new Set(builds.map((build) => build.os).filter((os): os is string => Boolean(os)))]
  const released = isoDateFromAny(product.global_date ?? product.store_date ?? undefined)
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: stripHtml(product.description ?? '') || undefined,
    developers: (product.developers ?? []).filter(Boolean),
    publishers: (product.publishers ?? []).filter(Boolean),
    releaseDate: released,
    releaseYear: yearFromDate(released),
    boxartUrl: gogdbImage(product.image_boxart),
    backgroundUrl: gogdbImage(product.image_background),
    usesDosbox: Boolean(product.is_using_dosbox),
    buildCount: builds.length,
    lastBuildAt: buildDates.at(-1)?.slice(0, 10),
    buildSystems: systems,
    tags: (product.tags ?? []).map((tag) => tag.name ?? '').filter(Boolean),
    series: product.series?.name ?? undefined,
    storeUrl: product.link_store ?? undefined,
    gogdbUrl: `https://www.gogdb.org/product/${product.id}`
  }
}

/* ------------------------------ Metacritic ------------------------------ */

export const METACRITIC_BASE = 'https://www.metacritic.com'

interface MetacriticItem {
  id?: number
  type?: string
  typeId?: number
  title?: string
  slug?: string
  premiereYear?: number | null
  description?: string | null
  platform?: string | null
  mustPlay?: boolean
  criticScoreSummary?: {
    score?: number | null
    reviewCount?: number | null
    sentiment?: string | null
    url?: string | null
    positiveCount?: number | null
    neutralCount?: number | null
    negativeCount?: number | null
  } | null
  genres?: Array<{ name?: string }>
  platforms?: Array<{
    name?: string
    releaseDate?: string | null
    criticScoreSummary?: { score?: number | null; reviewCount?: number | null } | null
  }>
}

function metacriticScore(summary?: MetacriticItem['criticScoreSummary']): number | undefined {
  const score = summary?.score
  // Metacritic uses 0 for "no score".
  return typeof score === 'number' && score > 0 ? Math.round(score) : undefined
}

function metacriticUrl(item: MetacriticItem): string {
  const path = item.criticScoreSummary?.url
  if (path) return `${METACRITIC_BASE}${path}`
  return item.slug ? `${METACRITIC_BASE}/game/${item.slug}/` : METACRITIC_BASE
}

function metacriticCandidate(item: MetacriticItem): MetacriticCandidate {
  return {
    id: item.id ?? 0,
    title: (item.title ?? '').trim(),
    slug: item.slug ?? '',
    year: yearFromDate(item.premiereYear ?? undefined),
    score: metacriticScore(item.criticScoreSummary),
    reviewCount: item.criticScoreSummary?.reviewCount ?? undefined,
    sentiment: item.criticScoreSummary?.sentiment ?? undefined,
    mustPlay: Boolean(item.mustPlay),
    platforms: normalizePlatforms((item.platforms ?? []).map((entry) => entry.name ?? '')),
    genres: (item.genres ?? []).map((genre) => genre.name ?? '').filter(Boolean),
    url: metacriticUrl(item)
  }
}

/** Metacritic search results (`/finder/metacritic/search/<query>/web`). */
export function parseMetacriticSearch(json: unknown): MetacriticCandidate[] {
  const payload = json as { data?: { items?: MetacriticItem[] } } | null
  const items = payload?.data?.items
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => item?.title && (item.type === 'game-title' || item.typeId === 13))
    .map(metacriticCandidate)
}

/** Details of a Metacritic entry, with the per-platform scores. */
export function parseMetacriticDetails(json: unknown): MetacriticDetails | null {
  const item = (json as { data?: { item?: MetacriticItem } } | null)?.data?.item
  if (!item || !item.title) return null
  const base = metacriticCandidate(item)
  return {
    ...base,
    description: stripHtml(item.description ?? '') || undefined,
    positiveCount: item.criticScoreSummary?.positiveCount ?? undefined,
    neutralCount: item.criticScoreSummary?.neutralCount ?? undefined,
    negativeCount: item.criticScoreSummary?.negativeCount ?? undefined,
    platformScores: (item.platforms ?? [])
      .map((entry) => ({
        platform: normalizePlatformName(entry.name ?? ''),
        score: metacriticScore(entry.criticScoreSummary),
        reviewCount: entry.criticScoreSummary?.reviewCount ?? undefined,
        releaseDate: isoDateFromAny(entry.releaseDate ?? undefined)
      }))
      .filter((entry) => entry.platform !== 'Altro' || entry.score !== undefined)
  }
}

/* ------------------------------ Link previews ---------------------------- */

/** Reads the attributes of an HTML tag into a map (order does not matter). */
function parseTagAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const regex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(tag)) !== null) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return attributes
}

function decodeAttribute(value: string): string {
  return stripHtml(value).replace(/\s+/g, ' ').trim()
}

function resolveUrl(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined
  try {
    const resolved = new URL(href.trim(), base)
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return undefined
    return resolved.toString()
  } catch {
    return undefined
  }
}

/**
 * Extracts a page preview from its meta tags: Open Graph, Twitter Card,
 * falling back to <title> and <meta name="description">. Pure, testable function.
 */
export function parseLinkPreview(html: string, url: string): LinkPreview {
  let base: URL
  try {
    base = new URL(url)
  } catch {
    return { url, host: '' }
  }
  const host = base.hostname.replace(/^www\./i, '')

  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => parseTagAttributes(match[0]))
  const metaContent = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const found = metas.find((attributes) => {
        const name = (attributes.property ?? attributes.name ?? attributes.itemprop ?? '').toLowerCase()
        return name === key
      })
      const value = found?.content
      if (value && value.trim()) return decodeAttribute(value)
    }
    return undefined
  }

  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  const icons = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => parseTagAttributes(match[0]))
  const iconByRel = (want: string): string | undefined =>
    icons.find((attributes) => (attributes.rel ?? '').toLowerCase().split(/\s+/).includes(want))?.href

  return {
    url,
    host,
    title: metaContent('og:title', 'twitter:title') ?? (titleTag ? decodeAttribute(titleTag) : undefined),
    description: metaContent('og:description', 'twitter:description', 'description'),
    imageUrl: resolveUrl(
      metaContent('og:image:secure_url', 'og:image:url', 'og:image', 'twitter:image', 'twitter:image:src'),
      url
    ),
    faviconUrl: resolveUrl(iconByRel('apple-touch-icon') ?? iconByRel('icon'), url) ?? `${base.origin}/favicon.ico`,
    siteName: metaContent('og:site_name', 'application-name')
  }
}
