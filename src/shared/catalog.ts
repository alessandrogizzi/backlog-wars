/**
 * Shared vocabulary: statuses, platforms (PC, console, retrogaming), genres, labels.
 * Pure functions, used by main, renderer and tests.
 */

export type GameStatus = 'backlog' | 'playing' | 'completed' | 'dropped' | 'wishlist'

export interface StatusMeta {
  id: GameStatus
  /** i18n keys: the text lives in the dictionaries (English by default). */
  labelKey: string
  shortKey: string
  hintKey: string
}

export const GAME_STATUSES: StatusMeta[] = [
  { id: 'backlog', labelKey: 'status.backlog.label', shortKey: 'status.backlog.short', hintKey: 'status.backlog.hint' },
  { id: 'playing', labelKey: 'status.playing.label', shortKey: 'status.playing.short', hintKey: 'status.playing.hint' },
  {
    id: 'completed',
    labelKey: 'status.completed.label',
    shortKey: 'status.completed.short',
    hintKey: 'status.completed.hint'
  },
  { id: 'dropped', labelKey: 'status.dropped.label', shortKey: 'status.dropped.short', hintKey: 'status.dropped.hint' },
  { id: 'wishlist', labelKey: 'status.wishlist.label', shortKey: 'status.wishlist.short', hintKey: 'status.wishlist.hint' }
]

export function statusMeta(status: GameStatus): StatusMeta {
  return GAME_STATUSES.find((entry) => entry.id === status) ?? GAME_STATUSES[0]
}

export function statusLabelKey(status: GameStatus): string {
  return statusMeta(status).labelKey
}

/** Statuses worth drawing for the next session. */
export const DEFAULT_PICKABLE_STATUSES: GameStatus[] = ['backlog', 'playing']

/** i18n key of the effort label (1-5). */
export function effortKey(value: number): string {
  return `effort.${Math.min(5, Math.max(1, Math.round(value)))}`
}

/** i18n key of the pleasure label (1-5). */
export function pleasureKey(value: number): string {
  return `pleasure.${Math.min(5, Math.max(1, Math.round(value)))}`
}

/* ------------------------------ Platforms ------------------------------- */

export type PlatformGroup = 'pc' | 'console' | 'handheld' | 'retro' | 'mobile' | 'vr' | 'other'

export interface PlatformMeta {
  name: string
  group: PlatformGroup
  /** Dated hardware: usually played via emulator or on the original machine. */
  retro: boolean
  /** Hint on how to play it today (emulator or RetroArch core). */
  emulator?: string
}

/**
 * Canonical list: PC, modern consoles, handhelds and retrogaming.
 * The order also determines the order in the app's selects.
 */
