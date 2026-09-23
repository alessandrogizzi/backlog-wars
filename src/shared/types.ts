/**
 * Types shared between the main process, preload and renderer.
 * The metadata APIs live in the main process (no CORS issues,
 * API keys outside the renderer); the IPC contract lives here.
 */

export type ProviderId = 'rawg' | 'steam' | 'gog' | 'hltb'

export type ProviderChoice = ProviderId | 'auto'

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  steam: 'Steam',
  gog: 'GOG',
  hltb: 'HowLongToBeat',
  rawg: 'RAWG'
}

/** A Metacritic search result. */
export interface MetacriticCandidate {
  id: number
  title: string
  slug: string
  year?: number
  /** Critic Metascore (0-100). Missing when Metacritic has no votes yet. */
  score?: number
  reviewCount?: number
  sentiment?: string
  mustPlay: boolean
  platforms: string[]
  genres: string[]
  url: string
}

/** Metacritic score on a single platform. */
export interface MetacriticPlatformScore {
  platform: string
  score?: number
  reviewCount?: number
  releaseDate?: string
}

/** Full details of a Metacritic page. */
export interface MetacriticDetails extends MetacriticCandidate {
  description?: string
  positiveCount?: number
  neutralCount?: number
  negativeCount?: number
  platformScores: MetacriticPlatformScore[]
}

export interface MetacriticRequest {
  title: string
  year?: number
  /** Game platform, used to pick the right score. */
  platform?: string
  /** API key (optional: there is a public default). */
  apiKey?: string
}

export interface MetacriticMatch {
  candidate: MetacriticCandidate
  /** Similarity 0-1 between the searched title and the result. */
  score: number
}

export interface MetacriticResponse {
  best: MetacriticMatch | null
  alternatives: MetacriticCandidate[]
}

export interface MetacriticDetailsRequest {
  slug: string
  apiKey?: string
}

/** Average play durations, always in minutes. */
export interface GameDurations {
  /** Main story only. */
  main?: number
  /** Main story + extras. */
  mainExtra?: number
  /** 100% completion. */
  completionist?: number
  /** Average across all play styles. */
  allStyles?: number
  /** Game id on HowLongToBeat. */
  hltbId?: number
  hltbUrl?: string
  updatedAt?: number
}

/** Normalised video game data, whatever the source. */
export interface GameMetadata {
  provider: ProviderId
  providerId: string
  title: string
  coverUrl?: string
  description?: string
  shortDescription?: string
  genres: string[]
  platforms: string[]
  releaseDate?: string
  releaseYear?: number
  metacritic?: number
  developers: string[]
  publishers: string[]
  website?: string
  externalUrl?: string
  /** Average playtime declared by the source, in hours. */
  playtimeHours?: number
  /** HowLongToBeat durations, when available. */
  durations?: GameDurations
  /** DOS/retro games that run on DOSBox (from GOGDB). */
  usesDosbox?: boolean
}

export interface MetadataSearchRequest {
  query: string
  provider: ProviderChoice
  rawgApiKey?: string
  steamCountry?: string
  gogCountry?: string
  gogCurrency?: string
  limit?: number
}

/** Outcome per individual source in a multi-source search. */
export interface MetadataSourceStatus {
  provider: ProviderId
  count: number
  error?: string
}

export interface MetadataSearchResponse {
  provider: ProviderId
  results: GameMetadata[]
  /** Non-blocking message (missing keys, failed sources…). */
  warning?: string
  /** Per-source detail: which ones replied and which did not. */
  sources: MetadataSourceStatus[]
}

export interface MetadataDetailsRequest {
  provider: ProviderId
  providerId: string
  rawgApiKey?: string
  steamCountry?: string
  gogCountry?: string
  gogCurrency?: string
}

/** HowLongToBeat duration lookup starting from the title. */
export interface DurationsRequest {
  title: string
  year?: number
}

/** A HowLongToBeat match with its reliability score. */
export interface DurationCandidate {
  metadata: GameMetadata
  /** Similarity 0-1 between the searched title and the one found. */
  score: number
}

export interface DurationsResponse {
  /** Best match found, if reliable enough. */
  best: DurationCandidate | null
  /** Other matches, for manual selection. */
  alternatives: DurationCandidate[]
}

/** Preview of a linked page (Open Graph / meta tags). */
export interface LinkPreview {
  url: string
  /** Domain without "www.". */
  host: string
  title?: string
  description?: string
  imageUrl?: string
  faviconUrl?: string
  siteName?: string
}

export interface LinkPreviewRequest {
  url: string
}

/** Extra details on a GOG product, taken from GOGDB (/data, JSON). */
export interface GogdbInfo {
  id: number
  title: string
  slug?: string
  description?: string
  developers: string[]
  publishers: string[]
  releaseDate?: string
  releaseYear?: number
  boxartUrl?: string
  backgroundUrl?: string
  usesDosbox: boolean
  buildCount: number
  lastBuildAt?: string
  buildSystems: string[]
  tags: string[]
  series?: string
  storeUrl?: string
  gogdbUrl: string
}

