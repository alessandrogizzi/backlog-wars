import { todayIso } from '@shared/format'
import { db } from './db'
import { createGame, logSession, recomputeGame } from './repo'
import { emptyDraft, linkHost, type GameDraft } from './types'

interface SeedLink {
  url: string
  label?: string
  title?: string
  /** Days ago it was saved. */
  daysAgo: number
}

interface SeedNote {
  text: string
  /** Days ago the note was created. */
  daysAgo: number
  /** Days ago of the last edit (if different from creation). */
  editedDaysAgo?: number
}

interface SeedGame {
  draft: GameDraft
  /** Sessions: [days ago, minutes, effort, satisfaction] */
  sessions: Array<[number, number, number, number]>
  notes?: SeedNote[]
  links?: SeedLink[]
}

/** Indicative HowLongToBeat durations, in hours/minutes. */
const hours = (value: number): number => Math.round(value * 60)

const SEED_GAMES: SeedGame[] = [
  {
    draft: emptyDraft({
      title: 'Hades',
      status: 'playing',
      platform: 'PC',
      genres: ['Roguelike', 'Action', 'Indie'],
      tags: ['quick runs', 'great for short sessions'],
      effortEstimate: 3,
      pleasure: 5,
      priority: 5,
      favorite: 1,
      releaseYear: 2020,
      metacritic: 93,
      metacriticUrl: 'https://www.metacritic.com/game/hades/',
      metacriticReviewCount: 64,
      metacriticSentiment: 'Universal acclaim',
      mustPlay: 1,
      developer: 'Supergiant Games',
      coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145360/library_600x900_2x.jpg',
      externalUrl: 'https://store.steampowered.com/app/1145360',
      hltbId: 61993,
      durationMain: hours(21),
      durationMainExtra: hours(32),
      durationCompletionist: hours(52),
      durationAllStyles: hours(31)
    }),
    sessions: [
      [1, 75, 3, 5],
      [3, 60, 3, 4],
      [6, 95, 4, 5],
      [12, 50, 2, 4]
    ],
    notes: [
      { text: 'Reached the second boss: focus on ranged weapons.', daysAgo: 9, editedDaysAgo: 2 },
      { text: 'Try a run with the pact that raises weapon costs.', daysAgo: 3 }
    ],
    links: [{ url: 'https://www.pcgamingwiki.com/wiki/Hades', label: 'Wiki', title: 'Hades - PCGamingWiki', daysAgo: 8 }]
  },
  {
    draft: emptyDraft({
      title: 'Hollow Knight',
      status: 'backlog',
      platform: 'Nintendo Switch',
      genres: ['Metroidvania', 'Platform', 'Indie'],
      tags: ['long', 'hard'],
      effortEstimate: 4,
      pleasure: 4,
      priority: 4,
      releaseYear: 2017,
      metacritic: 90,
      metacriticUrl: 'https://www.metacritic.com/game/hollow-knight/',
      metacriticReviewCount: 112,
      metacriticSentiment: 'Universal acclaim',
      mustPlay: 1,
      developer: 'Team Cherry',
      coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900_2x.jpg',
      hltbId: 31494,
      durationMain: hours(27),
      durationMainExtra: hours(40),
      durationCompletionist: hours(63),
      durationAllStyles: hours(41)
    }),
    sessions: []
  },
  {
    draft: emptyDraft({
      title: 'The Witcher 3: Wild Hunt',
      status: 'backlog',
      platform: 'PC',
      genres: ['RPG', 'Adventure', 'Sandbox'],
      tags: ['long', 'story-driven'],
      effortEstimate: 5,
      pleasure: 5,
      priority: 4,
      releaseYear: 2015,
      metacritic: 93,
      metacriticUrl: 'https://www.metacritic.com/game/the-witcher-3-wild-hunt/',
      metacriticReviewCount: 64,
      metacriticSentiment: 'Universal acclaim',
      mustPlay: 1,
      developer: 'CD Projekt Red',
      coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900_2x.jpg',
      hltbId: 10270,
      durationMain: hours(51),
      durationMainExtra: hours(103),
      durationCompletionist: hours(172),
      durationAllStyles: hours(105)
    }),
    sessions: []
  },
  {
    draft: emptyDraft({
      title: 'Elden Ring',
      status: 'playing',
      platform: 'PlayStation 5',
      genres: ['RPG', 'Action', 'Sandbox'],
      tags: ['hard', 'huge'],
      effortEstimate: 5,
      pleasure: 4,
      priority: 3,
      releaseYear: 2022,
      metacritic: 96,
      metacriticUrl: 'https://www.metacritic.com/game/elden-ring/',
      metacriticReviewCount: 100,
      metacriticSentiment: 'Universal acclaim',
      mustPlay: 1,
      developer: 'FromSoftware',
      coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900_2x.jpg',
      hltbId: 68151,
      durationMain: hours(58),
      durationMainExtra: hours(100),
      durationCompletionist: hours(133),
      durationAllStyles: hours(103),
      // Resumed long ago: 35 hours already played on console, before tracking sessions.
      playedBeforeMinutes: hours(35),
      startedAt: Date.now() - 60 * 86_400_000
    }),
    sessions: [],
    links: [
      {
        url: 'https://eldenring.wiki.fextralife.com/Elden+Ring+Wiki',
        label: 'Wiki',
        title: 'Elden Ring Wiki - Fextralife',
        daysAgo: 45
      }
    ]
  },
  {
    draft: emptyDraft({
      title: 'Stardew Valley',
      status: 'playing',
      platform: 'Steam Deck',
      genres: ['Simulation', 'Management', 'Indie'],
      tags: ['relaxing', 'evening'],
      effortEstimate: 1,
      pleasure: 4,
      priority: 3,
      releaseYear: 2016,
      metacritic: 89,
      metacriticUrl: 'https://www.metacritic.com/game/stardew-valley/',
      metacriticReviewCount: 100,
      metacriticSentiment: 'Generally favorable reviews',
      developer: 'ConcernedApe',
      coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/library_600x900_2x.jpg',
      hltbId: 33641,
      durationMain: hours(52),
      durationMainExtra: hours(94),
      durationCompletionist: hours(157),
      durationAllStyles: hours(99)
    }),
    sessions: [
      [2, 120, 1, 5],
      [9, 90, 1, 4]
    ],
    notes: [{ text: 'Year 2: still missing the community centre bundles and the legendary fish.', daysAgo: 7 }]
  },
  {
    draft: emptyDraft({
      title: 'Celeste',
      status: 'completed',
      platform: 'PC',
      genres: ['Platform', 'Indie'],
      effortEstimate: 4,
      pleasure: 5,
      priority: 4,
      releaseYear: 2018,
      metacritic: 91,
      metacriticUrl: 'https://www.metacritic.com/game/celeste/',
      metacriticReviewCount: 40,
      metacriticSentiment: 'Universal acclaim',
      mustPlay: 1,
      developer: 'Maddy Makes Games',
      coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/504230/library_600x900_2x.jpg',
      hltbId: 45883,
      durationMain: hours(8),
      durationMainExtra: hours(13),
      durationCompletionist: hours(28),
      durationAllStyles: hours(14)
    }),
    sessions: [
      [20, 180, 5, 5],
      [24, 150, 4, 4]
    ]
  },
  {
    draft: emptyDraft({
      title: 'Disco Elysium',
      status: 'backlog',
      platform: 'PC',
      genres: ['RPG', 'Narrative', 'Indie'],
      tags: ['lots of reading'],
      effortEstimate: 3,
      pleasure: 4,
      priority: 4,
      releaseYear: 2019,
      metacritic: 97,
      metacriticUrl: 'https://www.metacritic.com/game/disco-elysium-the-final-cut/',
      metacriticReviewCount: 112,
      metacriticSentiment: 'Universal acclaim',
      mustPlay: 1,
      developer: 'ZA/UM',
      coverUrl: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/632470/library_600x900_2x.jpg',
      hltbId: 63217,
      durationMain: hours(22),
      durationMainExtra: hours(38),
      durationCompletionist: hours(63),
      durationAllStyles: hours(39)
    }),
    sessions: []
  },
  {
    draft: emptyDraft({
      title: 'Factorio',
      status: 'wishlist',
      platform: 'PC',
      genres: ['Strategy', 'Simulation', 'Management'],
      tags: ['time sink'],
      effortEstimate: 5,
      pleasure: 4,
      priority: 2,
      releaseYear: 2020,
      metacritic: 90,
      metacriticUrl: 'https://www.metacritic.com/game/factorio/',
      metacriticReviewCount: 112,
      metacriticSentiment: 'Universal acclaim',
      mustPlay: 1,
      developer: 'Wube Software',
      durationMain: hours(30),
      durationMainExtra: hours(50),
      durationCompletionist: hours(90)
    }),
    sessions: []
  },

  /* ------------------------------ Retrogaming ----------------------------- */
  {
    draft: emptyDraft({
      title: 'Chrono Trigger',
      status: 'playing',
      platform: 'Super Nintendo',
      genres: ['JRPG', 'RPG', 'Retro'],
      tags: ['classic', 'time travel'],
      effortEstimate: 3,
      pleasure: 5,
      priority: 5,
      favorite: 1,
      releaseYear: 1995,
      developer: 'Square',
      publisher: 'Square',
      provider: 'hltb',
      providerId: '1705',
      hltbId: 1705,
      coverUrl: 'https://howlongtobeat.com/games/1705_Chrono_Trigger.jpg',
      externalUrl: 'https://howlongtobeat.com/game/1705',
      durationMain: hours(23),
      durationMainExtra: hours(27),
      durationCompletionist: hours(45),
      durationAllStyles: hours(26)
    }),
    sessions: [
      [4, 120, 3, 5],
      [11, 90, 3, 4],
      [18, 150, 4, 5]
    ],
    notes: [
      { text: "Already on disc 2: the future part is my favourite.", daysAgo: 12, editedDaysAgo: 4 },
      { text: 'Before moving on: unlock the alternate ending with Magus.', daysAgo: 5 }
    ],
    links: [
      {
        url: 'https://www.pcgamingwiki.com/wiki/Chrono_Trigger',
        label: 'Wiki',
        title: 'Chrono Trigger - PCGamingWiki',
        daysAgo: 12
      },
      { url: 'https://www.speedrun.com/chrono_trigger', label: 'Guida', title: 'Chrono Trigger - speedrun.com', daysAgo: 6 }
    ]
  },
  {
    draft: emptyDraft({
      title: 'Super Metroid',
      status: 'completed',
      platform: 'Super Nintendo',
      genres: ['Metroidvania', 'Action', 'Retro'],
      tags: ['genre-defining'],
      effortEstimate: 3,
      pleasure: 5,
      priority: 4,
      releaseYear: 1994,
      developer: 'Nintendo R&D1',
      provider: 'hltb',
      providerId: '9390',
      hltbId: 9390,
      coverUrl: 'https://howlongtobeat.com/games/250px-Smetroidbox.jpg',
      durationMain: hours(7),
      durationMainExtra: hours(9),
      durationCompletionist: hours(11),
      durationAllStyles: hours(9)
    }),
    sessions: [
      [30, 180, 4, 5],
      [33, 120, 3, 5]
    ],
    links: [
      { url: 'https://www.speedrun.com/super_metroid', label: 'Guida', title: 'Super Metroid - speedrun.com', daysAgo: 26 }
    ]
  },
  {
    draft: emptyDraft({
      title: 'Heroes of Might and Magic III',
      status: 'playing',
      platform: 'DOS',
      genres: ['Strategy', 'Tactical', 'Retro'],
      tags: ['turn-based', 'endless'],
      effortEstimate: 4,
      pleasure: 5,
      priority: 4,
      releaseYear: 1999,
      developer: 'New World Computing',
      publisher: 'Ubisoft',
      provider: 'gog',
      providerId: '1207658787',
      usesDosbox: 1,
      coverUrl:
        'https://images.gog-statics.com/869b56a1048405d97f48358ea537af2c08c9d8cd508f8e4a82883bf8eafad361.jpg',
      externalUrl: 'https://www.gog.com/game/heroes_of_might_and_magic_3_complete_edition',
      durationMain: hours(40),
      durationMainExtra: hours(80),
      durationCompletionist: hours(150)
    }),
    sessions: [
      [5, 150, 3, 5],
      [15, 120, 3, 4]
    ],
    notes: [
      { text: 'Halfway through the Roland campaign on an XL map: turn times need patience.', daysAgo: 20, editedDaysAgo: 6 }
    ]
  },
  {
    draft: emptyDraft({
      title: 'Castlevania: Symphony of the Night',
      status: 'backlog',
      platform: 'PlayStation',
      genres: ['Metroidvania', 'Action', 'Retro'],
      tags: ['to catch up on'],
      effortEstimate: 3,
      pleasure: 4,
      priority: 4,
      releaseYear: 1997,
      developer: 'Konami',
      durationMain: hours(9),
      durationMainExtra: hours(12),
      durationCompletionist: hours(21)
    }),
    sessions: []
  }
]

