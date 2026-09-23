import { describe, expect, it } from 'vitest'
import {
  parseRawgDetails,
  parseRawgSearch,
  parseSteamAppDetails,
  parseSteamSearch,
  steamCoverUrl
} from '@main/providers/parse'

const rawgSearchPayload = {
  count: 2,
  results: [
    {
      id: 3498,
      slug: 'grand-theft-auto-v',
      name: 'Grand Theft Auto V',
      released: '2013-09-17',
      background_image: 'https://media.rawg.io/media/games/456/456.jpg',
      metacritic: 92,
      playtime: 74,
      genres: [{ name: 'Action' }, { name: 'Adventure' }],
      platforms: [{ platform: { name: 'PC' } }, { platform: { name: 'PlayStation 5' } }],
      parent_platforms: [{ platform: { name: 'PC' } }]
    },
    {
      id: 4200,
      slug: 'portal-2',
      name: 'Portal 2',
      released: '2011-04-19',
      background_image: null,
      metacritic: null,
      genres: [{ name: 'Puzzle' }],
      platforms: [{ platform: { name: 'Linux' } }]
    },
    { id: 999, slug: null, name: '' }
  ]
}

describe('parseRawgSearch', () => {
  it('normalizza i risultati', () => {
    const results = parseRawgSearch(rawgSearchPayload)
    expect(results).toHaveLength(2)
    const [first, second] = results
    expect(first.title).toBe('Grand Theft Auto V')
    expect(first.genres).toEqual(['Action', 'Adventure'])
    expect(first.platforms).toEqual(['PC', 'PlayStation 5'])
    expect(first.releaseYear).toBe(2013)
    expect(first.metacritic).toBe(92)
    expect(first.playtimeHours).toBe(74)
    expect(first.externalUrl).toBe('https://rawg.io/games/grand-theft-auto-v')
    expect(first.provider).toBe('rawg')
    expect(second.coverUrl).toBeUndefined()
  })

  it('regge risposte vuote o malformate', () => {
    expect(parseRawgSearch(null)).toEqual([])
    expect(parseRawgSearch({})).toEqual([])
    expect(parseRawgSearch({ results: 'nope' })).toEqual([])
  })
})

describe('parseRawgDetails', () => {
  it('estrae descrizione, sviluppatori e publisher', () => {
    const details = parseRawgDetails({
      id: 4200,
      slug: 'portal-2',
      name: 'Portal 2',
      released: '2011-04-19',
      description_raw: '<p>Un puzzle game<br>molto intelligente</p>',
      metacritic: 95,
      genres: [{ name: 'Puzzle' }, { name: 'Platform' }],
      platforms: [{ platform: { name: 'PC' } }],
      developers: [{ name: 'Valve' }],
      publishers: [{ name: 'Valve' }],
      website: 'https://www.thinkwithportals.com'
    })
    expect(details?.description).toBe('Un puzzle game\nmolto intelligente')
    expect(details?.developers).toEqual(['Valve'])
    expect(details?.releaseDate).toBe('2011-04-19')
  })

  it('restituisce null senza nome', () => {
    expect(parseRawgDetails({ id: 1 })).toBeNull()
    expect(parseRawgDetails(null)).toBeNull()
  })
})

const steamSearchPayload = {
  total: 2,
  items: [
    {
      type: 'app',
      id: 620,
      name: 'Portal 2',
      tiny_image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/capsule_231x87.jpg',
      metascore: '95',
      platforms: { windows: true, mac: false, linux: true }
    },
    { type: 'sub', id: 999, name: 'Pacchetto Valve' },
    { type: 'app', id: 570, name: 'Dota 2', metascore: '', platforms: { windows: true } }
  ]
}

describe('parseSteamSearch', () => {
  it('tiene solo le app e normalizza le piattaforme', () => {
    const results = parseSteamSearch(steamSearchPayload)
    expect(results.map((entry) => entry.title)).toEqual(['Portal 2', 'Dota 2'])
    expect(results[0].platforms).toEqual(['PC', 'Linux'])
    expect(results[0].metacritic).toBe(95)
    expect(results[0].externalUrl).toBe('https://store.steampowered.com/app/620')
    expect(results[1].metacritic).toBeUndefined()
  })

  it('usa la copertina verticale del CDN', () => {
    expect(steamCoverUrl(620)).toContain('/steam/apps/620/library_600x900_2x.jpg')
  })

  it('regge risposte vuote', () => {
    expect(parseSteamSearch({})).toEqual([])
    expect(parseSteamSearch(null)).toEqual([])
  })
})

describe('parseSteamAppDetails', () => {
  const payload = {
    '620': {
      success: true,
      data: {
        name: 'Portal 2',
        steam_appid: 620,
        short_description: 'Puzzle game',
        detailed_description: '<strong>Portal 2</strong> è un puzzle game.<br>Con la coop!',
        header_image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg',
        website: 'https://www.thinkwithportals.com',
        developers: ['Valve'],
        publishers: ['Valve'],
        genres: [{ description: 'Action' }, { description: 'Adventure' }],
        release_date: { coming_soon: false, date: '19 Apr, 2011' },
        metacritic: { score: 95 },
        platforms: { windows: true, mac: true, linux: true }
      }
    }
  }

  it('normalizza i dettagli completi', () => {
    const details = parseSteamAppDetails(payload, '620')
    expect(details?.title).toBe('Portal 2')
    expect(details?.genres).toEqual(['Action', 'Adventure'])
    expect(details?.platforms).toEqual(['PC', 'macOS', 'Linux'])
    expect(details?.releaseYear).toBe(2011)
    expect(details?.metacritic).toBe(95)
    expect(details?.shortDescription).toBe('Puzzle game')
    expect(details?.description).toContain('puzzle game')
    expect(details?.description).not.toContain('<strong>')
    expect(details?.developers).toEqual(['Valve'])
  })

  it('restituisce null quando la richiesta fallisce', () => {
    expect(parseSteamAppDetails({ '620': { success: false } }, '620')).toBeNull()
    expect(parseSteamAppDetails({}, '620')).toBeNull()
    expect(parseSteamAppDetails(null, '620')).toBeNull()
  })
})
