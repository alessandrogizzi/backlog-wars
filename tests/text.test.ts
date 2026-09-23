import { describe, expect, it } from 'vitest'
import { mergeSearchResults, normalizeTitle, progressiveQueries, rankByTitle, titleSimilarity } from '@shared/text'
import { makeMetadata } from './factories'

describe('normalizeTitle', () => {
  it('toglie marchi, articoli, punteggiatura e rumore da edizione', () => {
    expect(normalizeTitle('The Witcher 3: Wild Hunt')).toBe('witcher 3 wild hunt')
    expect(normalizeTitle('Heroes of Might and Magic® III: Complete')).toBe('heroes of might and magic iii')
    expect(normalizeTitle('Celeste (Definitive Edition)')).toBe('celeste')
    expect(normalizeTitle('  Pokémon   Rosso  ')).toBe('pokemon rosso')
  })
})

describe('titleSimilarity', () => {
  it('dà 1 solo al titolo identico', () => {
    expect(titleSimilarity('Celeste', 'Celeste')).toBe(1)
    expect(titleSimilarity('celeste', 'CELESTE')).toBe(1)
  })

  it('premia i prefissi e le inclusioni', () => {
    expect(titleSimilarity('the witcher 3', 'The Witcher 3: Wild Hunt')).toBeGreaterThan(0.8)
    expect(titleSimilarity('chrono', 'Chrono Trigger')).toBeGreaterThan(0.8)
    expect(titleSimilarity('portal 2', 'Portal 2 Soundtrack')).toBeGreaterThan(0.8)
  })

  it('riconosce i titoli parziali con più parole', () => {
    expect(titleSimilarity('zelda ocarina', 'The Legend of Zelda: Ocarina of Time')).toBeGreaterThan(0.5)
  })

  it('scarta i falsi positivi della ricerca GOG', () => {
    expect(titleSimilarity('portal 2', 'Port Royale 2')).toBeLessThan(0.4)
    expect(titleSimilarity('portal 2', 'POSTAL 2')).toBeLessThan(0.4)
    expect(titleSimilarity('celeste', 'Elden Ring')).toBe(0)
  })
})

describe('rankByTitle', () => {
  it('ordina per somiglianza e rimuove il rumore', () => {
    const results = [
      makeMetadata({ title: 'Port Royale 2' }),
      makeMetadata({ title: 'Portal 2' }),
      makeMetadata({ title: 'Portal 2 Soundtrack' })
    ]
    const ranked = rankByTitle(results, 'portal 2').map((entry) => entry.title)
    expect(ranked[0]).toBe('Portal 2')
    expect(ranked).toContain('Portal 2 Soundtrack')
    expect(ranked).not.toContain('Port Royale 2')
  })

  it('restituisce un elenco vuoto se non c\'è nulla di sensato', () => {
    expect(rankByTitle([makeMetadata({ title: 'Elden Ring' })], 'celeste')).toEqual([])
  })
})

describe('progressiveQueries', () => {
  it('propone la frase completa e versioni più corte', () => {
    expect(progressiveQueries('The Witcher 3: Wild Hunt')).toEqual([
      'The Witcher 3: Wild Hunt',
      'Witcher 3: Wild Hunt',
      'Witcher 3: Wild',
      'Witcher 3:'
    ])
  })

  it('gestisce query corte o vuote', () => {
    expect(progressiveQueries('Celeste')).toEqual(['Celeste'])
    expect(progressiveQueries('   ')).toEqual([])
  })
})

describe('mergeSearchResults', () => {
  const hltb = makeMetadata({
    provider: 'hltb',
    providerId: '10270',
    title: 'The Witcher 3: Wild Hunt',
    platforms: ['PC', 'PlayStation 4', 'Xbox One'],
    releaseYear: 2015,
    durations: { main: 3060, hltbId: 10270 }
  })
  const steam = makeMetadata({
    provider: 'steam',
    providerId: '292030',
    title: 'The Witcher 3: Wild Hunt',
    platforms: ['PC'],
    releaseYear: 2015
  })

  it('aggancia le durate HLTB al risultato di un\'altra fonte', () => {
    const merged = mergeSearchResults([steam, hltb], 'the witcher 3')
    expect(merged).toHaveLength(1)
    expect(merged[0].provider).toBe('steam')
    expect(merged[0].durations?.main).toBe(3060)
    // HLTB platforms enrich the known ones (useful for console and retro)
    expect(merged[0].platforms).toEqual(['PC', 'PlayStation 4', 'Xbox One'])
  })

  it('tiene i giochi presenti solo su HowLongToBeat (tipicamente console/retro)', () => {
    const chrono = makeMetadata({
      provider: 'hltb',
      providerId: '1705',
      title: 'Chrono Trigger',
      platforms: ['Super Nintendo'],
      durations: { main: 1380 }
    })
    const merged = mergeSearchResults([chrono], 'chrono trigger')
    expect(merged).toHaveLength(1)
    expect(merged[0].platforms).toContain('Super Nintendo')
    expect(merged[0].durations?.main).toBe(1380)
  })

  it('ordina per somiglianza e limita i risultati', () => {
    const merged = mergeSearchResults(
      [
        makeMetadata({ title: 'Celeste' }),
        makeMetadata({ title: 'Celeste Classic' }),
        makeMetadata({ title: 'Celeste 64' }),
        makeMetadata({ title: 'Elden Ring' })
      ],
      'celeste',
      { limit: 2 }
    )
    expect(merged).toHaveLength(2)
    expect(merged[0].title).toBe('Celeste')
  })
})
