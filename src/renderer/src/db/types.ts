import type { GameStatus } from '@shared/catalog'

/** A game in the backlog. All aggregates are denormalised for fast queries. */
export interface Game {
  id?: number
  title: string
  status: GameStatus
  /** Main platform I am playing it on. */
  platform: string
  genres: string[]
  tags: string[]
  coverUrl?: string
  description?: string
  releaseYear?: number
  metacritic?: number
  /** Metacritic page the score comes from. */
  metacriticUrl?: string
  metacriticReviewCount?: number
  metacriticSentiment?: string
  /** Metacritic "Must Play" badge. */
  mustPlay?: 0 | 1
  /** Where the Metascore comes from: the metadata source or Metacritic itself. */
  metacriticSource?: string
  metacriticUpdatedAt?: number
  developer?: string
  publisher?: string
  provider?: string
  providerId?: string
  externalUrl?: string
  /** HowLongToBeat durations, in minutes. */
  hltbId?: number
  durationMain?: number
  durationMainExtra?: number
  durationCompletionist?: number
  durationAllStyles?: number
  durationUpdatedAt?: number
  /** DOS/retro games that run on DOSBox (from GOGDB). */
  usesDosbox?: 0 | 1
  /** How much effort/energy it needs (1 = relaxing, 5 = brutal). */
  effortEstimate: number
  /** Expected or observed pleasure (1-5). */
  pleasure: number
  /** Personal priority (1-5). */
  priority: number
  /** IndexedDB does not index booleans: 0/1. */
  favorite: 0 | 1
  /**
   * Hours played before starting to track sessions (or on another
   * platform): they add up to the session time.
   */
  playedBeforeMinutes?: number
  /** When I started playing it (timestamp), if I already have. */
  startedAt?: number
  addedAt: number
  updatedAt: number
  totalMinutes: number
  sessionCount: number
  avgSatisfaction: number | null
  avgEffort: number | null
  lastPlayedAt: number | null
  completedAt: number | null
}

/**
 * A free-form note tied to a game (reminder, where I left off, ideas…).
 * Notes live in a dedicated table: every game can have as many as it wants.
 */
export interface GameNote {
  id?: number
  gameId: number
  text: string
  /** When the note was created (timestamp). */
  createdAt: number
  /** Last edit of the text (same as createdAt until it is rewritten). */
  updatedAt: number
}

/**
 * A useful link tied to a game (guide, wiki, video, mod…), with the page
 * preview (title, description, image, favicon).
 */
export interface GameLink {
  id?: number
  gameId: number
  url: string
  /** Label chosen by the user: guide, wiki, video, mod… */
  label?: string
  /** Page title (or typed by hand). */
  title?: string
  description?: string
  imageUrl?: string
  faviconUrl?: string
  /** Domain, to show it in a compact form. */
  host?: string
  createdAt: number
  updatedAt: number
  /** When the preview was fetched. */
  previewFetchedAt?: number
}

/** A logged play session. */
export interface PlaySession {
  id?: number
  gameId: number
  /** Session day, YYYY-MM-DD format (indexable). */
  date: string
  startedAt: number
  minutes: number
  /** Effort perceived during the session (1-5). */
  effort: number
  /** Satisfaction felt (1-5). */
  satisfaction: number
  progress?: string
  notes?: string
  createdAt: number
}

/** Draw history, so the same games are not always offered again. */
export interface PickRecord {
  id?: number
  gameId: number
  pickedAt: number
  mode: 'roulette' | 'smart' | 'tournament'
  accepted: 0 | 1
  filters?: string
}

export interface SettingRow {
  key: string
  value: unknown
}

export interface BackupBundle {
  app: 'backlog-wars'
  schema: number
  exportedAt: string
  games: Game[]
  sessions: PlaySession[]
  picks: PickRecord[]
  notes: GameNote[]
  links: GameLink[]
  settings: SettingRow[]
}

/** A note is "edited" if the text was rewritten after creation. */
export function isNoteEdited(note: Pick<GameNote, 'createdAt' | 'updatedAt'>): boolean {
  return note.updatedAt > note.createdAt
}

/** A link is "edited" if it was touched up after creation. */
export function isLinkEdited(link: Pick<GameLink, 'createdAt' | 'updatedAt'>): boolean {
  return link.updatedAt > link.createdAt
}

/** Ready-made labels for useful links. */
export const LINK_LABELS = ['Guida', 'Wiki', 'Video', 'Trucchi', 'Mod', 'Forum', 'Store'] as const

/**
 * Normalises an address pasted by the user: adds https:// if the scheme is
 * missing, rejects unsafe schemes and returns undefined if it is not a
 * valid http/https URL.
 */
export function normalizeUrl(input: string): string | undefined {
  const raw = (input ?? '').trim()
  if (!raw) return undefined
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    if (!url.hostname.includes('.')) return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

/** Readable domain of a link, without "www.". */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

export type GameDraft = Omit<
  Game,
  | 'id'
  | 'addedAt'
  | 'updatedAt'
  | 'totalMinutes'
  | 'sessionCount'
  | 'avgSatisfaction'
  | 'avgEffort'
  | 'lastPlayedAt'
  | 'completedAt'
>

export interface SessionDraft {
  gameId: number
  date: string
  minutes: number
  effort: number
  satisfaction: number
  progress?: string
  notes?: string
  /** Status to apply to the game after the session. */
  statusAfter?: GameStatus
}

export function emptyDraft(overrides: Partial<GameDraft> = {}): GameDraft {
  return {
    title: '',
    status: 'backlog',
    platform: 'PC',
    genres: [],
    tags: [],
    effortEstimate: 3,
    pleasure: 3,
    priority: 3,
    favorite: 0,
    ...overrides
  }
}