export const PLATFORMS: PlatformMeta[] = [
  // PC and open systems
  { name: 'PC', group: 'pc', retro: false },
  { name: 'Steam Deck', group: 'pc', retro: false },
  { name: 'macOS', group: 'pc', retro: false },
  { name: 'Linux', group: 'pc', retro: false },
  { name: 'DOS', group: 'retro', retro: true, emulator: 'DOSBox-X o dosbox-staging' },

  // Modern consoles
  { name: 'PlayStation 5', group: 'console', retro: false },
  { name: 'Xbox Series', group: 'console', retro: false },
  { name: 'Nintendo Switch', group: 'console', retro: false },
  { name: 'Nintendo Switch 2', group: 'console', retro: false },
  { name: 'PlayStation 4', group: 'console', retro: false },
  { name: 'Xbox One', group: 'console', retro: false },

  // Modern handhelds
  { name: 'Nintendo 3DS', group: 'handheld', retro: false, emulator: 'Azahar' },
  { name: 'PlayStation Vita', group: 'handheld', retro: false, emulator: 'Vita3K' },
  { name: 'Mobile', group: 'mobile', retro: false },
  { name: 'VR', group: 'vr', retro: false },

  // Retrogaming: home consoles
  { name: 'PlayStation 3', group: 'retro', retro: true, emulator: 'RPCS3' },
  { name: 'Xbox 360', group: 'retro', retro: true, emulator: 'Xenia' },
  { name: 'Wii U', group: 'retro', retro: true, emulator: 'Cemu' },
  { name: 'Wii', group: 'retro', retro: true, emulator: 'Dolphin' },
  { name: 'GameCube', group: 'retro', retro: true, emulator: 'Dolphin' },
  { name: 'PlayStation 2', group: 'retro', retro: true, emulator: 'PCSX2' },
  { name: 'Dreamcast', group: 'retro', retro: true, emulator: 'Flycast' },
  { name: 'PlayStation', group: 'retro', retro: true, emulator: 'DuckStation' },
  { name: 'Nintendo 64', group: 'retro', retro: true, emulator: 'Mupen64Plus-Next (RetroArch)' },
  { name: 'Sega Saturn', group: 'retro', retro: true, emulator: 'Beetle Saturn (RetroArch)' },
  { name: 'Xbox', group: 'retro', retro: true, emulator: 'xemu' },
  { name: 'Super Nintendo', group: 'retro', retro: true, emulator: 'Snes9x (RetroArch)' },
  { name: 'Sega Mega Drive', group: 'retro', retro: true, emulator: 'Genesis Plus GX (RetroArch)' },
  { name: 'Neo Geo', group: 'retro', retro: true, emulator: 'FinalBurn Neo (RetroArch)' },
  { name: 'PC Engine', group: 'retro', retro: true, emulator: 'Beetle PCE (RetroArch)' },
  { name: 'NES', group: 'retro', retro: true, emulator: 'Mesen (RetroArch)' },
  { name: 'Sega Master System', group: 'retro', retro: true, emulator: 'Genesis Plus GX (RetroArch)' },
  { name: 'Atari 2600', group: 'retro', retro: true, emulator: 'Stella' },

  // Retrogaming: handhelds
  { name: 'Game Boy Advance', group: 'handheld', retro: true, emulator: 'mGBA' },
  { name: 'Nintendo DS', group: 'handheld', retro: true, emulator: 'melonDS' },
  { name: 'PSP', group: 'handheld', retro: true, emulator: 'PPSSPP' },
  { name: 'Game Boy Color', group: 'handheld', retro: true, emulator: 'SameBoy (RetroArch)' },
  { name: 'Game Boy', group: 'handheld', retro: true, emulator: 'SameBoy (RetroArch)' },
  { name: 'Game Gear', group: 'handheld', retro: true, emulator: 'Genesis Plus GX (RetroArch)' },
  { name: 'WonderSwan', group: 'handheld', retro: true, emulator: 'Beetle Cygne (RetroArch)' },

  // Retrogaming: computers and arcade
  { name: 'Commodore Amiga', group: 'retro', retro: true, emulator: 'PUAE (RetroArch)' },
  { name: 'Commodore 64', group: 'retro', retro: true, emulator: 'VICE' },
  { name: 'ZX Spectrum', group: 'retro', retro: true, emulator: 'Fuse' },
  { name: 'MSX', group: 'retro', retro: true, emulator: 'blueMSX' },
  { name: 'Arcade / MAME', group: 'retro', retro: true, emulator: 'MAME' },
  { name: 'Retro / Emulatore', group: 'retro', retro: true, emulator: 'RetroArch' },
  { name: 'Altro', group: 'other', retro: false }
]

export const PLATFORM_OPTIONS: string[] = PLATFORMS.map((platform) => platform.name)

export const PLATFORM_GROUPS: Array<{ id: PlatformGroup; labelKey: string; icon: string }> = [
  { id: 'pc', labelKey: 'group.pc', icon: '🖥️' },
  { id: 'console', labelKey: 'group.console', icon: '🎮' },
  { id: 'handheld', labelKey: 'group.handheld', icon: '🕹️' },
  { id: 'retro', labelKey: 'group.retro', icon: '👾' },
  { id: 'mobile', labelKey: 'group.mobile', icon: '📱' },
  { id: 'vr', labelKey: 'group.vr', icon: '🥽' },
  { id: 'other', labelKey: 'group.other', icon: '❔' }
]

const PLATFORM_BY_NAME = new Map(PLATFORMS.map((platform) => [platform.name.toLowerCase(), platform]))

export function platformMeta(name: string): PlatformMeta {
  const key = (name ?? '').trim().toLowerCase()
  return (
    PLATFORM_BY_NAME.get(key) ?? {
      name: (name ?? '').trim() || 'Altro',
      group: 'other',
      retro: false
    }
  )
}

export function platformGroupOf(name: string): PlatformGroup {
  return platformMeta(name).group
}

export function isRetroPlatform(name: string): boolean {
  return platformMeta(name).retro
}

export function emulatorHint(name: string): string | undefined {
  return platformMeta(name).emulator
}

/** i18n key of a platform group label. */
export function platformGroupKey(group: PlatformGroup): string {
  return `group.${group}`
}

/**
 * Maps the platform names of the various APIs (RAWG, Steam, GOG, HowLongToBeat)
 * to the canonical vocabulary. Pattern order matters: from most specific to most generic.
 */
