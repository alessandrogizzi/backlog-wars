import { net } from 'electron'
import type { LinkPreview } from '@shared/types'
import { ProviderError } from './http'
import { parseLinkPreview } from './parse'

/**
 * Useful links preview: downloads the page in the main process (no CORS,
 * no JavaScript executed) and reads the Open Graph meta tags. For YouTube it uses
 * the official oEmbed, which is more reliable than meta tags.
 * Results are cached: previews rarely change.
 */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
/** Only the first bytes are read: the meta tags live in the <head>. */
const MAX_BYTES = 400_000

const cache = new Map<string, { preview: LinkPreview; fetchedAt: number }>()

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 BacklogWars/1.0'

function assertHttpUrl(url: string): URL {
  const raw = (url ?? '').trim()
  if (!raw) throw new ProviderError('Missing address.', 'linkMissingUrl')
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new ProviderError('Invalid address: a full http or https URL is required.', 'invalidUrl')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ProviderError('Only http and https addresses are allowed.', 'scheme')
  }
  return parsed
}

async function readLimitedText(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let text = ''
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      received += value.byteLength
      text += decoder.decode(value, { stream: true })
    }
    if (received >= MAX_BYTES) {
      await reader.cancel().catch(() => undefined)
      break
    }
  }
  return text
}

async function fetchHtml(url: string): Promise<string | null> {
  const response = await net.fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8'
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000)
  })
  if (!response.ok) return null
  const contentType = response.headers.get('content-type') ?? ''
  if (!/text\/html|application\/xhtml/i.test(contentType)) return null
  return readLimitedText(response)
}

/** YouTube exposes a public oEmbed: title, author and thumbnail guaranteed. */
async function youtubePreview(url: string): Promise<Partial<LinkPreview> | null> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const response = await net.fetch(endpoint, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000)
    })
    if (!response.ok) return null
    const json = (await response.json()) as { title?: string; author_name?: string; thumbnail_url?: string }
    if (!json?.title) return null
    return {
      title: json.title,
      description: json.author_name ? `Video di ${json.author_name}` : undefined,
      imageUrl: json.thumbnail_url,
      siteName: 'YouTube'
    }
  } catch {
    return null
  }
}

/** Fetches (or returns from the cache) the preview of a page. */
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  const parsed = assertHttpUrl(url)
  const key = parsed.toString()
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.preview

  const isYouTube = /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(parsed.hostname)

  if (isYouTube) {
    const oembed = await youtubePreview(key)
    if (oembed) {
      const preview: LinkPreview = { url: key, host: 'youtube.com', faviconUrl: 'https://www.youtube.com/favicon.ico', ...oembed }
      cache.set(key, { preview, fetchedAt: Date.now() })
      return preview
    }
  }

  const html = await fetchHtml(key)
  if (!html) return null

  const preview = parseLinkPreview(html, key)
  if (!preview.title && !preview.description && !preview.imageUrl) {
    // Page with no useful meta tags: the link stays valid, but without a preview.
    cache.set(key, { preview, fetchedAt: Date.now() })
    return preview
  }
  cache.set(key, { preview, fetchedAt: Date.now() })
  return preview
}
