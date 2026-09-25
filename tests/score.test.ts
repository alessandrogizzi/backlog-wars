import { describe, expect, it } from 'vitest'
import { MAX_PERSONAL_SCORE, personalScore } from '@renderer/logic/score'

describe('voto personale', () => {
  it('vale 0 finché il gioco non è valutato', () => {
    expect(personalScore({})).toBe(0)
    expect(personalScore({ personalScore: 0 })).toBe(0)
    expect(personalScore({ personalScore: undefined })).toBe(0)
    expect(personalScore({ personalScore: Number.NaN })).toBe(0)
  })

  it('tiene il voto dentro la scala 0-10', () => {
    expect(personalScore({ personalScore: 8 })).toBe(8)
    expect(personalScore({ personalScore: -3 })).toBe(0)
    expect(personalScore({ personalScore: MAX_PERSONAL_SCORE + 5 })).toBe(MAX_PERSONAL_SCORE)
  })

  it('arrotonda i decimali a un intero', () => {
    expect(personalScore({ personalScore: 7.4 })).toBe(7)
    expect(personalScore({ personalScore: 7.6 })).toBe(8)
  })
})
