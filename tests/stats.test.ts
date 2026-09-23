import { describe, expect, it } from 'vitest'
import { computeDashboard, computeStreak, isoWeekStart, normalize } from '@renderer/logic/stats'
import { makeGame, makeSession } from './factories'

const NOW = Date.parse('2024-06-12T15:00:00')

describe('isoWeekStart', () => {
  it('restituisce il lunedì della settimana', () => {
    expect(isoWeekStart('2024-06-12')).toBe('2024-06-10')
    expect(isoWeekStart('2024-06-10')).toBe('2024-06-10')
    expect(isoWeekStart('2024-06-16')).toBe('2024-06-10')
    expect(isoWeekStart('2024-06-17')).toBe('2024-06-17')
  })

  it('gestisce il cambio di anno', () => {
    expect(isoWeekStart('2024-01-01')).toBe('2024-01-01')
    expect(isoWeekStart('2023-12-31')).toBe('2023-12-25')
  })
})

describe('computeStreak', () => {
  it('conta i giorni consecutivi che finiscono oggi', () => {
    const days = new Set(['2024-06-12', '2024-06-11', '2024-06-10'])
    expect(computeStreak(days, '2024-06-12')).toBe(3)
  })

  it('accetta una serie che finisce ieri', () => {
    expect(computeStreak(new Set(['2024-06-11']), '2024-06-12')).toBe(1)
  })

  it('vale zero senza sessioni recenti', () => {
    expect(computeStreak(new Set(['2024-06-01']), '2024-06-12')).toBe(0)
  })
})

describe('computeDashboard', () => {
  const games = [
    makeGame({ id: 1, title: 'Hades', status: 'playing', platform: 'PC', genres: ['Roguelike', 'Azione'] }),
    makeGame({ id: 2, title: 'Celeste', status: 'completed', platform: 'PC', genres: ['Platform'] }),
    makeGame({ id: 3, title: 'Elden Ring', status: 'backlog', platform: 'PlayStation 5', genres: ['RPG'] })
  ]
  const sessions = [
    makeSession({ id: 1, gameId: 1, date: '2024-06-12', minutes: 60, effort: 3, satisfaction: 5 }),
    makeSession({ id: 2, gameId: 1, date: '2024-06-11', minutes: 120, effort: 2, satisfaction: 4 }),
    makeSession({ id: 3, gameId: 2, date: '2024-06-10', minutes: 30, effort: 5, satisfaction: 2 }),
    makeSession({ id: 4, gameId: 2, date: '2024-05-21', minutes: 90, effort: 4, satisfaction: 3 })
  ]

  const dashboard = computeDashboard(games, sessions, { now: NOW, weeks: 4 })

  it('somma tempo e sessioni', () => {
    expect(dashboard.totalMinutes).toBe(300)
    expect(dashboard.totalSessions).toBe(4)
    expect(dashboard.avgSessionMinutes).toBe(75)
  })

  it('calcola le medie di soddisfazione ed effort', () => {
    expect(dashboard.avgSatisfaction).toBe(3.5)
    expect(dashboard.avgEffort).toBe(3.5)
  })

  it('conta gli stati del backlog', () => {
    expect(dashboard.byStatus).toEqual({ backlog: 1, playing: 1, completed: 1, dropped: 0, wishlist: 0 })
  })

  it('aggrega per settimana', () => {
    expect(dashboard.weeks).toHaveLength(4)
    const currentWeek = dashboard.weeks[dashboard.weeks.length - 1]
    expect(currentWeek.weekStart).toBe('2024-06-10')
    expect(currentWeek.minutes).toBe(210)
    expect(currentWeek.sessions).toBe(3)
    const oldWeek = dashboard.weeks[0]
    expect(oldWeek.weekStart).toBe('2024-05-20')
    expect(oldWeek.minutes).toBe(90)
  })

  it('calcola i minuti degli ultimi 30 giorni', () => {
    expect(dashboard.minutesLast30).toBe(300)
    expect(dashboard.sessionsLast30).toBe(4)
    expect(dashboard.activeDaysLast30).toBe(4)
  })

  it('raggruppa le sessioni per effort percepito', () => {
    const due = dashboard.effortBuckets.find((bucket) => bucket.effort === 2)
    expect(due?.sessions).toBe(1)
    expect(due?.minutes).toBe(120)
    const cinque = dashboard.effortBuckets.find((bucket) => bucket.effort === 5)
    expect(cinque?.avgSatisfaction).toBe(2)
  })

  it('ordina i giochi per tempo e calcola la resa piacere/effort', () => {
    expect(dashboard.topByTime[0].game.title).toBe('Hades')
    expect(dashboard.topByTime[0].minutes).toBe(180)
    expect(dashboard.topByTime[1].game.title).toBe('Celeste')
    expect(dashboard.topByTime[1].minutes).toBe(120)
    const hades = dashboard.bestValue.find((entry) => entry.game.id === 1)
    expect(hades?.efficiency).toBeCloseTo(1.8, 1)
    expect(dashboard.bestValue[0].game.title).toBe('Hades')
  })

  it('distribuisce il tempo per piattaforma e genere', () => {
    expect(dashboard.platformSpread[0]).toMatchObject({ label: 'PC', minutes: 300 })
    const genres = dashboard.genreSpread.map((entry) => entry.label)
    expect(genres).toContain('Platform')
    expect(dashboard.genreSpread[0].minutes).toBeGreaterThan(0)
  })

  it('espone le sessioni più recenti in ordine decrescente', () => {
    expect(dashboard.recentSessions[0].date).toBe('2024-06-12')
    expect(dashboard.recentSessions).toHaveLength(4)
  })

  it('regge un database vuoto', () => {
    const empty = computeDashboard([], [], { now: NOW })
    expect(empty.totalMinutes).toBe(0)
    expect(empty.avgSatisfaction).toBeNull()
    expect(empty.topByTime).toEqual([])
    expect(empty.streakDays).toBe(0)
  })

  it('calcola la serie di giorni consecutivi', () => {
    expect(dashboard.streakDays).toBe(3)
  })
})