const PLATFORM_ALIASES: Array<[RegExp, string]> = [
  [/steam\s*deck/i, 'Steam Deck'],
  [/nintendo\s*switch\s*2|switch\s*2/i, 'Nintendo Switch 2'],
  [/nintendo\s*switch|\bswitch\b/i, 'Nintendo Switch'],

  [/playstation\s*5|\bps\s*5\b|\bps5\b/i, 'PlayStation 5'],
  [/playstation\s*4|\bps\s*4\b|\bps4\b/i, 'PlayStation 4'],
  [/playstation\s*3|\bps\s*3\b|\bps3\b/i, 'PlayStation 3'],
  [/playstation\s*2|\bps\s*2\b|\bps2\b/i, 'PlayStation 2'],
  [/playstation\s*vita|\bps\s*vita\b|\bvita\b/i, 'PlayStation Vita'],
  [/playstation\s*portable|\bpsp\b/i, 'PSP'],
  [/playstation|\bps\s*one\b|\bpsx\b|\bps1\b/i, 'PlayStation'],

  [/xbox\s*series/i, 'Xbox Series'],
  [/xbox\s*one/i, 'Xbox One'],
  [/xbox\s*360/i, 'Xbox 360'],
  [/original\s*xbox|^xbox$|\bxbox\b/i, 'Xbox'],

  [/wii\s*u/i, 'Wii U'],
  [/\bwii\b/i, 'Wii'],
  [/game\s*cube|gamecube|\bgcn\b/i, 'GameCube'],
  [/nintendo\s*64|\bn64\b/i, 'Nintendo 64'],
  [/super\s*nintendo|super\s*famicom|\bsnes\b/i, 'Super Nintendo'],
  [/nintendo\s*entertainment\s*system|\bnes\b|famicom/i, 'NES'],

  [/nintendo\s*3ds|\b3ds\b/i, 'Nintendo 3DS'],
  [/nintendo\s*dsi\b|\bdsi\b|nintendo\s*ds|\bnds\b|\bds\b/i, 'Nintendo DS'],
  [/game\s*boy\s*advance|\bgba\b/i, 'Game Boy Advance'],
  [/game\s*boy\s*color|\bgbc\b/i, 'Game Boy Color'],
  [/game\s*boy|\bgb\b/i, 'Game Boy'],

  [/sega\s*mega\s*drive|mega\s*drive|sega\s*genesis|\bgenesis\b/i, 'Sega Mega Drive'],
  [/sega\s*master\s*system|master\s*system/i, 'Sega Master System'],
  [/sega\s*saturn|\bsaturn\b/i, 'Sega Saturn'],
  [/dreamcast/i, 'Dreamcast'],
  [/game\s*gear/i, 'Game Gear'],
  [/neo\s*geo/i, 'Neo Geo'],
  [/pc\s*engine|turbo\s*grafx|turbografx/i, 'PC Engine'],
  [/wonder\s*swan/i, 'WonderSwan'],

  [/atari\s*(2600|vcs)/i, 'Atari 2600'],
  [/atari/i, 'Atari 2600'],
  [/commodore\s*64|\bc64\b/i, 'Commodore 64'],
  [/amiga/i, 'Commodore Amiga'],
  [/zx\s*spectrum|\bspectrum\b/i, 'ZX Spectrum'],
  [/\bmsx\b/i, 'MSX'],
  [/arcade|mame|coin-?op|neo-?geo\s*aes/i, 'Arcade / MAME'],

  [/ms-?dos|dosbox|^dos$|\bdos\b/i, 'DOS'],
  [/mac\s*os|macos|os\s*x|macintosh|\bmac\b/i, 'macOS'],
  [/^linux$|\blinux\b|steam\s*os/i, 'Linux'],
  [/windows|microsoft|\bwin(32|64|dows)\b|^pc\b|\bpc$|\bpc\b/i, 'PC'],

  [/android|ios|iphone|ipad|\bmobile\b/i, 'Mobile'],
  [/oculus|meta\s*quest|\bquest\b|\bvive\b|\bvr\b|psvr/i, 'VR'],

  // Vintage computers with no dedicated entry: they end up in the retro catch-all.
  [/amstrad|commodore|vic-?20|apple\s*ii|pc-?88|pc-?98|x68000|sharp\s*x1|msx\s*2/i, 'Retro / Emulatore'],
  [/emul|retro|classic|mini\s*console|virtual\s*console/i, 'Retro / Emulatore']
]

/** Maps a platform name from any source to the canonical vocabulary. */
export function normalizePlatformName(raw: string): string {
  const value = (raw ?? '').trim()
  if (!value) return 'Altro'
  for (const [pattern, canonical] of PLATFORM_ALIASES) {
    if (pattern.test(value)) return canonical
  }
  return 'Altro'
}

