import Dexie, { type Table } from 'dexie'
import type { AppSettings } from '@shared/types'
import { LEGACY_GENRE_MAP } from '@shared/catalog'
import { DEFAULT_SETTINGS } from '@shared/types'
import type { Game, GameLink, GameNote, PickRecord, PlaySession, SettingRow } from './types'

/** Table schema. v1 also serves the migration tests. */
export const SCHEMA_V1 = {
  games:
    '++id, title, status, platform, effortEstimate, pleasure, priority, favorite, addedAt, updatedAt, lastPlayedAt, totalMinutes, *genres, *tags',
  sessions: '++id, gameId, date, startedAt, createdAt, [gameId+date]',
  picks: '++id, gameId, pickedAt, mode, accepted',
  settings: '&key'
} as const

/** What's new in v2: notes become a timestamped list. */
export const SCHEMA_V2 = {
  notes: '++id, gameId, createdAt, updatedAt, [gameId+createdAt]'
} as const

/** What's new in v3: useful links with a preview. */
export const SCHEMA_V3 = {
  links: '++id, gameId, host, createdAt, updatedAt, [gameId+createdAt]'
} as const

/**
 * Local persistence on IndexedDB through Dexie.
 * The database lives in the Electron user profile: no server, no cloud.
 */
export class BacklogWarsDb extends Dexie {
  games!: Table<Game, number>
  sessions!: Table<PlaySession, number>
  picks!: Table<PickRecord, number>
  settings!: Table<SettingRow, string>
  notes!: Table<GameNote, number>
  links!: Table<GameLink, number>

  constructor(name = 'backlog-wars') {
    super(name)
    this.version(1).stores({ ...SCHEMA_V1 })

    // v2: notes move from a text field to a dedicated table.
    // Notes already written on games are migrated, keeping their dates.
    this.version(2)
      .stores({ ...SCHEMA_V2 })
      .upgrade(async (transaction) => {
        const games = (await transaction.table('games').toArray()) as Array<
          Game & { notes?: string }
        >
        const migrated = games
          .filter((game) => typeof game.notes === 'string' && game.notes.trim().length > 0)
          .map((game) => ({
            gameId: game.id!,
            text: game.notes!.trim(),
            createdAt: game.updatedAt ?? game.addedAt ?? Date.now(),
            updatedAt: game.updatedAt ?? game.addedAt ?? Date.now()
          }))
        if (migrated.length > 0) await transaction.table('notes').bulkAdd(migrated)
        // Removes the old field so there is only one source of truth.
        await transaction
          .table('games')
          .toCollection()
          .modify((game: Record<string, unknown>) => {
            delete game.notes
          })
      })

    // v3: table of useful links (guide, wiki, video…) with a preview.
    this.version(3).stores({ ...SCHEMA_V3 })

    // v4: the genre vocabulary moves from Italian to English (the app default).
    this.version(4).upgrade(async (transaction) => {
      await transaction
        .table('games')
        .toCollection()
        .modify((game: Record<string, unknown>) => {
          const genres = game.genres
          if (!Array.isArray(genres)) return
          game.genres = [...new Set(genres.map((genre) => LEGACY_GENRE_MAP[String(genre)] ?? String(genre)))]
        })
    })
  }
}

export const db = new BacklogWarsDb()

export const SETTINGS_KEY = 'app'

export async function readSettings(): Promise<AppSettings> {
  const row = await db.settings.get(SETTINGS_KEY)
  if (!row) return { ...DEFAULT_SETTINGS }
  const stored = (row.value ?? {}) as Partial<AppSettings>
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    // Weights are nested: a save made by an earlier version must not
    // leave holes (e.g. the duration weight).
    weights: { ...DEFAULT_SETTINGS.weights, ...(stored.weights ?? {}) }
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({ key: SETTINGS_KEY, value: settings })
}