describe('normalize', () => {
  it('porta i valori in 0-1 rispetto al massimo', () => {
    expect(normalize([0, 5, 10])).toEqual([0, 0.5, 1])
    expect(normalize([0, 0])).toEqual([0, 0])
  })
})

describe('stime di durata e retrogaming', () => {
  const games = [
    makeGame({ id: 1, title: 'Hades', status: 'backlog', platform: 'PC', durationMain: 1260 }),
    makeGame({ id: 2, title: 'Chrono Trigger', status: 'backlog', platform: 'Super Nintendo', durationMain: 1380, durationCompletionist: 2700 }),
    makeGame({ id: 3, title: 'Celeste', status: 'playing', platform: 'PC', durationMain: 480, totalMinutes: 180 }),
    makeGame({ id: 4, title: 'Super Metroid', status: 'playing', platform: 'Super Nintendo', durationMain: 420, totalMinutes: 300 }),
    makeGame({ id: 5, title: 'Factorio', status: 'wishlist', platform: 'PC' })
  ]
  const sessions = [
    makeSession({ id: 1, gameId: 3, date: '2024-06-12', minutes: 120 }),
    makeSession({ id: 2, gameId: 3, date: '2024-06-11', minutes: 60 }),
    makeSession({ id: 3, gameId: 4, date: '2024-06-10', minutes: 300 })
  ]
  const dashboard = computeDashboard(games, sessions, { now: NOW, weeks: 4 })

  it('stima le ore del backlog con le durate note', () => {
    expect(dashboard.estimatedBacklogMinutes).toBe(1260 + 1380)
    expect(dashboard.completionistBacklogMinutes).toBe(1260 + 2700)
  })

  it('somma quanto manca ai giochi in corso', () => {
    // Celeste: 480 - 180 = 300 · Super Metroid: 420 - 300 = 120
    expect(dashboard.remainingMinutes).toBe(420)
  })

  it('conta i giochi con durata nota', () => {
    expect(dashboard.gamesWithDuration).toBe(4)
  })

  it('separa il tempo passato sui giochi d\'epoca', () => {
    expect(dashboard.retroMinutes).toBe(300)
    expect(dashboard.retroGames).toBe(1)
  })

  it('raggruppa il tempo per tipo di piattaforma', () => {
    const retro = dashboard.groupSpread.find((entry) => entry.group === 'retro')
    expect(retro?.minutes).toBe(300)
    expect(retro?.games).toBe(2)
    const pc = dashboard.groupSpread.find((entry) => entry.group === 'pc')
    expect(pc?.games).toBe(3)
    expect(pc?.minutes).toBe(180)
  })
})

describe('ore dichiarate a mano nelle statistiche', () => {
  const games = [
    makeGame({ id: 1, title: 'Elden Ring', status: 'playing', platform: 'PlayStation 5', playedBeforeMinutes: 2100, startedAt: 1_700_000_000_000 }),
    makeGame({ id: 2, title: 'Chrono Trigger', status: 'playing', platform: 'Super Nintendo' }),
    makeGame({ id: 3, title: 'Celeste', status: 'completed', platform: 'PC' })
  ]
  const sessions = [
    makeSession({ id: 1, gameId: 2, date: '2024-06-12', minutes: 120, effort: 3, satisfaction: 5 }),
    makeSession({ id: 2, gameId: 2, date: '2024-06-11', minutes: 60, effort: 3, satisfaction: 4 }),
    makeSession({ id: 3, gameId: 3, date: '2024-06-10', minutes: 90, effort: 4, satisfaction: 4 })
  ]
  const dashboard = computeDashboard(games, sessions, { now: NOW, weeks: 4 })

  it('somma le ore dichiarate al tempo totale, tenendole separate', () => {
    expect(dashboard.manualMinutes).toBe(2100)
    expect(dashboard.totalMinutes).toBe(2100 + 120 + 60 + 90)
  })

  it('conta i giochi già iniziati', () => {
    expect(dashboard.startedGames).toBe(1)
  })

  it('include le ore dichiarate nel tempo per gioco e per gruppo', () => {
    const elden = dashboard.topByTime.find((entry) => entry.game.title === 'Elden Ring')
    expect(elden?.minutes).toBe(2100)
    expect(elden?.sessions).toBe(0)
    const consoleBucket = dashboard.groupSpread.find((entry) => entry.group === 'console')
    expect(consoleBucket?.minutes).toBe(2100)
  })

  it('lascia il grafico settimanale sulle sessioni tracciate', () => {
    const totalWeeks = dashboard.weeks.reduce((sum, week) => sum + week.minutes, 0)
    expect(totalWeeks).toBe(120 + 60 + 90)
  })
})
