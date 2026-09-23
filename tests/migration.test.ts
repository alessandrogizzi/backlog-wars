/**
 * Schema migrations: notes inside the game (v1) become rows in
 * `notes` (v2), v3 adds useful links and v4 translates genres into English.
 */
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterAll, describe, expect, it } from 'vitest'
import { BacklogWarsDb, SCHEMA_V1 } from '@renderer/db/db'

const NAME = 'backlog-wars-migration-test'

const legacyGame = {
  title: 'Chrono Trigger',
  status: 'playing',
  platform: 'Super Nintendo',
  genres: ['JRPG', 'Azione', 'Narrativo'],
  tags: [],
  effortEstimate: 3,
  pleasure: 5,
  priority: 4,
  favorite: 0,
  addedAt: 1_000,
  updatedAt: 5_000,
  totalMinutes: 0,
  sessionCount: 0,
  avgSatisfaction: null,
  avgEffort: null,
  lastPlayedAt: null,
  completedAt: null,
  notes: 'Sono già al cd 2'
}

async function createLegacyDatabase(): Promise<void> {
  const legacy = new Dexie(NAME)
  legacy.version(1).stores({ ...SCHEMA_V1 })
  await legacy.open()
  await legacy.table('games').bulkAdd([
    legacyGame,
    { ...legacyGame, title: 'Gioco senza note', notes: '' },
    { ...legacyGame, title: 'Gioco con note vuote per spazi', notes: '   ' }
  ])
  legacy.close()
}

afterAll(async () => {
  await Dexie.delete(NAME)
})

describe('migrazione dello schema', () => {
  it('sposta le note nel nuovo archivio e rimuove il vecchio campo', async () => {
    await Dexie.delete(NAME)
    await createLegacyDatabase()

    const upgraded = new BacklogWarsDb(NAME)
    const games = await upgraded.table('games').toArray()
    const notes = await upgraded.table('notes').toArray()
    const notesCount = await upgraded.table('notes').count()
    const linksCount = await upgraded.table('links').count()
    const schemaVersion = upgraded.verno
    upgraded.close()

    expect(notesCount).toBe(1)
    // v3 adds the links table, empty for existing databases.
    expect(linksCount).toBe(0)
    const chrono = games.find((game) => game.title === 'Chrono Trigger')
    const migrated = notes[0]
    expect(migrated).toMatchObject({
      gameId: chrono?.id,
      text: 'Sono già al cd 2',
      createdAt: 5_000,
      updatedAt: 5_000
    })
    // The old field must not remain: a single source of truth.
    expect(games.every((game) => (game as Record<string, unknown>).notes === undefined)).toBe(true)
    expect(schemaVersion).toBe(4)
    // v4: the genre vocabulary moves from Italian to English.
    expect(chrono?.genres).toEqual(['JRPG', 'Action', 'Narrative'])
  })
})