export interface GogdbRequest {
  /** GOG product id (same id used by gog.com and GOGDB). */
  productId: string
}

export interface AppInfo {
  name: string
  version: string
  electron: string
  chrome: string
  node: string
  platform: string
  arch: string
  userDataPath: string
  isSmoke: boolean
}

/** Shared error codes: the renderer translates them into the active language. */
export type ErrorCode =
  | 'network'
  | 'auth'
  | 'rateLimit'
  | 'http'
  | 'parse'
  | 'missingKey'
  | 'invalidUrl'
  | 'notFound'
  | 'forbidden'
  | 'timeout'
  | 'scheme'
  | 'gameNotFound'
  | 'sessionNotFound'
  | 'noteNotFound'
  | 'noteEmpty'
  | 'linkNotFound'
  | 'linkMissingUrl'
  | 'invalidJson'
  | 'invalidBackup'
  | 'unknown'

/** Details for the message placeholders (e.g. {reason}, {status}). */
export type ErrorDetails = Record<string, string | number>

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: ErrorCode; details?: ErrorDetails }

export interface SaveJsonRequest {
  defaultName: string
  json: string
}

export interface SaveJsonResponse {
  saved: boolean
  path?: string
}

export interface OpenJsonResponse {
  opened: boolean
  path?: string
  json?: string
}

/** Steps of the self-test run by the renderer in smoke mode. */
export interface SmokeStep {
  name: string
  ok: boolean
  detail?: string
  /** Steps that depend on the network: they do not fail the self-test. */
  optional?: boolean
}

export interface SmokeReport {
  ok: boolean
  steps: SmokeStep[]
  counts?: Record<string, number>
  error?: string
}

/**
 * Surface exposed by the preload to the renderer (`window.backlog`).
 * The renderer has no access to Node: everything goes through here.
 */
export interface BacklogApi {
  readonly isSmoke: boolean
  /** Development mode: the app opens a specific view for screenshots. */
  readonly shootView: string | null
  getAppInfo(): Promise<Result<AppInfo>>
  searchMetadata(request: MetadataSearchRequest): Promise<Result<MetadataSearchResponse>>
  getMetadataDetails(request: MetadataDetailsRequest): Promise<Result<GameMetadata | null>>
  getDurations(request: DurationsRequest): Promise<Result<DurationsResponse>>
  getGogdbInfo(request: GogdbRequest): Promise<Result<GogdbInfo | null>>
  getLinkPreview(request: LinkPreviewRequest): Promise<Result<LinkPreview | null>>
  getMetacritic(request: MetacriticRequest): Promise<Result<MetacriticResponse>>
  getMetacriticDetails(request: MetacriticDetailsRequest): Promise<Result<MetacriticDetails | null>>
  saveJsonFile(request: SaveJsonRequest): Promise<Result<SaveJsonResponse>>
  openJsonFile(): Promise<Result<OpenJsonResponse>>
  openExternal(url: string): Promise<Result<boolean>>
  quit(): Promise<void>
  reportSmoke(report: SmokeReport): Promise<Result<boolean>>
}

export interface PickWeights {
  /** How much the fit with the available energy weighs. */
  effort: number
  /** How much the observed/expected pleasure weighs. */
  pleasure: number
  /** How much the manually assigned priority weighs. */
  priority: number
  /** How much "haven't played it in a while / never played" weighs. */
  novelty: number
  /** How much the duration weighs against the time you actually have. */
  duration: number
}

export type AppLanguage = 'en' | 'it'

export interface AppSettings {
  /** Interface language (English is the default). */
  language: AppLanguage
  rawgApiKey: string
  defaultProvider: ProviderChoice
  steamCountry: string
  gogCountry: string
  gogCurrency: string
  /** Automatically look up HowLongToBeat durations when you add a game. */
  hltbAutoEnrich: boolean
  /** Automatically look up the Metascore when you add a game. */
  metacriticAutoEnrich: boolean
  /** Metacritic API key: the public one is fine, it is here only so it can be updated. */
  metacriticApiKey: string
  /** Last filter used in the picker: available energy (1-5). */
  defaultEffortTarget: number
  defaultMaxEffort: number
  defaultMinPleasure: number
  /** Hours available for the session (0 = not specified). */
  timeAvailableHours: number
  /** Maximum accepted duration in hours (0 = no limit). */
  defaultMaxHours: number
  /** Days during which a recently played game is excluded from the draw. */
  avoidRecentDays: number
  weights: PickWeights
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  rawgApiKey: '',
  defaultProvider: 'auto',
  steamCountry: 'IT',
  gogCountry: 'IT',
  gogCurrency: 'EUR',
  hltbAutoEnrich: true,
  metacriticAutoEnrich: true,
  metacriticApiKey: '',
  defaultEffortTarget: 2,
  defaultMaxEffort: 5,
  defaultMinPleasure: 1,
  timeAvailableHours: 0,
  defaultMaxHours: 0,
  avoidRecentDays: 0,
  weights: { effort: 35, pleasure: 30, priority: 10, novelty: 10, duration: 15 }
}
