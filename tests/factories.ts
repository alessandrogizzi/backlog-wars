import type { Game, PlaySession } from '@renderer/db/types'
import type { GameMetadata } from '@shared/types'

export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    title: 'Gioco di prova',
    status: 'backlog',
    platform: 'PC',
    genres: [],
    tags: [],
    effortEstimate: 3,
    pleasure: 3,
    priority: 3,
    favorite: 0,
    addedAt: 0,
    updatedAt: 0,
    totalMinutes: 0,
    sessionCount: 0,
    avgSatisfaction: null,
    avgEffort: null,
    lastPlayedAt: null,
    completedAt: null,
    ...overrides
  }
}

let sessionCounter = 0

export function makeSession(overrides: Partial<PlaySession> = {}): PlaySession {
  sessionCounter += 1
  const date = overrides.date ?? '2024-05-01'
  return {
    id: sessionCounter,
    gameId: 1,
    date,
    startedAt: Date.parse(`${date}T12:00:00`),
    minutes: 60,
    effort: 3,
    satisfaction: 4,
    createdAt: Date.parse(`${date}T12:00:00`),
    ...overrides
  }
}

export function makeMetadata(overrides: Partial<GameMetadata> = {}): GameMetadata {
  return {
    provider: 'steam',
    providerId: '1',
    title: 'Gioco',
    genres: [],
    platforms: [],
    developers: [],
    publishers: [],
    ...overrides
  }
}
