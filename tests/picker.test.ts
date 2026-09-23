import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PICK_FILTERS,
  bracketSizes,
  buildBracket,
  buildPool,
  championOf,
  describeFilters,
  effortFit,
  mulberry32,
  noveltyScore,
  passesFilters,
  pickWinner,
  pleasureScore,
  priorityScore,
  scoreGame,
  shuffle,
  uniformPick,
  weightedPick,
  type PickFilters,
  type ScoredGame
} from '@renderer/logic/picker'
import type { GameStatus } from '@shared/catalog'
import type { PickWeights } from '@shared/types'
import { makeGame } from './factories'

const WEIGHTS: PickWeights = { effort: 45, pleasure: 30, priority: 15, novelty: 10, duration: 0 }
const NOW = Date.parse('2024-06-01T12:00:00')

describe('effortFit', () => {
  it('premia i giochi compatibili con l\'energia disponibile', () => {
    expect(effortFit(makeGame({ effortEstimate: 2 }), 2)).toBe(1)
    expect(effortFit(makeGame({ effortEstimate: 5 }), 2)).toBeLessThan(0.5)
  })

  it('penalizza poco i giochi più leggeri del necessario', () => {
    expect(effortFit(makeGame({ effortEstimate: 1 }), 5)).toBeGreaterThanOrEqual(0.8)
  })

  it('non esce mai dall\'intervallo 0-1', () => {
    for (let effort = 1; effort <= 5; effort += 1) {
      for (let target = 1; target <= 5; target += 1) {
        const value = effortFit(makeGame({ effortEstimate: effort }), target)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('pleasureScore', () => {
  it('usa il piacere dichiarato finché non ci sono sessioni', () => {
    expect(pleasureScore(makeGame({ pleasure: 5 }))).toBe(1)
    expect(pleasureScore(makeGame({ pleasure: 1 }))).toBeCloseTo(0.2)
  })

  it('si fida della soddisfazione reale dopo 3 sessioni', () => {
    const game = makeGame({ pleasure: 5, sessionCount: 3, avgSatisfaction: 2 })
    expect(pleasureScore(game)).toBeCloseTo(0.4, 5)
  })

  it('mescola dichiarato e osservato con poche sessioni', () => {
    const game = makeGame({ pleasure: 4, sessionCount: 1, avgSatisfaction: 1 })
    const score = pleasureScore(game)
    expect(score).toBeLessThan(0.8)
    expect(score).toBeGreaterThan(0.2)
  })
})

describe('noveltyScore', () => {
  it('è massimo per i giochi mai giocati', () => {
    expect(noveltyScore(makeGame({ lastPlayedAt: null }), NOW)).toBe(1)
  })

  it('cresce con il tempo passato dall\'ultima sessione', () => {
    const recent = noveltyScore(makeGame({ lastPlayedAt: NOW - 5 * 86_400_000 }), NOW)
    const old = noveltyScore(makeGame({ lastPlayedAt: NOW - 60 * 86_400_000 }), NOW)
    expect(old).toBeGreaterThan(recent)
    expect(old).toBeLessThanOrEqual(1)
  })
})

describe('priorityScore', () => {
  it('aggiunge un bonus ai preferiti', () => {
    expect(priorityScore(makeGame({ priority: 3, favorite: 1 }))).toBeGreaterThan(
      priorityScore(makeGame({ priority: 3, favorite: 0 }))
    )
  })
})

describe('passesFilters', () => {
  const filters: PickFilters = { ...DEFAULT_PICK_FILTERS, statuses: ['backlog'] }

  it('filtra per stato', () => {
    expect(passesFilters(makeGame({ status: 'backlog' }), filters, NOW)).toBe(true)
    expect(passesFilters(makeGame({ status: 'completed' }), filters, NOW)).toBe(false)
  })

  it('filtra per effort massimo', () => {
    expect(passesFilters(makeGame({ effortEstimate: 4 }), { ...filters, maxEffort: 3 }, NOW)).toBe(false)
    expect(passesFilters(makeGame({ effortEstimate: 3 }), { ...filters, maxEffort: 3 }, NOW)).toBe(true)
  })

  it('filtra per piacere minimo usando la soddisfazione reale', () => {
    const game = makeGame({ pleasure: 5, sessionCount: 3, avgSatisfaction: 1 })
    expect(passesFilters(game, { ...filters, minPleasure: 3 }, NOW)).toBe(false)
  })

  it('filtra per piattaforma e genere', () => {
    const game = makeGame({ platform: 'PC', genres: ['RPG'] })
    expect(passesFilters(game, { ...filters, platform: 'PC' }, NOW)).toBe(true)
    expect(passesFilters(game, { ...filters, platform: 'Nintendo Switch' }, NOW)).toBe(false)
    expect(passesFilters(game, { ...filters, genre: 'RPG' }, NOW)).toBe(true)
    expect(passesFilters(game, { ...filters, genre: 'Puzzle' }, NOW)).toBe(false)
  })

  it('esclude i giochi giocati di recente quando richiesto', () => {
    const game = makeGame({ lastPlayedAt: NOW - 2 * 86_400_000 })
    expect(passesFilters(game, { ...filters, avoidRecentDays: 7 }, NOW)).toBe(false)
    expect(passesFilters(game, { ...filters, avoidRecentDays: 1 }, NOW)).toBe(true)
  })

  it('può limitare ai soli mai giocati e ai preferiti', () => {
    const played = makeGame({ sessionCount: 2 })
    expect(passesFilters(played, { ...filters, onlyNeverPlayed: true }, NOW)).toBe(false)
    expect(passesFilters(makeGame({ favorite: 0 }), { ...filters, onlyFavorites: true }, NOW)).toBe(false)
    expect(passesFilters(makeGame({ favorite: 1 }), { ...filters, onlyFavorites: true }, NOW)).toBe(true)
  })
})

describe('buildPool', () => {
  it('ordina i candidati per punteggio decrescente ed esclude chi non passa i filtri', () => {
    const games = [
      makeGame({ id: 1, title: 'Perfetto', effortEstimate: 2, pleasure: 5, priority: 5 }),
      makeGame({ id: 2, title: 'Pesante', effortEstimate: 5, pleasure: 1, priority: 1 }),
      makeGame({ id: 3, title: 'Fuori', status: 'completed' })
    ]
    const pool = buildPool(games, { ...DEFAULT_PICK_FILTERS, statuses: ['backlog'], targetEffort: 2 }, WEIGHTS, NOW)
    expect(pool.map((entry) => entry.game.title)).toEqual(['Perfetto', 'Pesante'])
    expect(pool[0].score).toBeGreaterThan(pool[1].score)
  })

  it('restituisce un pool vuoto se nessun gioco è idoneo', () => {
    const pool = buildPool([makeGame({ effortEstimate: 5 })], { ...DEFAULT_PICK_FILTERS, maxEffort: 1 }, WEIGHTS, NOW)
    expect(pool).toHaveLength(0)
  })
})

describe('estrazioni', () => {
  const pool = buildPool(
    [
      makeGame({ id: 1, title: 'A', effortEstimate: 2, pleasure: 5, priority: 5 }),
      makeGame({ id: 2, title: 'B', effortEstimate: 4, pleasure: 2, priority: 2 })
    ],
    { ...DEFAULT_PICK_FILTERS, statuses: ['backlog'], targetEffort: 2 },
    WEIGHTS,
    NOW
  )

  it('weightedPick restituisce solo giochi del pool ed è deterministico con lo stesso seed', () => {
    const first = weightedPick(pool, mulberry32(123))
    const second = weightedPick(pool, mulberry32(123))
    expect(first?.game.id).toBe(second?.game.id)
    expect(pool.map((entry) => entry.game.id)).toContain(first?.game.id)
  })

  it('weightedPick favorisce i punteggi alti ma lascia sempre una possibilità', () => {
    const rng = mulberry32(99)
    const counts = new Map<number, number>()
    for (let index = 0; index < 2000; index += 1) {
      const picked = weightedPick(pool, rng)
      counts.set(picked!.game.id!, (counts.get(picked!.game.id!) ?? 0) + 1)
    }
    expect(counts.get(1)!).toBeGreaterThan(counts.get(2)!)
  })

  it('il peso minimo evita che un gioco a punteggio zero sia escluso a priori', () => {
    const zero: ScoredGame = { game: makeGame({ id: 10 }), score: 0, breakdown: { effort: 0, pleasure: 0, priority: 0, novelty: 0, duration: 0 } }
    const top: ScoredGame = { game: makeGame({ id: 11 }), score: 100, breakdown: { effort: 1, pleasure: 1, priority: 1, novelty: 1, duration: 1 } }
    const rng = mulberry32(5)
    let zeroPicks = 0
    for (let index = 0; index < 3000; index += 1) {
      if (weightedPick([zero, top], rng)?.game.id === 10) zeroPicks += 1
    }
    expect(zeroPicks).toBeGreaterThan(0)
  })

  it('uniformPick copre tutti i giochi del pool', () => {
    const rng = mulberry32(7)
    const seen = new Set<number>()
    for (let index = 0; index < 200; index += 1) seen.add(uniformPick(pool, rng)!.game.id!)
    expect(seen.size).toBe(2)
  })

  it('gestisce i pool vuoti', () => {
    expect(weightedPick([], mulberry32(1))).toBeNull()
    expect(uniformPick([], mulberry32(1))).toBeNull()
  })
})

describe('torneo', () => {
  const pool = buildPool(
    [1, 2, 3, 4].map((id) => makeGame({ id, title: `G${id}` })),
    { ...DEFAULT_PICK_FILTERS, statuses: ['backlog'] },
    WEIGHTS,
    NOW
  )

  it('costruisce un tabellone con i turni corretti', () => {
    const bracket = buildBracket(pool, 4, mulberry32(3))
    expect(bracket.rounds).toHaveLength(2)
    expect(bracket.rounds[0]).toHaveLength(2)
    expect(bracket.rounds[1]).toHaveLength(1)
    expect(bracket.rounds[0].every((match) => match.a && match.b)).toBe(true)
  })

  it('fa avanzare i vincitori fino al campione', () => {
    let bracket = buildBracket(pool, 4, mulberry32(11))
    for (const match of bracket.rounds[0]) {
      bracket = pickWinner(bracket, match.id, match.a!.id!)
    }
    const final = bracket.rounds[1][0]
    expect(final.a?.id).toBe(bracket.rounds[0][0].a?.id)
    expect(final.b?.id).toBe(bracket.rounds[0][1].a?.id)
    bracket = pickWinner(bracket, final.id, final.b!.id!)
    expect(championOf(bracket)?.id).toBe(bracket.rounds[0][1].a?.id)
  })

  it('ignora un vincitore che non fa parte del match', () => {
    const bracket = buildBracket(pool, 4, mulberry32(21))
    const match = bracket.rounds[0][0]
    const outsider = pool.find((entry) => entry.game.id !== match.a?.id && entry.game.id !== match.b?.id)!
    const next = pickWinner(bracket, match.id, outsider.game.id!)
    expect(next.rounds[0][0].winner).toBeNull()
    expect(championOf(next)).toBeNull()
  })

  it('gestisce i turni di riposo con un numero di giochi non potenza di due', () => {
    const three = buildPool(
      [1, 2, 3].map((id) => makeGame({ id, title: `T${id}` })),
      { ...DEFAULT_PICK_FILTERS, statuses: ['backlog'] },
      WEIGHTS,
      NOW
    )
    const bracket = buildBracket(three, 4, mulberry32(4))
    const advanced = bracket.rounds[1].filter((match) => match.a || match.b)
    expect(advanced.length).toBeGreaterThan(0)
    expect(bracket.rounds[0].some((match) => match.winner !== null)).toBe(true)
  })

  it('espone le dimensioni supportate', () => {
    expect(bracketSizes()).toEqual([4, 8, 16])
  })
})

describe('utility', () => {
  it('shuffle è deterministico con lo stesso seed', () => {
    const items = [1, 2, 3, 4, 5, 6]
    expect(shuffle(items, mulberry32(1))).toEqual(shuffle(items, mulberry32(1)))
    expect([...shuffle(items, mulberry32(1))].sort()).toEqual(items)
  })

  it('mulberry32 resta nell\'intervallo [0,1)', () => {
    const rng = mulberry32(123)
    for (let index = 0; index < 1000; index += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('describeFilters riassume i filtri attivi', () => {
    const text = describeFilters({ ...DEFAULT_PICK_FILTERS, platform: 'PC', minPleasure: 3, avoidRecentDays: 7 })
    expect(text).toContain('PC')
    expect(text).toContain('pleasure>=3')
    expect(text).toContain('avoid-last=7d')
  })
})

describe('durata e tempo disponibile', () => {
  const base = { ...DEFAULT_PICK_FILTERS, statuses: ['backlog'] as const }
  const durationWeights: PickWeights = { effort: 0, pleasure: 0, priority: 0, novelty: 0, duration: 100 }

  it('esclude i giochi più lunghi della durata massima accettata', () => {
    const filters = { ...base, statuses: ['backlog'] as GameStatus[], maxHours: 10 }
    expect(passesFilters(makeGame({ durationMain: 8 * 60 }), filters, NOW)).toBe(true)
    expect(passesFilters(makeGame({ durationMain: 40 * 60 }), filters, NOW)).toBe(false)
  })

  it('lascia passare i giochi senza durata nota quando imposto un limite', () => {
    const filters = { ...base, statuses: ['backlog'] as GameStatus[], maxHours: 5 }
    expect(passesFilters(makeGame(), filters, NOW)).toBe(true)
  })

  it('premia i giochi che stanno nel tempo che ho a disposizione', () => {
    const filters = { ...base, statuses: ['backlog'] as GameStatus[], timeAvailableHours: 2 }
    const short = scoreGame(makeGame({ id: 1, durationMain: 90 }), filters, durationWeights, NOW)
    const long = scoreGame(makeGame({ id: 2, durationMain: 20 * 60 }), filters, durationWeights, NOW)
    expect(short.score).toBeGreaterThan(long.score)
    expect(short.breakdown.duration).toBe(1)
    expect(long.breakdown.duration).toBeLessThan(0.2)
  })

  it('resta neutro per i giochi senza durata', () => {
    const filters = { ...base, statuses: ['backlog'] as GameStatus[], timeAvailableHours: 2 }
    const unknown = scoreGame(makeGame(), filters, durationWeights, NOW)
    expect(unknown.breakdown.duration).toBe(0.5)
    expect(unknown.score).toBe(50)
  })

  it('considera quanto manca, non solo la durata totale', () => {
    const filters = { ...base, statuses: ['backlog'] as GameStatus[], timeAvailableHours: 2 }
    const almostDone = scoreGame(makeGame({ durationMain: 10 * 60, totalMinutes: 9.5 * 60 }), filters, durationWeights, NOW)
    const justStarted = scoreGame(makeGame({ durationMain: 10 * 60, totalMinutes: 30 }), filters, durationWeights, NOW)
    expect(almostDone.score).toBeGreaterThan(justStarted.score)
  })

  it('filtra per gruppo di piattaforma, retrogaming incluso', () => {
    const filters = { ...base, statuses: ['backlog'] as GameStatus[], groups: ['retro' as const] }
    expect(passesFilters(makeGame({ platform: 'Super Nintendo' }), filters, NOW)).toBe(true)
    expect(passesFilters(makeGame({ platform: 'DOS' }), filters, NOW)).toBe(true)
    expect(passesFilters(makeGame({ platform: 'PC' }), filters, NOW)).toBe(false)
    expect(passesFilters(makeGame({ platform: 'PlayStation 5' }), filters, NOW)).toBe(false)
  })

  it('riassume durata e tempo nei filtri salvati', () => {
    const text = describeFilters({ ...base, statuses: ['backlog'] as GameStatus[], maxHours: 12, timeAvailableHours: 3 })
    expect(text).toContain('max-hours=12')
    expect(text).toContain('available=3h')
  })
})
