/**
 * Persistence-layer (Dexie) tests on in-memory IndexedDB.
 * They cover aggregates, status transitions, delete cascades and backups.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, readSettings, writeSettings } from '@renderer/db/db'
import {
  addLink,
  addNote,
  clearAllData,
  countLinks,
  countNotes,
  createGame,
  dateToTimestamp,
  deleteGame,
  deleteLink,
  deleteNote,
  deleteSession,
  exportBundle,
  importBundle,
  logSession,
  markPickAccepted,
  recordPick,
  recomputeGame,
  setGameStatus,
  toggleFavorite,
  updateGame,
  updateLink,
  updateNote,
  updateSession
} from '@renderer/db/repo'
import { emptyDraft, isLinkEdited, isNoteEdited } from '@renderer/db/types'

const draft = (overrides = {}) =>
  emptyDraft({ title: 'Gioco di prova', platform: 'PC', effortEstimate: 3, pleasure: 4, ...overrides })

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('giochi', () => {
  it('crea un gioco con gli aggregati a zero', async () => {
    const id = await createGame(draft())
    const game = await db.games.get(id)
    expect(game).toBeDefined()
    expect(game).toMatchObject({
      title: 'Gioco di prova',
      status: 'backlog',
      totalMinutes: 0,
      sessionCount: 0,
      avgSatisfaction: null,
      lastPlayedAt: null,
      favorite: 0
    })
    expect(game!.addedAt).toBeGreaterThan(0)
  })

  it('ripulisce il titolo e imposta completedAt quando nasce finito', async () => {
    const id = await createGame(draft({ title: '  Celeste  ', status: 'completed' }))
    const game = await db.games.get(id)
    expect(game?.title).toBe('Celeste')
    expect(game?.completedAt).toBeGreaterThan(0)
  })

  it('aggiorna i campi e azzera completedAt cambiando stato', async () => {
    const id = await createGame(draft({ status: 'completed' }))
    await updateGame(id, { status: 'playing', pleasure: 5 })
    const game = await db.games.get(id)
    expect(game?.pleasure).toBe(5)
    expect(game?.completedAt).toBeNull()
  })

  it('imposta lo stato e alterna i preferiti', async () => {
    const id = await createGame(draft())
    await setGameStatus(id, 'dropped')
    expect((await db.games.get(id))?.status).toBe('dropped')
    await toggleFavorite(id)
    expect((await db.games.get(id))?.favorite).toBe(1)
    await toggleFavorite(id)
    expect((await db.games.get(id))?.favorite).toBe(0)
  })

  it('elimina il gioco con le sue sessioni e i suoi sorteggi', async () => {
    const id = await createGame(draft())
    await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 4 })
    await recordPick({ gameId: id, mode: 'smart', accepted: 0 })
    await deleteGame(id)
    expect(await db.games.get(id)).toBeUndefined()
    expect(await db.sessions.where('gameId').equals(id).count()).toBe(0)
    expect(await db.picks.where('gameId').equals(id).count()).toBe(0)
  })
})

describe('sessioni', () => {
  it('ricalcola tempo, medie e ultima sessione', async () => {
    const id = await createGame(draft())
    await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 2, satisfaction: 5 })
    await logSession({ gameId: id, date: '2024-06-03', minutes: 30, effort: 4, satisfaction: 3 })
    const game = await db.games.get(id)
    expect(game?.totalMinutes).toBe(90)
    expect(game?.sessionCount).toBe(2)
    expect(game?.avgSatisfaction).toBe(4)
    expect(game?.avgEffort).toBe(3)
    expect(game?.lastPlayedAt).toBe(dateToTimestamp('2024-06-03'))
  })

  it('porta il gioco da backlog a in corso alla prima sessione', async () => {
    const id = await createGame(draft({ status: 'backlog' }))
    await logSession({ gameId: id, date: '2024-06-01', minutes: 45, effort: 3, satisfaction: 3 })
    expect((await db.games.get(id))?.status).toBe('playing')
  })

  it('rispetta lo stato scelto dopo la sessione', async () => {
    const id = await createGame(draft({ status: 'playing' }))
    await logSession({
      gameId: id,
      date: '2024-06-01',
      minutes: 45,
      effort: 3,
      satisfaction: 5,
      statusAfter: 'completed'
    })
    const game = await db.games.get(id)
    expect(game?.status).toBe('completed')
    expect(game?.completedAt).not.toBeNull()
  })

  it('non tocca lo stato di un gioco già abbandonato', async () => {
    const id = await createGame(draft({ status: 'dropped' }))
    await logSession({ gameId: id, date: '2024-06-01', minutes: 30, effort: 1, satisfaction: 2 })
    expect((await db.games.get(id))?.status).toBe('dropped')
  })

  it('normalizza i valori fuori scala', async () => {
    const id = await createGame(draft())
    const sessionId = await logSession({ gameId: id, date: '2024-06-01', minutes: 0, effort: 9, satisfaction: 0 })
    const session = await db.sessions.get(sessionId)
    expect(session?.minutes).toBe(1)
    expect(session?.effort).toBe(5)
    expect(session?.satisfaction).toBe(1)
  })

  it('ricalcola gli aggregati modificando una sessione', async () => {
    const id = await createGame(draft())
    const sessionId = await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 4 })
    await updateSession(sessionId, { minutes: 120, satisfaction: 2 })
    const game = await db.games.get(id)
    expect(game?.totalMinutes).toBe(120)
    expect(game?.avgSatisfaction).toBe(2)
  })

  it('ricalcola gli aggregati eliminando una sessione', async () => {
    const id = await createGame(draft())
    const first = await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 4 })
    await logSession({ gameId: id, date: '2024-06-02', minutes: 30, effort: 5, satisfaction: 5 })
    await deleteSession(first)
    const game = await db.games.get(id)
    expect(game?.totalMinutes).toBe(30)
    expect(game?.sessionCount).toBe(1)
    expect(game?.avgSatisfaction).toBe(5)
  })

  it('rifiuta le sessioni di giochi inesistenti', async () => {
    await expect(
      logSession({ gameId: 999, date: '2024-06-01', minutes: 30, effort: 3, satisfaction: 3 })
    ).rejects.toMatchObject({ code: 'gameNotFound' })
  })

  it('azzera gli aggregati rimuovendo tutte le sessioni', async () => {
    const id = await createGame(draft())
    const sessionId = await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 4 })
    await deleteSession(sessionId)
    await recomputeGame(id)
    const game = await db.games.get(id)
    expect(game?.totalMinutes).toBe(0)
    expect(game?.avgSatisfaction).toBeNull()
    expect(game?.lastPlayedAt).toBeNull()
  })
})

describe('sorteggi', () => {
  it('registra e conferma un sorteggio', async () => {
    const id = await createGame(draft())
    const pickId = await recordPick({ gameId: id, mode: 'roulette', accepted: 0, filters: 'effort≤3' })
    expect(await db.picks.count()).toBe(1)
    await markPickAccepted(pickId)
    expect((await db.picks.get(pickId))?.accepted).toBe(1)
  })
})

describe('impostazioni', () => {
  it('restituisce i valori predefiniti quando non salvate', async () => {
    const settings = await readSettings()
    expect(settings.defaultProvider).toBe('auto')
    expect(settings.weights.effort).toBe(35)
    expect(settings.weights.duration).toBe(15)
    expect(settings.hltbAutoEnrich).toBe(true)
  })

  it('completa i pesi mancanti leggendo un salvataggio di una versione precedente', async () => {
    await db.settings.put({
      key: 'app',
      value: { rawgApiKey: 'x', weights: { effort: 50, pleasure: 20, priority: 10, novelty: 20 } }
    })
    const settings = await readSettings()
    expect(settings.rawgApiKey).toBe('x')
    expect(settings.weights.effort).toBe(50)
    expect(settings.weights.duration).toBe(15)
  })

  it('salva e rilegge le impostazioni', async () => {
    await writeSettings({ ...(await readSettings()), rawgApiKey: 'abc', steamCountry: 'US' })
    const settings = await readSettings()
    expect(settings.rawgApiKey).toBe('abc')
    expect(settings.steamCountry).toBe('US')
  })
})

describe('backup', () => {
  it('esporta tutto il contenuto', async () => {
    const id = await createGame(draft({ title: 'Hades' }))
    await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 5 })
    await recordPick({ gameId: id, mode: 'smart', accepted: 1 })
    const bundle = await exportBundle()
    expect(bundle.app).toBe('backlog-wars')
    expect(bundle.games).toHaveLength(1)
    expect(bundle.sessions).toHaveLength(1)
    expect(bundle.picks).toHaveLength(1)
  })

  it('reimporta in modalità sostituisci rimappando gli id', async () => {
    const id = await createGame(draft({ title: 'Hades' }))
    await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 5 })
    await recordPick({ gameId: id, mode: 'smart', accepted: 1 })
    const json = JSON.stringify(await exportBundle())
    await clearAllData()

    const report = await importBundle(json, 'replace')
    expect(report).toMatchObject({ games: 1, sessions: 1, skipped: 0, mode: 'replace' })

    const games = await db.games.toArray()
    const sessions = await db.sessions.toArray()
    const picks = await db.picks.toArray()
    expect(games).toHaveLength(1)
    expect(games[0].title).toBe('Hades')
    expect(sessions[0].gameId).toBe(games[0].id)
    expect(picks[0].gameId).toBe(games[0].id)
    expect(games[0].totalMinutes).toBe(60)
  })

  it('in modalità unisci salta i duplicati e le sessioni orfane', async () => {
    const id = await createGame(draft({ title: 'Hades' }))
    await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 5 })
    const json = JSON.stringify(await exportBundle())

    const report = await importBundle(json, 'merge')
    expect(report.games).toBe(0)
    expect(report.skipped).toBeGreaterThan(0)
    expect(await db.games.count()).toBe(1)
    expect(await db.sessions.count()).toBe(1)
  })

  it('unisce un backup con giochi nuovi', async () => {
    const other = await createGame(draft({ title: 'Celeste' }))
    await logSession({ gameId: other, date: '2024-06-02', minutes: 30, effort: 4, satisfaction: 4 })
    const json = JSON.stringify(await exportBundle())
    await clearAllData()
    await createGame(draft({ title: 'Hades' }))

    const report = await importBundle(json, 'merge')
    expect(report.games).toBe(1)
    expect(await db.games.count()).toBe(2)
    const celeste = await db.games.where('title').equals('Celeste').first()
    expect(celeste?.totalMinutes).toBe(30)
  })

  it('rifiuta file che non sono backup di Backlog Wars', async () => {
    await expect(importBundle('{"app":"other"}', 'merge')).rejects.toMatchObject({ code: 'invalidBackup' })
    await expect(importBundle('not json', 'merge')).rejects.toMatchObject({ code: 'invalidJson' })
  })
})

describe('cancellazione totale', () => {
  it('svuota tutte le tabelle', async () => {
    const id = await createGame(draft())
    await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 4 })
    await recordPick({ gameId: id, mode: 'smart', accepted: 0 })
    await writeSettings({ ...(await readSettings()), rawgApiKey: 'xyz' })
    await clearAllData()
    expect(await db.games.count()).toBe(0)
    expect(await db.sessions.count()).toBe(0)
    expect(await db.picks.count()).toBe(0)
    expect((await readSettings()).rawgApiKey).toBe('')
  })
})

describe('note', () => {
  it('crea una nota con creazione e modifica coincidenti', async () => {
    const id = await createGame(draft())
    const noteId = await addNote(id, '  Sono già al cd 2  ')
    const note = await db.notes.get(noteId)
    expect(note?.gameId).toBe(id)
    expect(note?.text).toBe('Sono già al cd 2')
    expect(note?.createdAt).toBe(note?.updatedAt)
    expect(isNoteEdited(note!)).toBe(false)
  })

  it('permette più note per gioco, dalla più recente alla più vecchia', async () => {
    const id = await createGame(draft())
    await addNote(id, 'Prima nota')
    await new Promise((resolve) => setTimeout(resolve, 5))
    await addNote(id, 'Seconda nota')
    expect(await countNotes(id)).toBe(2)
    const notes = await db.notes.where('gameId').equals(id).toArray()
    const sorted = notes.sort((a, b) => b.createdAt - a.createdAt)
    expect(sorted[0].text).toBe('Seconda nota')
  })

  it('modifica il testo aggiornando solo il timestamp di modifica', async () => {
    const id = await createGame(draft())
    const noteId = await addNote(id, 'Versione iniziale')
    const before = await db.notes.get(noteId)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await updateNote(noteId, 'Versione corretta')
    const after = await db.notes.get(noteId)
    expect(after?.text).toBe('Versione corretta')
    expect(after?.createdAt).toBe(before?.createdAt)
    expect(after!.updatedAt).toBeGreaterThan(before!.updatedAt)
    expect(isNoteEdited(after!)).toBe(true)
  })

  it('rifiuta note vuote o giochi inesistenti', async () => {
    const id = await createGame(draft())
    await expect(addNote(id, '   ')).rejects.toMatchObject({ code: 'noteEmpty' })
    await expect(addNote(999, 'Note')).rejects.toMatchObject({ code: 'gameNotFound' })
  })

  it('elimina una singola nota', async () => {
    const id = await createGame(draft())
    const noteId = await addNote(id, 'Da eliminare')
    await deleteNote(noteId)
    expect(await countNotes(id)).toBe(0)
  })

  it('elimina le note insieme al gioco', async () => {
    const id = await createGame(draft())
    await addNote(id, 'Nota 1')
    await addNote(id, 'Nota 2')
    await deleteGame(id)
    expect(await db.notes.where('gameId').equals(id).count()).toBe(0)
  })

  it('esporta e reimporta le note rimappando gli id', async () => {
    const id = await createGame(draft({ title: 'Chrono Trigger' }))
    const noteId = await addNote(id, 'Sono già al cd 2')
    await updateNote(noteId, 'Sono al cd 2, quasi alla fine')
    const json = JSON.stringify(await exportBundle())
    await clearAllData()

    const report = await importBundle(json, 'replace')
    expect(report.notes).toBe(1)
    const games = await db.games.toArray()
    const notes = await db.notes.toArray()
    expect(notes).toHaveLength(1)
    expect(notes[0].gameId).toBe(games[0].id)
    expect(notes[0].text).toBe('Sono al cd 2, quasi alla fine')
    expect(isNoteEdited(notes[0])).toBe(true)
  })

  it('recupera le note dei backup vecchi, quando erano un campo del gioco', async () => {
    const legacy = {
      app: 'backlog-wars',
      schema: 1,
      exportedAt: new Date().toISOString(),
      games: [
        {
          ...draft({ title: 'Super Metroid' }),
          id: 42,
          addedAt: 1_000,
          updatedAt: 7_000,
          totalMinutes: 0,
          sessionCount: 0,
          avgSatisfaction: null,
          avgEffort: null,
          lastPlayedAt: null,
          completedAt: null,
          notes: 'Battere Mother Brain senza morire'
        }
      ],
      sessions: [],
      picks: [],
      settings: []
    }
    const report = await importBundle(JSON.stringify(legacy), 'replace')
    expect(report.notes).toBe(1)
    const game = await db.games.where('title').equals('Super Metroid').first()
    const notes = await db.notes.toArray()
    expect(notes[0]).toMatchObject({ gameId: game?.id, text: 'Battere Mother Brain senza morire', createdAt: 7_000 })
    expect((game as unknown as Record<string, unknown>).notes).toBeUndefined()
  })

  it('svuota anche le note con la cancellazione totale', async () => {
    const id = await createGame(draft())
    await addNote(id, 'Nota')
    await clearAllData()
    expect(await db.notes.count()).toBe(0)
  })
})

describe('avanzamento dichiarato', () => {
  it('salva ore già giocate e data di inizio', async () => {
    const id = await createGame(draft({ playedBeforeMinutes: 2100, startedAt: 1_700_000_000_000 }))
    const game = await db.games.get(id)
    expect(game?.playedBeforeMinutes).toBe(2100)
    expect(game?.startedAt).toBe(1_700_000_000_000)
  })

  it('aggiorna e azzera i dati di avanzamento', async () => {
    const id = await createGame(draft())
    await updateGame(id, { playedBeforeMinutes: 600, startedAt: Date.now() })
    expect((await db.games.get(id))?.playedBeforeMinutes).toBe(600)
    await updateGame(id, { playedBeforeMinutes: undefined, startedAt: undefined })
    const game = await db.games.get(id)
    expect(game?.playedBeforeMinutes).toBeUndefined()
    expect(game?.startedAt).toBeUndefined()
  })

  it('conserva le ore dichiarate quando si registra una sessione', async () => {
    const id = await createGame(draft({ playedBeforeMinutes: 1200 }))
    await logSession({ gameId: id, date: '2024-06-01', minutes: 60, effort: 3, satisfaction: 4 })
    const game = await db.games.get(id)
    // totalMinutes stays the session time: declared hours are kept separate
    expect(game?.totalMinutes).toBe(60)
    expect(game?.playedBeforeMinutes).toBe(1200)
  })

  it('esporta e reimporta i dati di avanzamento', async () => {
    const id = await createGame(draft({ title: 'Elden Ring', playedBeforeMinutes: 2100, startedAt: 1_700_000_000_000 }))
    void id
    const json = JSON.stringify(await exportBundle())
    await clearAllData()
    await importBundle(json, 'replace')
    const game = await db.games.where('title').equals('Elden Ring').first()
    expect(game?.playedBeforeMinutes).toBe(2100)
    expect(game?.startedAt).toBe(1_700_000_000_000)
  })
})

describe('link utili', () => {
  it('aggiunge un link con dominio e timestamp', async () => {
    const id = await createGame(draft())
    const linkId = await addLink(id, 'https://www.pcgamingwiki.com/wiki/Hades', 'Wiki')
    const link = await db.links.get(linkId)
    expect(link?.gameId).toBe(id)
    expect(link?.label).toBe('Wiki')
    expect(link?.host).toBe('pcgamingwiki.com')
    expect(link?.createdAt).toBe(link?.updatedAt)
    expect(isLinkEdited(link!)).toBe(false)
  })

  it('rifiuta link senza indirizzo o per giochi inesistenti', async () => {
    const id = await createGame(draft())
    await expect(addLink(id, '   ')).rejects.toMatchObject({ code: 'linkMissingUrl' })
    await expect(addLink(999, 'https://example.com')).rejects.toMatchObject({ code: 'gameNotFound' })
  })

  it('salva e poi aggiorna l\'anteprima, mantenendo la data di creazione', async () => {
    const id = await createGame(draft())
    const linkId = await addLink(id, 'https://example.com/guida')
    const created = await db.links.get(linkId)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await updateLink(linkId, {
      title: 'Guida definitiva',
      description: 'Tutto quello che serve',
      imageUrl: 'https://cdn.example.com/cover.png',
      faviconUrl: 'https://example.com/favicon.ico',
      previewFetchedAt: Date.now()
    })
    const updated = await db.links.get(linkId)
    expect(updated?.title).toBe('Guida definitiva')
    expect(updated?.imageUrl).toBe('https://cdn.example.com/cover.png')
    expect(updated?.previewFetchedAt).toBeGreaterThan(0)
    expect(updated?.createdAt).toBe(created?.createdAt)
    expect(isLinkEdited(updated!)).toBe(true)
  })

  it('aggiorna il dominio quando cambia l\'indirizzo', async () => {
    const id = await createGame(draft())
    const linkId = await addLink(id, 'https://example.com/')
    await updateLink(linkId, { url: 'https://www.speedrun.com/super_metroid' })
    expect((await db.links.get(linkId))?.host).toBe('speedrun.com')
  })

  it('permette più link per gioco e li elimina singolarmente', async () => {
    const id = await createGame(draft())
    const first = await addLink(id, 'https://example.com/uno', 'Guida')
    await addLink(id, 'https://example.com/due', 'Video')
    expect(await countLinks(id)).toBe(2)
    await deleteLink(first)
    expect(await countLinks(id)).toBe(1)
    expect((await db.links.where('gameId').equals(id).toArray())[0].label).toBe('Video')
  })

  it('elimina i link insieme al gioco', async () => {
    const id = await createGame(draft())
    await addLink(id, 'https://example.com/uno')
    await deleteGame(id)
    expect(await db.links.where('gameId').equals(id).count()).toBe(0)
  })

  it('esporta e reimporta i link rimappando gli id', async () => {
    const id = await createGame(draft({ title: 'Hades' }))
    const linkId = await addLink(id, 'https://www.pcgamingwiki.com/wiki/Hades', 'Wiki')
    await updateLink(linkId, { title: 'Hades - PCGamingWiki' })
    const json = JSON.stringify(await exportBundle())
    await clearAllData()

    const report = await importBundle(json, 'replace')
    expect(report.links).toBe(1)
    const games = await db.games.toArray()
    const links = await db.links.toArray()
    expect(links).toHaveLength(1)
    expect(links[0]).toMatchObject({ gameId: games[0].id, host: 'pcgamingwiki.com', title: 'Hades - PCGamingWiki' })
  })

  it('svuota anche i link con la cancellazione totale', async () => {
    const id = await createGame(draft())
    await addLink(id, 'https://example.com/')
    await clearAllData()
    expect(await db.links.count()).toBe(0)
  })
})
