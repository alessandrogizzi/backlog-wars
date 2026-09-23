/**
 * Parsers for the new sources (HowLongToBeat, GOG, GOGDB).
 * The fixtures are real API responses, trimmed to the essentials.
 */
import { describe, expect, it } from 'vitest'
import {
  GOG_IMAGE_FORMATTER,
  HLTB_IMAGE_BASE,
  parseGogSearch,
  parseGogdbProduct,
  parseHltbSearch,
  parseMetacriticDetails,
  parseMetacriticSearch,
  secondsToMinutes
} from '@main/providers/parse'

const hltbPayload = {
  count: 6,
  pageCurrent: 1,
  data: [
    {
      game_id: 7231,
      game_name: 'Portal 2',
      game_image: 'Portal2cover.jpg',
      comp_main: 30889,
      comp_plus: 49546,
      comp_100: 82594,
      comp_all: 38261,
      profile_platform: 'Linux, Mac, Nintendo Switch, PC, PlayStation 3, Xbox 360',
      release_world: 2011,
      review_score: 90
    },
    {
      game_id: 1705,
      game_name: 'Chrono Trigger',
      game_image: '1705_Chrono_Trigger.jpg',
      comp_main: 82837,
      comp_plus: 95847,
      comp_100: 0,
      comp_all: 95148,
      profile_platform: 'Mobile, Nintendo DS, PC, PlayStation, Super Nintendo',
      release_world: 1995
    },
    { game_id: 0, game_name: '' }
  ]
}

describe('parseHltbSearch', () => {
  it('converte secondi in minuti e normalizza piattaforme e immagini', () => {
    const results = parseHltbSearch(hltbPayload)
    expect(results).toHaveLength(2)
    const [portal, chrono] = results
    expect(portal.title).toBe('Portal 2')
    expect(portal.provider).toBe('hltb')
    expect(portal.providerId).toBe('7231')
    expect(portal.coverUrl).toBe(`${HLTB_IMAGE_BASE}Portal2cover.jpg`)
    expect(portal.externalUrl).toBe('https://howlongtobeat.com/game/7231')
    expect(portal.releaseYear).toBe(2011)
    expect(portal.durations?.main).toBe(515)
    expect(portal.durations?.mainExtra).toBe(826)
    expect(portal.durations?.completionist).toBe(1377)
    expect(portal.durations?.allStyles).toBe(638)
    expect(portal.platforms).toEqual([
      'Linux',
      'macOS',
      'Nintendo Switch',
      'PC',
      'PlayStation 3',
      'Xbox 360'
    ])
    expect(chrono.platforms).toContain('Super Nintendo')
    expect(chrono.durations?.completionist).toBeUndefined()
  })

  it('regge risposte vuote o malformate', () => {
    expect(parseHltbSearch(null)).toEqual([])
    expect(parseHltbSearch({})).toEqual([])
    expect(parseHltbSearch({ data: 'nope' })).toEqual([])
  })
})

describe('secondsToMinutes', () => {
  it('ignora valori non positivi', () => {
    expect(secondsToMinutes(3600)).toBe(60)
    expect(secondsToMinutes(0)).toBeUndefined()
    expect(secondsToMinutes(undefined)).toBeUndefined()
    expect(secondsToMinutes(-10)).toBeUndefined()
  })
})

const gogPayload = {
  pages: 64,
  productCount: 127,
  products: [
    {
      id: '1207658787',
      slug: 'heroes_of_might_and_magic_3_complete_edition',
      title: 'Heroes of Might and Magic® 3: Complete Edition',
      coverVertical: `https://images.gog-statics.com/869b56a1048405d97f48358ea537af2c08c9d8cd508f8e4a82883bf8eafad361.jpg`,
      coverHorizontal: 'https://images.gog-statics.com/abc_{formatter}.jpg',
      developers: ['New World Computing, Inc.'],
      publishers: ['Ubisoft'],
      operatingSystems: ['windows'],
      releaseDate: '1999.06.01',
      genres: [{ name: 'Strategy', slug: 'strategy' }, { name: 'Turn-based', slug: 'turnbased' }],
      tags: [{ name: 'Fantasy' }, { name: 'Classic' }],
      storeLink: 'https://www.gog.com/en/game/heroes_of_might_and_magic_3_complete_edition'
    },
    { id: '999', title: '' }
  ]
}

