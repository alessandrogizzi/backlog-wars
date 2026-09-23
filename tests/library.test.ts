import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LIBRARY_FILTERS,
  GOOD_METASCORE,
  averageMetacritic,
  filterAndSortGames,
  gamesMissingMetacritic,
  matchesLibraryFilters,
  type LibraryFilters
} from '@renderer/logic/library'
import { makeGame } from './factories'

const base: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS }

const games = [
  makeGame({ id: 1, title: 'Disco Elysium', platform: 'PC', metacritic: 97, mustPlay: 1 }),
  makeGame({ id: 2, title: 'Hades', platform: 'PC', metacritic: 93, favorite: 1 }),
  makeGame({ id: 3, title: 'Chrono Trigger', platform: 'Super Nintendo', metacritic: undefined }),
  makeGame({ id: 4, title: 'Heroes of Might and Magic III', platform: 'DOS', metacritic: 65 }),
  makeGame({ id: 5, title: 'Castlevania', platform: 'PlayStation', metacritic: 0 })
]

describe('ordinamento per Metascore', () => {
  it('ordina dal punteggio più alto al più basso', () => {
    const sorted = filterAndSortGames(games, { ...base, sort: 'metacritic' })
    // 0 and undefined both mean "no score": they end up at the bottom.
    expect(sorted.map((game) => game.metacritic)).toEqual([97, 93, 65, 0, undefined])
  })

  it('mette in fondo i giochi senza voto', () => {
    const sorted = filterAndSortGames(games, { ...base, sort: 'metacritic' })
    expect(sorted.slice(0, 3).map((game) => game.title)).toEqual([
      'Disco Elysium',
      'Hades',
      'Heroes of Might and Magic III'
    ])
    expect(sorted.slice(3).every((game) => (game.metacritic ?? 0) <= 0)).toBe(true)
  })

  it('non modifica l\'elenco originale', () => {
    const original = [...games]
    filterAndSortGames(games, { ...base, sort: 'metacritic' })
    expect(games).toEqual(original)
  })
})

describe('filtro rapido sul Metascore', () => {
  it('"good" tiene solo i giochi ben recensiti', () => {
    const filtered = filterAndSortGames(games, { ...base, metacritic: 'good', sort: 'metacritic' })
    expect(filtered.map((game) => game.title)).toEqual(['Disco Elysium', 'Hades'])
    expect(filtered.every((game) => (game.metacritic ?? 0) >= GOOD_METASCORE)).toBe(true)
  })

  it('"missing" trova i giochi da arricchire', () => {
    const filtered = filterAndSortGames(games, { ...base, metacritic: 'missing' })
    expect(filtered.map((game) => game.title)).toEqual(['Chrono Trigger', 'Castlevania'])
  })

  it('"all" non filtra nulla', () => {
    expect(filterAndSortGames(games, base)).toHaveLength(games.length)
  })
})

describe('altri filtri', () => {
  it('cerca nel titolo, nei generi e nei tag', () => {
    const withTags = makeGame({ id: 9, title: 'Stardew Valley', tags: ['serale'], genres: ['Simulazione'] })
    expect(matchesLibraryFilters(withTags, { ...base, search: 'serale' })).toBe(true)
    expect(matchesLibraryFilters(withTags, { ...base, search: 'simulazione' })).toBe(true)
    expect(matchesLibraryFilters(withTags, { ...base, search: 'zelda' })).toBe(false)
  })

  it('filtra per gruppo di piattaforma', () => {
    const retro = filterAndSortGames(games, { ...base, groups: ['retro'] })
    expect(retro.map((game) => game.title)).toEqual([
      'Chrono Trigger',
      'Heroes of Might and Magic III',
      'Castlevania'
    ])
    const pc = filterAndSortGames(games, { ...base, groups: ['pc'] })
    expect(pc.map((game) => game.title)).toEqual(['Disco Elysium', 'Hades'])
  })

  it('combina ricerca, stato e preferiti', () => {
    const target = makeGame({ id: 10, title: 'Celeste', status: 'completed', favorite: 1 })
    const filters: LibraryFilters = { ...base, search: 'cele', statuses: ['completed'], onlyFavorites: true }
    expect(matchesLibraryFilters(target, filters)).toBe(true)
    expect(matchesLibraryFilters(target, { ...filters, statuses: ['backlog'] })).toBe(false)
    expect(matchesLibraryFilters(target, { ...filters, onlyFavorites: false })).toBe(true)
  })
})

describe('Metascore medio e giochi da arricchire', () => {
  it('calcola la media ignorando chi non ha voto', () => {
    expect(averageMetacritic(games)).toBe(Math.round((97 + 93 + 65) / 3))
    expect(averageMetacritic([makeGame({ metacritic: undefined })])).toBeNull()
  })

  it('seleziona i giochi senza Metascore, dal più recente', () => {
    const withDates = [
      makeGame({ id: 1, title: 'Vecchio', addedAt: 100 }),
      makeGame({ id: 2, title: 'Nuovo', addedAt: 900 }),
      makeGame({ id: 3, title: 'Con voto', metacritic: 80, addedAt: 500 })
    ]
    const missing = gamesMissingMetacritic(withDates)
    expect(missing.map((game) => game.title)).toEqual(['Nuovo', 'Vecchio'])
    expect(gamesMissingMetacritic(withDates, 1).map((game) => game.title)).toEqual(['Nuovo'])
  })
})

describe('ordinamento per tempo con ore dichiarate', () => {
  it('usa il tempo effettivo (sessioni + ore dichiarate)', () => {
    const list = [
      makeGame({ id: 1, title: 'Tracciato', totalMinutes: 600, addedAt: 1 }),
      makeGame({ id: 2, title: 'Ripreso da tempo', totalMinutes: 0, playedBeforeMinutes: 2100, addedAt: 2 })
    ]
    const sorted = filterAndSortGames(list, { ...base, sort: 'time' })
    expect(sorted.map((game) => game.title)).toEqual(['Ripreso da tempo', 'Tracciato'])
  })
})
