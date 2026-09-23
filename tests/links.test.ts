/**
 * Useful links: URL normalization, host and preview parsing
 * (Open Graph / Twitter Card) with simplified real-page fixtures.
 */
import { describe, expect, it } from 'vitest'
import { parseLinkPreview } from '@main/providers/parse'
import { LINK_LABELS, isLinkEdited, linkHost, normalizeUrl } from '@renderer/db/types'

describe('normalizeUrl', () => {
  it('aggiunge https:// quando manca lo schema', () => {
    expect(normalizeUrl('www.pcgamingwiki.com/wiki/Hades')).toBe('https://www.pcgamingwiki.com/wiki/Hades')
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com/')
  })

  it('accetta http e https', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/')
    expect(normalizeUrl('https://example.com/guida?x=1')).toBe('https://example.com/guida?x=1')
  })

  it('rifiuta schemi pericolosi e testo non valido', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeUndefined()
    expect(normalizeUrl('file:///etc/passwd')).toBeUndefined()
    expect(normalizeUrl('non un url')).toBeUndefined()
    expect(normalizeUrl('')).toBeUndefined()
    expect(normalizeUrl('   ')).toBeUndefined()
  })
})

describe('linkHost', () => {
  it('toglie www e tiene solo il dominio', () => {
    expect(linkHost('https://www.pcgamingwiki.com/wiki/Hades')).toBe('pcgamingwiki.com')
    expect(linkHost('https://howlongtobeat.com/game/1705')).toBe('howlongtobeat.com')
    expect(linkHost('non un url')).toBe('')
  })
})

describe('isLinkEdited', () => {
  it('distingue un link ritoccato da uno appena creato', () => {
    expect(isLinkEdited({ createdAt: 100, updatedAt: 100 })).toBe(false)
    expect(isLinkEdited({ createdAt: 100, updatedAt: 200 })).toBe(true)
  })

  it('espone le etichette pronte', () => {
    expect(LINK_LABELS).toContain('Guida')
    expect(LINK_LABELS).toContain('Wiki')
  })
})

const steamPage = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>Portal 2 on Steam</title>
<meta name="description" content="Portal 2 è un puzzle game.">
<meta property="og:type" content="game">
<meta content="Portal 2 su Steam" property="og:title">
<meta property="og:description" content="Il puzzle game di Valve &amp; soci.">
<meta property="og:image" content="/shared/images/header.jpg">
<meta property="og:site_name" content="Steam">
<link rel="apple-touch-icon" href="/favicon-180.png">
<link rel="icon" href="favicon.ico">
</head><body>...</body></html>`

describe('parseLinkPreview', () => {
  it('legge i meta Open Graph anche con gli attributi invertiti', () => {
    const preview = parseLinkPreview(steamPage, 'https://store.steampowered.com/app/620/Portal_2/')
    expect(preview.title).toBe('Portal 2 su Steam')
    expect(preview.description).toBe('Il puzzle game di Valve & soci.')
    expect(preview.siteName).toBe('Steam')
    expect(preview.host).toBe('store.steampowered.com')
  })

  it('risolve gli indirizzi relativi di immagine e favicon', () => {
    const preview = parseLinkPreview(steamPage, 'https://store.steampowered.com/app/620/Portal_2/')
    expect(preview.imageUrl).toBe('https://store.steampowered.com/shared/images/header.jpg')
    expect(preview.faviconUrl).toBe('https://store.steampowered.com/favicon-180.png')
  })

  it('ripiega su <title> e description quando mancano le Open Graph', () => {
    const html = '<html><head><title>Solo il titolo</title><meta name="description" content="Una descrizione"></head></html>'
    const preview = parseLinkPreview(html, 'https://example.com/pagina')
    expect(preview.title).toBe('Solo il titolo')
    expect(preview.description).toBe('Una descrizione')
    expect(preview.imageUrl).toBeUndefined()
    expect(preview.faviconUrl).toBe('https://example.com/favicon.ico')
  })

  it('usa la Twitter Card se non ci sono Open Graph', () => {
    const html = `
      <meta name="twitter:title" content="Titolo Twitter">
      <meta name="twitter:description" content="Descrizione Twitter">
      <meta name="twitter:image" content="https://cdn.example.com/card.png">
    `
    const preview = parseLinkPreview(html, 'https://example.com/')
    expect(preview.title).toBe('Titolo Twitter')
    expect(preview.description).toBe('Descrizione Twitter')
    expect(preview.imageUrl).toBe('https://cdn.example.com/card.png')
  })

  it('non si rompe con pagine vuote o senza meta tag', () => {
    const preview = parseLinkPreview('<html><body>niente</body></html>', 'https://example.com/')
    expect(preview.title).toBeUndefined()
    expect(preview.description).toBeUndefined()
    expect(preview.host).toBe('example.com')
  })

  it('regge un URL non valido', () => {
    expect(parseLinkPreview('<title>x</title>', 'non un url')).toEqual({ url: 'non un url', host: '' })
  })

  it('decodifica le entità HTML dei meta tag', () => {
    const html = '<meta property="og:title" content="Tom &amp; Jerry &quot;ok&quot;">'
    expect(parseLinkPreview(html, 'https://example.com/').title).toBe('Tom & Jerry "ok"')
  })
})