describe('parseGogSearch', () => {
  it('normalizza i prodotti GOG', () => {
    const results = parseGogSearch(gogPayload)
    expect(results).toHaveLength(1)
    const [game] = results
    expect(game.provider).toBe('gog')
    expect(game.providerId).toBe('1207658787')
    expect(game.title).toContain('Heroes of Might and Magic')
    expect(game.platforms).toEqual(['PC'])
    expect(game.genres).toContain('Strategy')
    expect(game.genres).toContain('Tactical')
    expect(game.genres).toContain('Retro')
    expect(game.releaseDate).toBe('1999-06-01')
    expect(game.releaseYear).toBe(1999)
    expect(game.developers).toEqual(['New World Computing, Inc.'])
    expect(game.externalUrl).toContain('gog.com')
  })

  it('sostituisce il segnaposto {formatter} delle immagini', () => {
    const results = parseGogSearch({
      products: [{ id: '1', title: 'Test', coverVertical: 'https://images.gog-statics.com/x_{formatter}.jpg' }]
    })
    expect(results[0].coverUrl).toContain(GOG_IMAGE_FORMATTER)
    expect(results[0].coverUrl).not.toContain('{formatter}')
  })

  it('regge risposte vuote', () => {
    expect(parseGogSearch(null)).toEqual([])
    expect(parseGogSearch({ products: null })).toEqual([])
  })
})

const gogdbPayload = {
  id: 1207658787,
  title: 'Heroes of Might and Magic® 3: Complete',
  slug: 'heroes_of_might_and_magic_3_complete',
  description: '<p>Un classico della strategia a turni.<br>Con due espansioni.</p>',
  developers: ['New World Computing, Inc.'],
  publishers: ['Ubisoft'],
  global_date: '1999-06-01T00:00:00+02:00',
  store_date: null,
  image_boxart: '869b56a1048405d97f48358ea537af2c08c9d8cd508f8e4a82883bf8eafad361',
  image_background: 'cd47dd7a5938c4db4f9cd161746a362ec72c07a0f9bd253d423ad5af5f87a988',
  is_using_dosbox: false,
  builds: [
    { date_published: '2015-01-09T10:58:57+00:00', os: 'windows' },
    { date_published: '2024-10-16T12:00:00+00:00', os: 'windows' },
    { date_published: '2024-10-16T12:00:00+00:00', os: 'linux' }
  ],
  tags: [{ name: 'Strategy' }, { name: 'Turn-based' }],
  series: { id: 42, name: 'Heroes of Might & Magic' },
  type: 'game',
  link_store: 'https://www.gog.com/en/game/heroes_of_might_and_magic_3_complete_edition'
}

describe('parseGogdbProduct', () => {
  it('estrae descrizione, build e metadati', () => {
    const info = parseGogdbProduct(gogdbPayload)
    expect(info).not.toBeNull()
    expect(info?.id).toBe(1207658787)
    expect(info?.title).toContain('Heroes of Might and Magic')
    expect(info?.description).toBe('Un classico della strategia a turni.\nCon due espansioni.')
    expect(info?.description).not.toContain('<p>')
    expect(info?.buildCount).toBe(3)
    expect(info?.lastBuildAt).toBe('2024-10-16')
    expect(info?.buildSystems).toEqual(['windows', 'linux'])
    expect(info?.usesDosbox).toBe(false)
    expect(info?.boxartUrl).toBe(
      'https://images.gog-statics.com/869b56a1048405d97f48358ea537af2c08c9d8cd508f8e4a82883bf8eafad361.jpg'
    )
    expect(info?.releaseDate).toBe('1999-06-01')
    expect(info?.series).toBe('Heroes of Might & Magic')
    expect(info?.gogdbUrl).toBe('https://www.gogdb.org/product/1207658787')
  })

  it('riconosce i giochi DOS', () => {
    const dos = parseGogdbProduct({ ...gogdbPayload, is_using_dosbox: true, image_boxart: null, builds: [] })
    expect(dos?.usesDosbox).toBe(true)
    expect(dos?.buildCount).toBe(0)
    expect(dos?.lastBuildAt).toBeUndefined()
    expect(dos?.boxartUrl).toBeUndefined()
  })

  it('restituisce null senza id o titolo', () => {
    expect(parseGogdbProduct(null)).toBeNull()
    expect(parseGogdbProduct({ title: 'Senza id' })).toBeNull()
    expect(parseGogdbProduct({ id: 1 })).toBeNull()
  })
})

/* ------------------------------ Metacritic ------------------------------ */