export function normalizePlatforms(raws: string[]): string[] {
  const out: string[] = []
  for (const raw of raws ?? []) {
    const canonical = normalizePlatformName(raw)
    if (!out.includes(canonical)) out.push(canonical)
  }
  return out
}

/** Platforms parsed from a comma-separated string of names (HowLongToBeat). */
export function normalizePlatformList(value?: string | null): string[] {
  if (!value) return []
  return normalizePlatforms(value.split(/\s*,\s*/).filter(Boolean))
}

/* ----------------------------- Metacritic ------------------------------- */

/**
 * Quality band of a Metascore, with the same thresholds Metacritic uses:
 * green from 75 up, yellow between 50 and 74, red below 50.
 */
export type ScoreTone = 'good' | 'mixed' | 'bad' | 'none'

export function metacriticTone(score?: number | null): ScoreTone {
  if (typeof score !== 'number' || !Number.isFinite(score) || score <= 0) return 'none'
  if (score >= 75) return 'good'
  if (score >= 50) return 'mixed'
  return 'bad'
}

/** i18n key of a Metascore quality band. */
export function toneKey(score?: number | null): string {
  return `tone.${metacriticTone(score)}`
}

/* --------------------------------- Genres -------------------------------- */

export const GENRE_OPTIONS: string[] = [
  'Action',
  'Adventure',
  'RPG',
  'JRPG',
  'Strategy',
  'Tactical',
  'Simulation',
  'Management',
  'Platform',
  'Puzzle',
  'Shooter',
  'Fighting',
  'Racing',
  'Sports',
  'Stealth',
  'Survival / Horror',
  'Metroidvania',
  'Roguelike',
  'Sandbox',
  'Narrative',
  'Indie',
  'MMO',
  'Party / Casual',
  'Retro'
]

/**
 * Canonical genres used up to schema v3 (in Italian): the v4 migration rewrites
 * them in English, which is the app's reference vocabulary.
 */
export const LEGACY_GENRE_MAP: Record<string, string> = {
  Azione: 'Action',
  Avventura: 'Adventure',
  Strategia: 'Strategy',
  Tattico: 'Tactical',
  Simulazione: 'Simulation',
  Gestionale: 'Management',
  Sparatutto: 'Shooter',
  Picchiaduro: 'Fighting',
  Corse: 'Racing',
  Sport: 'Sports',
  Narrativo: 'Narrative'
}

const GENRE_ALIASES: Array<[RegExp, string]> = [
  [/role[- ]?playing|^rpg$/i, 'RPG'],
  [/jrpg|japanese\s*rpg/i, 'JRPG'],
  [/shooter|sparatutto|fps/i, 'Shooter'],
  [/action|\bazione\b/i, 'Action'],
  [/adventure|avventura/i, 'Adventure'],
  [/strategy|strategia/i, 'Strategy'],
  [/simulat|\bsimulazione\b/i, 'Simulation'],
  [/tactic|tattic|turn[- ]?based|a\s*turni/i, 'Tactical'],
  [/management|gestionale|city\s*builder/i, 'Management'],
  [/platform/i, 'Platform'],
  [/puzzle/i, 'Puzzle'],
  [/fight|picchiaduro/i, 'Fighting'],
  [/racing|corse|corsa/i, 'Racing'],
  [/sport/i, 'Sports'],
  [/stealth/i, 'Stealth'],
  [/survival|horror/i, 'Survival / Horror'],
  [/metroidvania/i, 'Metroidvania'],
  [/rogue/i, 'Roguelike'],
  [/sandbox|open\s*world/i, 'Sandbox'],
  [/narrat|visual\s*novel|story/i, 'Narrative'],
  [/indie/i, 'Indie'],
  [/massively|multiplayer|mmo/i, 'MMO'],
  [/casual|party/i, 'Party / Casual'],
  [/retro|classic|arcade/i, 'Retro']
]

export function normalizeGenreName(raw: string): string | null {
  const value = (raw ?? '').trim()
  if (!value) return null
  for (const [pattern, canonical] of GENRE_ALIASES) {
    if (pattern.test(value)) return canonical
  }
  return null
}

export function normalizeGenres(raws: string[]): string[] {
  const out: string[] = []
  for (const raw of raws ?? []) {
    const canonical = normalizeGenreName(raw)
    if (canonical && !out.includes(canonical)) out.push(canonical)
  }
  return out
}

export function yearFromDate(value?: string | number | null): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : undefined
  const match = /(\d{4})/.exec(String(value))
  if (!match) return undefined
  const year = Number(match[1])
  return year >= 1950 && year <= 2100 ? year : undefined
}
