/**
 * End-to-end self-test run inside the Electron renderer (--smoke mode).
 * Checks that Dexie/IndexedDB, the repository, the selection engine and the
 * statistics really work in the app's real environment.
 */
import { DEFAULT_SETTINGS, type BacklogApi, type SmokeReport, type SmokeStep } from '@shared/types'
import { formatMinutes, todayIso } from '@shared/format'
import { db, readSettings, writeSettings } from '../db/db'
import {
  addLink,
  addNote,
  countLinks,
  countNotes,
  createGame,
  deleteGame,
  logSession,
  updateGame,
  updateLink,
  updateNote
} from '../db/repo'
import { emptyDraft, isLinkEdited, isNoteEdited, normalizeUrl, type Game } from '../db/types'
import {
  DEFAULT_PICK_FILTERS,
  buildBracket,
  buildPool,
  championOf,
  mulberry32,
  pickWinner,
  uniformPick,
  weightedPick
} from '../logic/picker'
import { computeDashboard, isoWeekStart } from '../logic/stats'
import {
  completionRatio,
  durationFit,
  hasStarted,
  manualMinutes,
  playedMinutes,
  referenceMinutes,
  remainingMinutes,
  suggestEffortFromMinutes
} from '../logic/duration'

const SMOKE_TITLE = '__backlog_wars_smoke_test__'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export async function runSelfTest(api: BacklogApi): Promise<SmokeReport> {
  const steps: SmokeStep[] = []
  let gameId: number | null = null

  const step = async (
    name: string,
    run: () => Promise<string | void> | string | void,
    optional = false
  ): Promise<void> => {
    try {
      const detail = await run()
      steps.push({ name, ok: true, detail: typeof detail === 'string' ? detail : undefined, optional })
    } catch (error) {
      steps.push({
        name,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
        optional
      })
    }
  }

  const requireGame = async (): Promise<Game> => {
    assert(gameId !== null, 'test game missing')
    const game = await db.games.get(gameId)
    assert(game, 'test game not found in the database')
    return game
  }

  await step('dexie.open', async () => {
    await db.open()
    return `schema v${db.verno}`
  })

  await step('settings.roundtrip', async () => {
    const before = await readSettings()
    await writeSettings({ ...before, steamCountry: 'SMOKE' })
    const after = await readSettings()
    assert(after.steamCountry === 'SMOKE', 'settings were not read back')
    await writeSettings({ ...DEFAULT_SETTINGS, ...before })
    return 'ok'
  })

  await step('game.create', async () => {
    await db.games.where('title').equals(SMOKE_TITLE).delete()
    gameId = await createGame(
      emptyDraft({ title: SMOKE_TITLE, status: 'backlog', platform: 'PC', effortEstimate: 2, pleasure: 4, priority: 4 })
    )
    assert(typeof gameId === 'number', 'createGame did not return an id')
    return `id=${gameId}`
  })

  await step('session.log', async () => {
    const game = await requireGame()
    await logSession({
      gameId: game.id!,
      date: todayIso(),
      minutes: 60,
      effort: 2,
      satisfaction: 5,
      notes: 'smoke session'
    })
    await logSession({
      gameId: game.id!,
      date: todayIso(Date.now() - 86_400_000),
      minutes: 30,
      effort: 3,
      satisfaction: 3
    })
    return '2 sessions'
  })

  await step('aggregates.recompute', async () => {
    const game = await requireGame()
    assert(game.totalMinutes === 90, `expected 90 minutes, found ${game.totalMinutes}`)
    assert(game.sessionCount === 2, `expected 2 sessions, found ${game.sessionCount}`)
    assert(game.avgSatisfaction === 4, `expected average satisfaction 4, got ${game.avgSatisfaction}`)
    assert(game.avgEffort === 2.5, `expected average effort 2.5, got ${game.avgEffort}`)
    assert(game.status === 'playing', `status should have switched to "playing", got ${game.status}`)
    return `${game.totalMinutes}m, media ${game.avgSatisfaction}/5`
  })

  await step('note.crud', async () => {
    const game = await requireGame()
    const noteId = await addNote(game.id!, '  smoke note  ')
    const created = await db.notes.get(noteId)
    assert(created, 'note not created')
    assert(created.text === 'smoke note', 'note text was not trimmed')
    assert(created.createdAt === created.updatedAt, 'creation timestamps must match')
    assert(!isNoteEdited(created), 'a fresh note is not edited')
    await updateNote(noteId, 'edited note')
    const edited = await db.notes.get(noteId)
    assert(edited?.text === 'edited note', 'the edit was not saved')
    assert(edited.updatedAt >= edited.createdAt, 'invalid modification timestamp')
    assert(isNoteEdited(edited), 'the edited note should be marked as edited')
    const total = await countNotes(game.id!)
    assert(total === 1, `expected 1 note, found ${total}`)
    return 'create, edit and timestamps ok'
  })

  await step('link.crud', async () => {
    const game = await requireGame()
    const linkId = await addLink(game.id!, 'https://www.pcgamingwiki.com/wiki/Portal_2', 'Wiki')
    const created = await db.links.get(linkId)
    assert(created, 'link not created')
    assert(created.host === 'pcgamingwiki.com', `unexpected host: ${created.host}`)
    assert(created.createdAt === created.updatedAt, 'alla creazione i timestamp devono coincidere')
    assert(!isLinkEdited(created), 'a fresh link is not edited')
    await updateLink(linkId, { title: 'Portal 2 - PCGamingWiki', imageUrl: 'https://cdn.example.com/cover.png' })
    const updated = await db.links.get(linkId)
    assert(updated?.title === 'Portal 2 - PCGamingWiki', 'link title was not updated')
    assert(updated.imageUrl === 'https://cdn.example.com/cover.png', 'the preview was not saved')
    assert(isLinkEdited(updated), 'the edited link should be marked as edited')
    const total = await countLinks(game.id!)
    assert(total === 1, `expected 1 link, found ${total}`)
    assert(normalizeUrl('www.example.com') === 'https://www.example.com/', 'wrong URL normalisation')
    assert(normalizeUrl('javascript:alert(1)') === undefined, 'unsafe URL schemes are not blocked')
    return 'create, preview and timestamps ok'
  })

  await step('progress.declared-hours', async () => {
    const game = await requireGame()
    // The game already has two logged sessions: it therefore counts as started.
    assert(hasStarted(game), 'a game with sessions must be marked as started')
    const tracked = game.totalMinutes
    assert(tracked === 90, `minuti tracciati attesi 90, trovati ${tracked}`)

    await updateGame(game.id!, { playedBeforeMinutes: 8 * 60, startedAt: Date.now(), durationMain: 600 })
    const updated = await db.games.get(game.id!)
    assert(updated, 'game not found after the update')
    assert(hasStarted(updated), 'the game should be marked as started')
    assert(manualMinutes(updated) === 480, `expected 480 declared minutes, got ${manualMinutes(updated)}`)
    // 90 minutes of sessions + 8 declared hours
    assert(playedMinutes(updated) === 570, `expected 570 played minutes, got ${playedMinutes(updated)}`)
    // On a 10-hour story (600 minutes) 30 minutes are left.
    assert(remainingMinutes(updated) === 30, `expected 30 remaining minutes, got ${remainingMinutes(updated)}`)
    assert(completionRatio(updated) === 0.95, `expected 0.95 completion, got ${completionRatio(updated)}`)

    await updateGame(game.id!, {
      playedBeforeMinutes: undefined,
      startedAt: undefined,
      durationMain: undefined
    })
    const reset = await db.games.get(game.id!)
    assert(manualMinutes(reset!) === 0, 'declared hours were not cleared')
    return 'ore dichiarate coerenti con quanto manca'
  })

  await step('duration.suggested-effort', async () => {
    const game = await requireGame()
    const withDuration = { ...game, durationMain: 8 * 60, totalMinutes: 120 }
    assert(referenceMinutes(withDuration) === 480, 'wrong reference duration')
    assert(remainingMinutes(withDuration) === 360, 'wrong remaining time')
    assert(suggestEffortFromMinutes(480) === 2, 'wrong suggested effort for 8 hours')
    assert(suggestEffortFromMinutes(60 * 60) === 5, 'wrong suggested effort for 60 hours')
    assert(durationFit(120, 2) === 1, 'a 2-hour game should fit in 2 available hours')
    assert(durationFit(360, 2) < 1, 'a 6-hour game should not fit in 2 available hours')
    return 'durations and suggested effort consistent'
  })

  await step('picker.pool', async () => {
    const game = await requireGame()
    const pool = buildPool(
      [game],
      { ...DEFAULT_PICK_FILTERS, statuses: ['playing'], targetEffort: 2 },
      DEFAULT_SETTINGS.weights
    )
    assert(pool.length === 1, `expected a 1-item pool, found ${pool.length}`)
    const rng = mulberry32(42)
    const smart = weightedPick(pool, rng)
    const random = uniformPick(pool, rng)
    assert(smart?.game.id === game.id && random?.game.id === game.id, 'draw mismatch')
    return `punteggio=${pool[0].score}`
  })

  await step('picker.filters', async () => {
    const game = await requireGame()
    const excluded = buildPool([game], { ...DEFAULT_PICK_FILTERS, maxEffort: 1 }, DEFAULT_SETTINGS.weights)
    assert(excluded.length === 0, 'the max effort filter did not exclude the game')
    const byPleasure = buildPool([game], { ...DEFAULT_PICK_FILTERS, minPleasure: 5 }, DEFAULT_SETTINGS.weights)
    assert(byPleasure.length === 0, 'the min pleasure filter did not exclude the game')
    const byStatus = buildPool([game], { ...DEFAULT_PICK_FILTERS, statuses: ['backlog'] }, DEFAULT_SETTINGS.weights)
    assert(byStatus.length === 0, 'the status filter did not exclude the game')
    return 'filters ok'
  })

  await step('bracket.tournament', async () => {
    const game = await requireGame()
    const extras: Game[] = [1, 2, 3].map((offset) => ({
      ...game,
      id: (game.id ?? 0) + offset,
      title: `${SMOKE_TITLE} ${offset}`
    }))
    const pool = buildPool([game, ...extras], { ...DEFAULT_PICK_FILTERS, statuses: ['playing'] }, DEFAULT_SETTINGS.weights)
    assert(pool.length === 4, `expected 4 items, found ${pool.length}`)
    let bracket = buildBracket(pool, 4, mulberry32(7))
    assert(bracket.rounds[0].length === 2, 'unexpected number of first-round matches')
    for (const match of bracket.rounds[0]) {
      const winner = match.a ?? match.b
      assert(winner, 'first-round match without players')
      bracket = pickWinner(bracket, match.id, winner.id!)
    }
    const final = bracket.rounds[1][0]
    const finalWinner = final.a ?? final.b
    assert(finalWinner, 'final without players')
    bracket = pickWinner(bracket, final.id, finalWinner.id!)
    assert(championOf(bracket)?.id === finalWinner.id, 'wrong tournament champion')
    return `campione: ${championOf(bracket)?.title}`
  })

  await step('stats.dashboard', async () => {
    const [games, sessions] = await Promise.all([db.games.toArray(), db.sessions.toArray()])
    const dashboard = computeDashboard(games, sessions, { now: Date.now(), weeks: 4 })
    assert(dashboard.totalMinutes >= 90, `unexpected total minutes: ${dashboard.totalMinutes}`)
    assert(dashboard.totalSessions >= 2, 'unexpected total sessions')
    assert(dashboard.weeks.length === 4, 'unexpected number of weeks')
    assert(isoWeekStart('2024-03-06') === '2024-03-04', 'wrong week start calculation')
    return `${dashboard.totalSessions} sessioni, ${dashboard.totalMinutes}m`
  })

  await step('cleanup', async () => {
    if (gameId !== null) await deleteGame(gameId)
    const leftovers = await db.games.where('title').startsWith(SMOKE_TITLE).count()
    assert(leftovers === 0, `leftover test records: ${leftovers}`)
    // Notes must follow the game in the delete cascade.
    const notes = await db.notes.count()
    assert(notes === 0, `notes left after deleting the game: ${notes}`)
    const links = await db.links.count()
    assert(links === 0, `links left after deleting the game: ${links}`)
    return 'database clean (games, sessions, notes and links)'
  })

  await step('ipc.appinfo', async () => {
    const info = await api.getAppInfo()
    assert(info.ok, 'getAppInfo replied with an error')
    return `v${info.data.version} · Electron ${info.data.electron}`
  })

  await step('ipc.metadata', async () => {
    const response = await api.searchMetadata({ query: 'a', provider: 'steam' })
    assert(response.ok, 'the metadata search replied with an error')
    assert(response.data.warning !== undefined, 'the short query did not produce the expected warning')
    return 'IPC contract ok'
  })

  // Network check: if the connection is missing the self-test is still valid.
  await step(
    'network.steam',
    async () => {
      const response = await api.searchMetadata({ query: 'portal 2', provider: 'steam', limit: 5 })
      assert(response.ok, response.ok ? '' : response.error)
      assert(response.data.results.length > 0, 'Steam returned no results')
      const first = response.data.results[0]
      return `${response.data.results.length} risultati · primo: ${first.title}`
    },
    true
  )

  await step(
    'network.gog',
    async () => {
      const response = await api.searchMetadata({ query: 'heroes of might and magic 3', provider: 'gog', limit: 8 })
      assert(response.ok, response.ok ? '' : response.error)
      const first = response.data.results[0]
      assert(first, 'GOG returned no results')
      assert(/heroes/i.test(first.title), `unexpected GOG result: ${first.title}`)
      assert(first.providerId.length > 0, 'missing the GOG product id')
      return `primo: ${first.title} (id ${first.providerId})`
    },
    true
  )

  await step(
    'network.hltb',
    async () => {
      const response = await api.getDurations({ title: 'Portal 2', year: 2011 })
      assert(response.ok, response.ok ? '' : response.error)
      const best = response.data.best
      assert(best, 'HowLongToBeat found no matches')
      const main = best.metadata.durations?.main ?? 0
      assert(main > 300 && main < 900, `unexpected main duration: ${main} minutes`)
      return `${best.metadata.title}: storia principale ${formatMinutes(main)} (match ${best.score})`
    },
    true
  )

  await step(
    'network.gogdb',
    async () => {
      const response = await api.getGogdbInfo({ productId: '1207658787' })
      assert(response.ok, response.ok ? '' : response.error)
      const info = response.data
      assert(info, 'GOGDB returned no data')
      assert(info.buildCount > 0, 'no builds reported by GOGDB')
      assert(Boolean(info.description), 'missing GOGDB description')
      return `${info.title} · ${info.buildCount} build · ultima ${info.lastBuildAt ?? '—'}`
    },
    true
  )

  await step(
    'network.link-preview',
    async () => {
      const response = await api.getLinkPreview({ url: 'https://store.steampowered.com/app/620/Portal_2/' })
      assert(response.ok, response.ok ? '' : response.error)
      const preview = response.data
      assert(preview, 'no preview returned')
      assert(/portal 2/i.test(preview.title ?? ''), `unexpected preview title: ${preview.title}`)
      assert(Boolean(preview.imageUrl), "manca l'immagine di anteprima")
      assert(preview.faviconUrl !== undefined, 'missing favicon')
      return `${preview.title?.slice(0, 44)} · ${preview.host}`
    },
    true
  )

  await step(
    'network.metacritic',
    async () => {
      const response = await api.getMetacritic({ title: 'Portal 2', year: 2011 })
      assert(response.ok, response.ok ? '' : response.error)
      const best = response.data.best
      assert(best, 'Metacritic found no matches')
      assert(best.candidate.score === 95, `unexpected Metascore: ${best.candidate.score}`)
      const details = await api.getMetacriticDetails({ slug: best.candidate.slug })
      assert(details.ok, details.ok ? '' : details.error)
      const platformScores = details.data?.platformScores ?? []
      assert(platformScores.length > 0, 'no platform scores')
      return `${best.candidate.title}: Metascore ${best.candidate.score} · ${platformScores.length} piattaforme · mustPlay ${best.candidate.mustPlay}`
    },
    true
  )

  await step(
    'network.auto-retro',
    async () => {
      const response = await api.searchMetadata({ query: 'chrono trigger', provider: 'auto', limit: 10 })
      assert(response.ok, response.ok ? '' : response.error)
      const withDurations = response.data.results.find((entry) => entry.durations?.main)
      assert(withDurations, 'no result with durations: source merge failed')
      const retro = response.data.results.find((entry) => entry.platforms.includes('Super Nintendo'))
      assert(retro, 'no result with a recognised retro platform')
      return `${response.data.sources.map((source) => `${source.provider}:${source.count}`).join(' ')} · ${withDurations.title} con durate`
    },
    true
  )

  const counts = {
    games: await db.games.count(),
    sessions: await db.sessions.count(),
    picks: await db.picks.count()
  }

  return { ok: steps.filter((entry) => !entry.optional).every((entry) => entry.ok), steps, counts }
}
