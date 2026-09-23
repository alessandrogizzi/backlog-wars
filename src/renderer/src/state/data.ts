import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Game, GameLink, GameNote, PickRecord, PlaySession } from '../db/types'

/** Reactive queries: Dexie notifies React on every database change. */
export function useGames(): Game[] | undefined {
  return useLiveQuery<Game[]>(() => db.games.orderBy('updatedAt').reverse().toArray(), [])
}

/** `undefined` = loading, `null` = game does not exist. */
export function useGame(gameId: number | null | undefined): Game | null | undefined {
  return useLiveQuery<Game | null, undefined>(
    () => (gameId ? db.games.get(gameId).then((game) => game ?? null) : Promise.resolve(null)),
    [gameId],
    undefined
  )
}

export function useSessions(): PlaySession[] | undefined {
  return useLiveQuery<PlaySession[]>(() => db.sessions.orderBy('startedAt').reverse().toArray(), [])
}

export function useSessionsForGame(gameId: number | null | undefined): PlaySession[] | undefined {
  return useLiveQuery<PlaySession[]>(
    () =>
      gameId
        ? db.sessions.where('gameId').equals(gameId).reverse().sortBy('startedAt')
        : Promise.resolve<PlaySession[]>([]),
    [gameId]
  )
}

/** Notes for a game, newest to oldest. */
export function useNotesForGame(gameId: number | null | undefined): GameNote[] | undefined {
  return useLiveQuery<GameNote[]>(
    () =>
      gameId
        ? db.notes
            .where('gameId')
            .equals(gameId)
            .toArray()
            .then((notes) => notes.sort((a, b) => b.createdAt - a.createdAt))
        : Promise.resolve<GameNote[]>([]),
    [gameId]
  )
}

/** Useful links for a game, newest to oldest. */
export function useLinksForGame(gameId: number | null | undefined): GameLink[] | undefined {
  return useLiveQuery<GameLink[]>(
    () =>
      gameId
        ? db.links
            .where('gameId')
            .equals(gameId)
            .toArray()
            .then((links) => links.sort((a, b) => b.createdAt - a.createdAt))
        : Promise.resolve<GameLink[]>([]),
    [gameId]
  )
}

/** How many links each game has: used for the badge on library cards. */
export function useLinkCounts(): Map<number, number> | undefined {
  return useLiveQuery<Map<number, number>>(async () => {
    const links = await db.links.toArray()
    const counts = new Map<number, number>()
    for (const link of links) counts.set(link.gameId, (counts.get(link.gameId) ?? 0) + 1)
    return counts
  }, [])
}

export function usePickHistory(limit = 20): PickRecord[] | undefined {
  return useLiveQuery<PickRecord[]>(() => db.picks.orderBy('pickedAt').reverse().limit(limit).toArray(), [limit])
}