const metacriticSearchPayload = {
  data: {
    totalResults: 22030,
    items: [
      {
        id: 1300071258,
        type: 'game-title',
        typeId: 13,
        title: 'Portal 2',
        slug: 'portal-2',
        premiereYear: 2011,
        mustPlay: true,
        criticScoreSummary: { url: '/game/portal-2/critic-reviews/', score: 95, reviewCount: 66, sentiment: 'Universal acclaim' },
        genres: [{ name: 'FPS' }],
        platforms: [{ name: 'Xbox 360' }, { name: 'PC' }, { name: 'PlayStation 3' }]
      },
      {
        id: 1300000001,
        type: 'game-title',
        typeId: 13,
        title: 'Grand Emprise 2: Portals Apart',
        slug: 'grand-emprise-2',
        premiereYear: null,
        criticScoreSummary: { url: '/game/grand-emprise-2/critic-reviews/', score: 0 },
        platforms: []
      },
      { id: 999, type: 'movie-title', typeId: 1, title: 'Portal: il film' }
    ]
  }
}

describe('parseMetacriticSearch', () => {
  it('estrae Metascore, scheda, piattaforme e badge Must Play', () => {
    const results = parseMetacriticSearch(metacriticSearchPayload)
    expect(results).toHaveLength(2)
    const [portal, noScore] = results
    expect(portal.title).toBe('Portal 2')
    expect(portal.slug).toBe('portal-2')
    expect(portal.year).toBe(2011)
    expect(portal.score).toBe(95)
    expect(portal.reviewCount).toBe(66)
    expect(portal.sentiment).toBe('Universal acclaim')
    expect(portal.mustPlay).toBe(true)
    expect(portal.url).toBe('https://www.metacritic.com/game/portal-2/critic-reviews/')
    expect(portal.platforms).toEqual(['Xbox 360', 'PC', 'PlayStation 3'])
    // Metacritic uses 0 for "no score": it must not become a score
    expect(noScore.score).toBeUndefined()
  })

  it('ignora film e serie TV', () => {
    expect(parseMetacriticSearch(metacriticSearchPayload).map((entry) => entry.title)).not.toContain('Portal: il film')
  })

  it('regge risposte vuote o malformate', () => {
    expect(parseMetacriticSearch(null)).toEqual([])
    expect(parseMetacriticSearch({})).toEqual([])
    expect(parseMetacriticSearch({ data: { items: 'nope' } })).toEqual([])
  })
})

const metacriticDetailPayload = {
  data: {
    item: {
      id: 1300071258,
      type: 'game-title',
      title: 'Portal 2',
      slug: 'portal-2',
      premiereYear: 2011,
      mustPlay: true,
      description: '<p>Valve torna con un puzzle game.<br>Con la coop.</p>',
      criticScoreSummary: {
        url: '/game/portal-2/critic-reviews/',
        score: 95,
        reviewCount: 66,
        positiveCount: 65,
        neutralCount: 1,
        negativeCount: 0,
        sentiment: 'Universal acclaim'
      },
      platforms: [
        {
          name: 'PC',
          releaseDate: '2011-04-18',
          criticScoreSummary: { url: '/game/portal-2/critic-reviews/?platform=pc', score: 95, reviewCount: 52 }
        },
        {
          name: 'Xbox 360',
          releaseDate: '2011-04-19',
          criticScoreSummary: { score: 95, reviewCount: 66 }
        },
        { name: 'Ouya', criticScoreSummary: { score: 0 } }
      ]
    }
  }
}

describe('parseMetacriticDetails', () => {
  it('estrae i punteggi per piattaforma e il conteggio delle recensioni', () => {
    const details = parseMetacriticDetails(metacriticDetailPayload)
    expect(details).not.toBeNull()
    expect(details?.score).toBe(95)
    expect(details?.mustPlay).toBe(true)
    expect(details?.positiveCount).toBe(65)
    expect(details?.negativeCount).toBe(0)
    expect(details?.description).toBe('Valve torna con un puzzle game.\nCon la coop.')
    // "Ouya" has no score and is not in the vocabulary: it is discarded.
    expect(details?.platformScores).toEqual([
      { platform: 'PC', score: 95, reviewCount: 52, releaseDate: '2011-04-18' },
      { platform: 'Xbox 360', score: 95, reviewCount: 66, releaseDate: '2011-04-19' }
    ])
  })

  it('restituisce null senza dati utili', () => {
    expect(parseMetacriticDetails(null)).toBeNull()
    expect(parseMetacriticDetails({ data: {} })).toBeNull()
  })
})
