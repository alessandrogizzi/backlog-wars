import { describe, expect, it } from 'vitest'
import {
  EFFORT_BY_DURATION,
  completionRatio,
  hasStarted,
  manualMinutes,
  playedMinutes,
  durationFit,
  formatDuration,
  referenceMinutes,
  remainingMinutes,
  suggestEffortFromMinutes
} from '@renderer/logic/duration'
import { makeGame } from './factories'

describe('referenceMinutes', () => {
  it('usa la storia principale quando c\'è', () => {
    expect(referenceMinutes(makeGame({ durationMain: 1260, durationAllStyles: 1860 }))).toBe(1260)
  })

  it('ripiega sulla media di tutti gli stili', () => {
    expect(referenceMinutes(makeGame({ durationAllStyles: 1860 }))).toBe(1860)
  })

  it('restituisce undefined senza durate', () => {
    expect(referenceMinutes(makeGame())).toBeUndefined()
    expect(referenceMinutes(makeGame({ durationMain: 0 }))).toBeUndefined()
  })
})

describe('remainingMinutes e completionRatio', () => {
  it('calcola quanto manca alla fine', () => {
    const game = makeGame({ durationMain: 1260, totalMinutes: 420 })
    expect(remainingMinutes(game)).toBe(840)
    expect(completionRatio(game)).toBeCloseTo(0.33, 2)
  })

  it('non va sotto zero se ho giocato più della storia principale', () => {
    const game = makeGame({ durationMain: 600, totalMinutes: 900 })
    expect(remainingMinutes(game)).toBe(0)
    expect(completionRatio(game)).toBe(1)
  })

  it('restituisce undefined senza durata', () => {
    expect(remainingMinutes(makeGame({ totalMinutes: 300 }))).toBeUndefined()
    expect(completionRatio(makeGame({ totalMinutes: 300 }))).toBeUndefined()
  })
})

describe('suggestEffortFromMinutes', () => {
  it('mappa la durata sull\'effort richiesto', () => {
    expect(suggestEffortFromMinutes(120)).toBe(1)
    expect(suggestEffortFromMinutes(8 * 60)).toBe(2)
    expect(suggestEffortFromMinutes(20 * 60)).toBe(3)
    expect(suggestEffortFromMinutes(40 * 60)).toBe(4)
    expect(suggestEffortFromMinutes(120 * 60)).toBe(5)
  })

  it('copre tutti i casi senza buchi', () => {
    for (const minutes of [1, 240, 600, 1500, 3000, 6000, 20000]) {
      expect(suggestEffortFromMinutes(minutes)).toBeGreaterThanOrEqual(1)
      expect(suggestEffortFromMinutes(minutes)).toBeLessThanOrEqual(5)
    }
    expect(EFFORT_BY_DURATION).toHaveLength(5)
  })

  it('ignora valori assenti', () => {
    expect(suggestEffortFromMinutes(undefined)).toBeUndefined()
    expect(suggestEffortFromMinutes(0)).toBeUndefined()
  })
})

describe('durationFit', () => {
  it('premia i giochi che stanno nel tempo disponibile', () => {
    expect(durationFit(120, 2)).toBe(1)
    expect(durationFit(60, 4)).toBe(1)
  })

  it('penalizza i giochi troppo lunghi per la serata', () => {
    expect(durationFit(600, 2)).toBeCloseTo(0.2, 2)
    expect(durationFit(6000, 2)).toBeCloseTo(0.05, 2)
  })

  it('resta neutro senza dati', () => {
    expect(durationFit(undefined, 3)).toBe(0.5)
    expect(durationFit(600, 0)).toBe(0.5)
  })
})

describe('formattazione durate', () => {
  it('accorcia le durate lunghe', () => {
    expect(formatDuration(510)).toBe('8h 30m')
    expect(formatDuration(3060)).toBe('≈51h')
    expect(formatDuration(0)).toBe('—')
    expect(formatDuration(undefined)).toBe('—')
  })
})

describe('ore già giocate dichiarate a mano', () => {
  it('somma le ore dichiarate al tempo delle sessioni', () => {
    const game = makeGame({ totalMinutes: 600, playedBeforeMinutes: 1800 })
    expect(manualMinutes(game)).toBe(1800)
    expect(playedMinutes(game)).toBe(2400)
  })

  it('ignora valori assenti o non validi', () => {
    expect(manualMinutes(makeGame())).toBe(0)
    expect(manualMinutes(makeGame({ playedBeforeMinutes: 0 }))).toBe(0)
    expect(manualMinutes(makeGame({ playedBeforeMinutes: -120 }))).toBe(0)
    expect(playedMinutes(makeGame({ totalMinutes: 90 }))).toBe(90)
  })

  it('riduce quanto manca per finire il gioco', () => {
    const senza = makeGame({ durationMain: 3000, totalMinutes: 600 })
    const con = makeGame({ durationMain: 3000, totalMinutes: 600, playedBeforeMinutes: 1800 })
    expect(remainingMinutes(senza)).toBe(2400)
    expect(remainingMinutes(con)).toBe(600)
    expect(completionRatio(con)).toBeCloseTo(0.8, 2)
  })

  it('non porta il tempo giocato oltre la durata stimata', () => {
    const game = makeGame({ durationMain: 600, totalMinutes: 300, playedBeforeMinutes: 900 })
    expect(remainingMinutes(game)).toBe(0)
    expect(completionRatio(game)).toBe(1)
  })
})

describe('hasStarted', () => {
  it('riconosce un gioco già iniziato da data, ore, sessioni o stato', () => {
    expect(hasStarted(makeGame({ startedAt: 1_700_000_000_000 }))).toBe(true)
    expect(hasStarted(makeGame({ playedBeforeMinutes: 120 }))).toBe(true)
    expect(hasStarted(makeGame({ sessionCount: 1 }))).toBe(true)
    expect(hasStarted(makeGame({ status: 'playing' }))).toBe(true)
  })

  it('considera non iniziato un gioco in backlog senza dati', () => {
    expect(hasStarted(makeGame({ status: 'backlog' }))).toBe(false)
    expect(hasStarted(makeGame({ status: 'wishlist', playedBeforeMinutes: 0 }))).toBe(false)
  })
})
