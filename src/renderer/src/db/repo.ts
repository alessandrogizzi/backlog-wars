import { todayIso } from '@shared/format'
import type { GameStatus } from '@shared/catalog'
import type { ErrorCode } from '@shared/types'
import { db } from './db'
import type {
  BackupBundle,
  Game,
  GameDraft,
  GameLink,
  GameNote,
  PickRecord,
  PlaySession,
  SessionDraft
} from './types'
import { linkHost } from './types'

const PICK_HISTORY_LIMIT = 400

/** Data-layer error: English message (default) plus a translatable code. */
export class RepoError extends Error {
  readonly code: ErrorCode

  constructor(message: string, code: ErrorCode) {
    super(message)
    this.name = 'RepoError'
    this.code = code
  }
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round((total / values.length) * 100) / 100
}

/** Converts a YYYY-MM-DD date to a timestamp (local noon, no timezone surprises). */
export function dateToTimestamp(iso: string, fallbackNow = Date.now()): number {
  const parsed = Date.parse(`${iso}T12:00:00`)
  return Number.isNaN(parsed) ? fallbackNow : parsed
}

export async function createGame(draft: GameDraft): Promise<number> {
  const now = Date.now()
  const game: Game = {
    ...draft,
    title: draft.title.trim(),
    addedAt: now,
    updatedAt: now,
    totalMinutes: 0,
    sessionCount: 0,
    avgSatisfaction: null,
    avgEffort: null,
    lastPlayedAt: null,
    completedAt: draft.status === 'completed' ? now : null
  }
  return db.games.add(game)
}

export async function updateGame(id: number, patch: Partial<Game>): Promise<void> {
  const next: Partial<Game> = { ...patch, updatedAt: Date.now() }
  if (patch.status === 'completed') next.completedAt = patch.completedAt ?? Date.now()
  if (patch.status && patch.status !== 'completed') next.completedAt = null
  delete next.id
  await db.games.update(id, next)
}

export async function setGameStatus(id: number, status: GameStatus): Promise<void> {
  await updateGame(id, { status })
}

export async function toggleFavorite(id: number): Promise<void> {
  const game = await db.games.get(id)
  if (!game) return
  await updateGame(id, { favorite: game.favorite === 1 ? 0 : 1 })
}

export async function deleteGame(id: number): Promise<void> {
  await db.transaction('rw', db.games, db.sessions, db.picks, db.notes, db.links, async () => {
    await db.sessions.where('gameId').equals(id).delete()
    await db.picks.where('gameId').equals(id).delete()
    await db.notes.where('gameId').equals(id).delete()
    await db.links.where('gameId').equals(id).delete()
    await db.games.delete(id)
  })
}

/* --------------------------------- Note --------------------------------- */

/** Adds a note to a game: creation and edit start from the same instant. */
export async function addNote(gameId: number, text: string): Promise<number> {
  const clean = text.trim()
  if (!clean) throw new RepoError('The note is empty.', 'noteEmpty')
  const game = await db.games.get(gameId)
  if (!game) throw new RepoError('Game not found: cannot save the note.', 'gameNotFound')
  const now = Date.now()
  const note: GameNote = { gameId, text: clean, createdAt: now, updatedAt: now }
  await db.games.update(gameId, { updatedAt: now })
  return db.notes.add(note)
}

/**
 * Edits a note's text, updating only the modification timestamp.
 * The new timestamp is always strictly later than creation and the previous
 * edit, so the note counts as "edited" even when saved twice in the
 * same millisecond.
 */
export async function updateNote(id: number, text: string): Promise<void> {
  const clean = text.trim()
  if (!clean) throw new RepoError('The note is empty.', 'noteEmpty')
  const current = await db.notes.get(id)
  if (!current) throw new RepoError('Note not found.', 'noteNotFound')
  const updatedAt = Math.max(Date.now(), current.createdAt + 1, current.updatedAt + 1)
  await db.notes.update(id, { text: clean, updatedAt })
}

export async function deleteNote(id: number): Promise<void> {
  await db.notes.delete(id)
}

export async function countNotes(gameId: number): Promise<number> {
  return db.notes.where('gameId').equals(gameId).count()
}

/* --------------------------------- Link --------------------------------- */

/** Adds a useful link to a game (the preview arrives later, if available). */
export async function addLink(gameId: number, url: string, label?: string): Promise<number> {
  const clean = url.trim()
  if (!clean) throw new RepoError('Missing address.', 'linkMissingUrl')
  const game = await db.games.get(gameId)
  if (!game) throw new RepoError('Game not found: cannot save the link.', 'gameNotFound')
  const now = Date.now()
  const link: GameLink = {
    gameId,
    url: clean,
    label: label?.trim() || undefined,
    host: linkHost(clean),
    createdAt: now,
    updatedAt: now
  }
  await db.games.update(gameId, { updatedAt: now })
  return db.links.add(link)
}

