import { describe, expect, it } from 'vitest'
import {
  GENRE_OPTIONS,
  LEGACY_GENRE_MAP,
  PLATFORM_OPTIONS,
  emulatorHint,
  isRetroPlatform,
  normalizeGenres,
  normalizePlatformList,
  normalizePlatformName,
  normalizePlatforms,
  platformGroupOf,
  yearFromDate
} from '@shared/catalog'
import { clamp, daysBetween, formatDate, formatHours, formatMinutes, isoDateFromAny, stripHtml, todayIso } from '@shared/format'

describe('normalizzazione piattaforme', () => {
  it('riconosce le piattaforme note', () => {
    expect(normalizePlatformName('PlayStation 5')).toBe('PlayStation 5')
    expect(normalizePlatformName('PS4')).toBe('PlayStation 4')
    expect(normalizePlatformName('PC (Windows)')).toBe('PC')
    expect(normalizePlatformName('Nintendo Switch')).toBe('Nintendo Switch')
    expect(normalizePlatformName('macOS')).toBe('macOS')
    expect(normalizePlatformName('Steam Deck')).toBe('Steam Deck')
  })

  it('riconosce console, portatili e computer d\'epoca', () => {
    expect(normalizePlatformName('Super Nintendo')).toBe('Super Nintendo')
    expect(normalizePlatformName('SNES')).toBe('Super Nintendo')
    expect(normalizePlatformName('Nintendo Entertainment System')).toBe('NES')
    expect(normalizePlatformName('Sega Genesis')).toBe('Sega Mega Drive')
    expect(normalizePlatformName('Game Boy Advance')).toBe('Game Boy Advance')
    expect(normalizePlatformName('Nintendo DS')).toBe('Nintendo DS')
    expect(normalizePlatformName('PlayStation')).toBe('PlayStation')
    expect(normalizePlatformName('Nintendo 64')).toBe('Nintendo 64')
    expect(normalizePlatformName('Dreamcast')).toBe('Dreamcast')
    expect(normalizePlatformName('Atari 2600')).toBe('Atari 2600')
    expect(normalizePlatformName('Commodore Amiga')).toBe('Commodore Amiga')
    expect(normalizePlatformName('MS-DOS')).toBe('DOS')
    expect(normalizePlatformName('Arcade')).toBe('Arcade / MAME')
    expect(normalizePlatformName('Nintendo Switch 2')).toBe('Nintendo Switch 2')
    expect(normalizePlatformName('Xbox Series X')).toBe('Xbox Series')
    expect(normalizePlatformName('Meta Quest 3')).toBe('VR')
  })

  it('classifica le piattaforme per gruppo e riconosce il retrogaming', () => {
    expect(platformGroupOf('Super Nintendo')).toBe('retro')
    expect(platformGroupOf('DOS')).toBe('retro')
    expect(platformGroupOf('Game Boy Advance')).toBe('handheld')
    expect(platformGroupOf('Nintendo Switch')).toBe('console')
    expect(platformGroupOf('PC')).toBe('pc')
    expect(isRetroPlatform('PlayStation 2')).toBe(true)
    expect(isRetroPlatform('PlayStation 5')).toBe(false)
    expect(emulatorHint('Super Nintendo')).toContain('Snes9x')
    expect(emulatorHint('DOS')).toContain('DOSBox')
    expect(emulatorHint('PC')).toBeUndefined()
  })

  it('ricade su "Altro" per valori sconosciuti o vuoti', () => {
    expect(normalizePlatformName('')).toBe('Altro')
    expect(normalizePlatformName('  ')).toBe('Altro')
    expect(normalizePlatformName('Amstrad')).toBe('Retro / Emulatore')
  })

  it('deduplica e mantiene l\'ordine', () => {
    expect(normalizePlatforms(['PC', 'Windows', 'Nintendo Switch'])).toEqual(['PC', 'Nintendo Switch'])
  })

  it('espone un elenco utilizzabile nelle select', () => {
    expect(PLATFORM_OPTIONS).toContain('PC')
    expect(PLATFORM_OPTIONS).toContain('Super Nintendo')
    expect(PLATFORM_OPTIONS.length).toBeGreaterThan(30)
  })

  it('converte le liste di piattaforme di HowLongToBeat', () => {
    expect(normalizePlatformList('Linux, Mac, Nintendo Switch, PC, PlayStation 3, Xbox 360')).toEqual([
      'Linux',
      'macOS',
      'Nintendo Switch',
      'PC',
      'PlayStation 3',
      'Xbox 360'
    ])
    expect(normalizePlatformList('Mobile, Nintendo DS, PC, PlayStation, Super Nintendo')).toEqual([
      'Mobile',
      'Nintendo DS',
      'PC',
      'PlayStation',
      'Super Nintendo'
    ])
    expect(normalizePlatformList(null)).toEqual([])
  })
})