/** Populates the database with sample data (useful on first launch). */
export async function seedDemoData(): Promise<number> {
  let created = 0
  for (const entry of SEED_GAMES) {
    const existing = await db.games.where('title').equals(entry.draft.title).first()
    if (existing) continue
    const gameId = await createGame(entry.draft)
    created += 1
    for (const [daysAgo, minutes, effort, satisfaction] of entry.sessions) {
      const date = todayIso(Date.now() - daysAgo * 86_400_000)
      await logSession({ gameId, date, minutes, effort, satisfaction, statusAfter: entry.draft.status })
    }
    for (const link of entry.links ?? []) {
      const createdAt = Date.now() - link.daysAgo * 86_400_000
      await db.links.add({
        gameId,
        url: link.url,
        label: link.label,
        title: link.title,
        host: linkHost(link.url),
        createdAt,
        updatedAt: createdAt
      })
    }
    for (const note of entry.notes ?? []) {
      const createdAt = Date.now() - note.daysAgo * 86_400_000
      const updatedAt = note.editedDaysAgo !== undefined ? Date.now() - note.editedDaysAgo * 86_400_000 : createdAt
      await db.notes.add({ gameId, text: note.text, createdAt, updatedAt })
    }
    await recomputeGame(gameId, entry.draft.status)
  }
  return created
}