/** Updates a link's label, title or preview. */
export async function updateLink(id: number, patch: Partial<Omit<GameLink, 'id' | 'gameId'>>): Promise<void> {
  const current = await db.links.get(id)
  if (!current) throw new RepoError('Link not found.', 'linkNotFound')
  const rest = { ...patch }
  const updatedAt = Math.max(Date.now(), current.createdAt + 1, current.updatedAt + 1)
  if (rest.url) rest.host = linkHost(rest.url)
  await db.links.update(id, { ...rest, updatedAt })
}

export async function deleteLink(id: number): Promise<void> {
  await db.links.delete(id)
}

export async function countLinks(gameId: number): Promise<number> {
  return db.links.where('gameId').equals(gameId).count()
}

/** Recomputes a game's aggregates from its sessions. */
export async function recomputeGame(gameId: number, statusAfter?: GameStatus): Promise<void> {
  const game = await db.games.get(gameId)
  if (!game) return
  const sessions = await db.sessions.where('gameId').equals(gameId).toArray()
  const status: GameStatus =
    statusAfter ?? (game.status === 'backlog' || game.status === 'wishlist' ? (sessions.length ? 'playing' : game.status) : game.status)
  await db.games.update(gameId, {
    totalMinutes: sessions.reduce((sum, session) => sum + session.minutes, 0),
    sessionCount: sessions.length,
    avgSatisfaction: average(sessions.map((session) => session.satisfaction)),
    avgEffort: average(sessions.map((session) => session.effort)),
    lastPlayedAt: sessions.length ? Math.max(...sessions.map((session) => session.startedAt)) : null,
    status,
    completedAt: status === 'completed' ? (game.completedAt ?? Date.now()) : null,
    updatedAt: Date.now()
  })
}

export async function logSession(draft: SessionDraft): Promise<number> {
  return db.transaction('rw', db.games, db.sessions, async () => {
    const game = await db.games.get(draft.gameId)
    if (!game) throw new RepoError('Game not found: cannot log the session.', 'gameNotFound')
    const now = Date.now()
    const date = draft.date || todayIso()
    const session: PlaySession = {
      gameId: draft.gameId,
      date,
      startedAt: dateToTimestamp(date, now),
      minutes: Math.max(1, Math.round(draft.minutes)),
      effort: Math.min(5, Math.max(1, Math.round(draft.effort))),
      satisfaction: Math.min(5, Math.max(1, Math.round(draft.satisfaction))),
      progress: draft.progress?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      createdAt: now
    }
    const id = await db.sessions.add(session)
    await recomputeGame(draft.gameId, draft.statusAfter)
    return id
  })
}

export async function updateSession(id: number, patch: Partial<PlaySession>): Promise<void> {
  await db.transaction('rw', db.games, db.sessions, async () => {
    const current = await db.sessions.get(id)
    if (!current) throw new RepoError('Session not found.', 'sessionNotFound')
    const next: Partial<PlaySession> = { ...patch }
    delete next.id
    delete next.gameId
    if (next.date) next.startedAt = dateToTimestamp(next.date, current.startedAt)
    if (next.minutes !== undefined) next.minutes = Math.max(1, Math.round(next.minutes))
    await db.sessions.update(id, next)
    await recomputeGame(current.gameId)
  })
}

export async function deleteSession(id: number): Promise<void> {
  await db.transaction('rw', db.games, db.sessions, async () => {
    const session = await db.sessions.get(id)
    if (!session) return
    await db.sessions.delete(id)
    await recomputeGame(session.gameId)
  })
}

export async function recordPick(record: Omit<PickRecord, 'id' | 'pickedAt'>): Promise<number> {
  const id = await db.picks.add({ ...record, pickedAt: Date.now() })
  const count = await db.picks.count()
  if (count > PICK_HISTORY_LIMIT) {
    const oldest = await db.picks.orderBy('pickedAt').limit(count - PICK_HISTORY_LIMIT).primaryKeys()
    await db.picks.bulkDelete(oldest)
  }
  return id
}

export async function markPickAccepted(id: number): Promise<void> {
  await db.picks.update(id, { accepted: 1 })
}

export async function lastPickFor(gameId: number): Promise<PickRecord | undefined> {
  const picks = await db.picks.where('gameId').equals(gameId).reverse().sortBy('pickedAt')
  return picks[0]
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.games, db.sessions, db.picks, db.settings, db.notes, db.links], async () => {
    await db.games.clear()
    await db.sessions.clear()
    await db.picks.clear()
    await db.settings.clear()
    await db.notes.clear()
    await db.links.clear()
  })
}

export async function exportBundle(): Promise<BackupBundle> {
  const [games, sessions, picks, notes, links, settings] = await Promise.all([
    db.games.toArray(),
    db.sessions.toArray(),
    db.picks.toArray(),
    db.notes.toArray(),
    db.links.toArray(),
    db.settings.toArray()
  ])
  return {
    app: 'backlog-wars',
    schema: 3,
    exportedAt: new Date().toISOString(),
    games,
    sessions,
    picks,
    notes,
    links,
    settings
  }
}