describe('normalizzazione generi', () => {
  it('mappa i generi delle API sul vocabolario interno', () => {
    expect(normalizeGenres(['Role Playing Games (RPG)'])).toEqual(['RPG'])
    expect(normalizeGenres(['Azione', 'Avventura'])).toEqual(['Action', 'Adventure'])
    expect(normalizeGenres(['Shooter'])).toEqual(['Shooter'])
    expect(normalizeGenres(['Indie', 'Simulazione'])).toEqual(['Indie', 'Simulation'])
    expect(normalizeGenres(['Sparatutto'])).toEqual(['Shooter'])
  })

  it('scarta i generi sconosciuti senza duplicare', () => {
    expect(normalizeGenres(['Qualcosa di strano', 'Indie', 'Indie'])).toEqual(['Indie'])
  })

  it('espone un elenco di generi per la UI, in inglese', () => {
    expect(GENRE_OPTIONS).toContain('Roguelike')
    expect(GENRE_OPTIONS).toContain('Action')
    expect(GENRE_OPTIONS).not.toContain('Azione')
  })

  it('sa convertire i generi canonici italiani della v3', () => {
    expect(LEGACY_GENRE_MAP.Azione).toBe('Action')
    expect(LEGACY_GENRE_MAP.Tattico).toBe('Tactical')
    expect(LEGACY_GENRE_MAP.Narrativo).toBe('Narrative')
  })
})

describe('yearFromDate', () => {
  it('estrae l\'anno da formati diversi', () => {
    expect(yearFromDate('2015-05-19')).toBe(2015)
    expect(yearFromDate('9 Jul, 2013')).toBe(2013)
    expect(yearFromDate(1998)).toBe(1998)
  })

  it('ignora valori assenti o implausibili', () => {
    expect(yearFromDate(undefined)).toBeUndefined()
    expect(yearFromDate('')).toBeUndefined()
    expect(yearFromDate('nessuna data')).toBeUndefined()
    expect(yearFromDate('1200')).toBeUndefined()
  })
})

describe('isoDateFromAny', () => {
  it('normalizza le date ISO e quelle testuali', () => {
    expect(isoDateFromAny('2020-03-04')).toBe('2020-03-04')
    expect(isoDateFromAny('2020-03-04T10:00:00Z')).toBe('2020-03-04')
    expect(isoDateFromAny('9 Jul, 2013')).toBe('2013-07-09')
  })

  it('restituisce undefined per valori non interpretabili', () => {
    expect(isoDateFromAny('')).toBeUndefined()
    expect(isoDateFromAny(undefined)).toBeUndefined()
    expect(isoDateFromAny('Coming soon')).toBeUndefined()
  })
})

describe('formattazione', () => {
  it('formatta i minuti in modo leggibile', () => {
    expect(formatMinutes(45)).toBe('45m')
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(95)).toBe('1h 35m')
    expect(formatMinutes(0)).toBe('0m')
    expect(formatMinutes(-10)).toBe('0m')
  })

  it('formatta le ore con la virgola italiana', () => {
    expect(formatHours(90)).toBe('1,5')
    expect(formatHours(0)).toBe('0,0')
  })

  it('formatta le date secondo la lingua', () => {
    expect(formatDate('2024-06-12', 'it-IT')).toBe('12/06/2024')
    expect(formatDate('2024-06-12', 'en-GB')).toBe('12/06/2024')
    expect(formatDate('2024-06-12', 'en-US')).toBe('06/12/2024')
    expect(formatDate(null)).toBe('—')
  })

  it('produce la data odierna in formato ISO', () => {
    expect(todayIso(new Date('2024-06-12T23:30:00'))).toBe('2024-06-12')
  })

  it('calcola i giorni fra due date', () => {
    expect(daysBetween('2024-06-01', '2024-06-12')).toBe(11)
    expect(daysBetween('2024-06-12', '2024-06-01')).toBe(-11)
  })

  it('limita i valori con clamp', () => {
    expect(clamp(12, 1, 5)).toBe(5)
    expect(clamp(-3, 1, 5)).toBe(1)
  })

  it('ripulisce l\'HTML delle descrizioni', () => {
    expect(stripHtml('<p>Ciao<br>mondo</p><b>!</b>')).toBe('Ciao\nmondo\n\n!')
    expect(stripHtml('Tom &amp; Jerry &quot;ok&quot;')).toBe('Tom & Jerry "ok"')
    expect(stripHtml(null)).toBe('')
  })
})