function parseBundle(json: string): BackupBundle {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new RepoError('The selected file is not valid JSON.', 'invalidJson')
  }
  const bundle = parsed as Partial<BackupBundle>
  if (!bundle || bundle.app !== 'backlog-wars' || !Array.isArray(bundle.games)) {
    throw new RepoError('The file does not look like a Backlog Wars backup.', 'invalidBackup')
  }
  return {
    app: 'backlog-wars',
    schema: bundle.schema ?? 1,
    exportedAt: bundle.exportedAt ?? new Date().toISOString(),
    games: bundle.games ?? [],
    sessions: bundle.sessions ?? [],
    picks: bundle.picks ?? [],
    notes: bundle.notes ?? [],
    links: bundle.links ?? [],
    settings: bundle.settings ?? []
  }
}

export interface ImportReport {
  games: number
  sessions: number
  notes: number
  links: number
  skipped: number
  mode: 'merge' | 'replace'
}

/**
 * Imports a backup. In `replace` mode the database is emptied;
 * in `merge` games with the same title are skipped and orphan sessions
 * (of skipped games) are not imported.
 */
export async function importBundle(json: string, mode: 'merge' | 'replace'): Promise<ImportReport> {
  const bundle = parseBundle(json)

  return db.transaction('rw', [db.games, db.sessions, db.picks, db.settings, db.notes, db.links], async () => {
    if (mode === 'replace') {
      await db.games.clear()
      await db.sessions.clear()
      await db.picks.clear()
      await db.settings.clear()
      await db.notes.clear()
      await db.links.clear()
    }

    const idMap = new Map<number, number>()
    const existingTitles = new Set(
      mode === 'merge' ? (await db.games.toArray()).map((game) => game.title.toLowerCase()) : []
    )
    let skipped = 0

    // Backups created before v2 kept notes inside the game: we recover them.
    const legacyNotes: Array<{ text: string; timestamp: number; newGameId: number }> = []

    for (const game of bundle.games) {
      if (mode === 'merge' && existingTitles.has((game.title ?? '').toLowerCase())) {
        skipped += 1
        continue
      }
      const { id, notes: legacyNote, ...rest } = game as Game & { notes?: string }
      const newId = await db.games.add(rest as Game)
      if (typeof id === 'number') idMap.set(id, newId)
      if (typeof legacyNote === 'string' && legacyNote.trim().length > 0) {
        const timestamp = (game as Game).updatedAt ?? (game as Game).addedAt ?? Date.now()
        legacyNotes.push({ text: legacyNote.trim(), timestamp, newGameId: newId })
      }
      existingTitles.add((game.title ?? '').toLowerCase())
    }

    let importedNotes = 0
    for (const note of bundle.notes ?? []) {
      const newGameId = idMap.get(note.gameId)
      if (newGameId === undefined) {
        skipped += 1
        continue
      }
      await db.notes.add({
        gameId: newGameId,
        text: note.text,
        createdAt: note.createdAt ?? Date.now(),
        updatedAt: note.updatedAt ?? note.createdAt ?? Date.now()
      })
      importedNotes += 1
    }

    for (const legacy of legacyNotes) {
      await db.notes.add({
        gameId: legacy.newGameId,
        text: legacy.text,
        createdAt: legacy.timestamp,
        updatedAt: legacy.timestamp
      })
      importedNotes += 1
    }

    let importedLinks = 0
    for (const link of bundle.links ?? []) {
      const newGameId = idMap.get(link.gameId)
      if (newGameId === undefined) {
        skipped += 1
        continue
      }
      await db.links.add({
        gameId: newGameId,
        url: link.url,
        label: link.label,
        title: link.title,
        description: link.description,
        imageUrl: link.imageUrl,
        faviconUrl: link.faviconUrl,
        host: link.host ?? linkHost(link.url),
        createdAt: link.createdAt ?? Date.now(),
        updatedAt: link.updatedAt ?? link.createdAt ?? Date.now(),
        previewFetchedAt: link.previewFetchedAt
      })
      importedLinks += 1
    }

    for (const session of bundle.sessions) {
      const newGameId = idMap.get(session.gameId)
      if (newGameId === undefined) {
        skipped += 1
        continue
      }
      const { id, ...rest } = session
      void id
      await db.sessions.add({ ...(rest as PlaySession), gameId: newGameId })
    }

    for (const pick of bundle.picks) {
      const newGameId = idMap.get(pick.gameId)
      if (newGameId === undefined) {
        skipped += 1
        continue
      }
      const { id: pickId, ...rest } = pick
      void pickId
      await db.picks.add({ ...(rest as PickRecord), gameId: newGameId })
    }

    if (mode === 'replace') {
      for (const row of bundle.settings) {
        await db.settings.put(row)
      }
    }

    // Aligns the aggregates of all imported games.
    const ids = await db.games.toCollection().primaryKeys()
    for (const gameId of ids) {
      await recomputeGame(gameId)
    }

    return {
      games: idMap.size,
      sessions: bundle.sessions.length,
      notes: importedNotes,
      links: importedLinks,
      skipped,
      mode
    }
  })
}
