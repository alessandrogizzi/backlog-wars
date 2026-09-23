/** Strings for the "stats" area. Italian mirror of en/stats.ts. */
export default {
  'stats.genre.unknown': 'Genere non indicato',

  // Page
  'stats.title': 'Statistiche',
  'stats.subtitle': 'Qui vedrai tempo, effort e soddisfazione dei tuoi giochi.',
  'stats.loading': 'Calcolo le statistiche…',
  'stats.empty.title': 'Ancora nessun dato',
  'stats.empty.message': 'Aggiungi giochi e registra qualche sessione: qui compariranno grafici, medie e classifiche.',

  // Header
  'stats.header.summary': '{sessions} sessioni su {games} giochi · serie attuale di {streak}',
  'stats.streak.one': '{count} giorno',
  'stats.streak.other': '{count} giorni',

  // KPI cards
  'stats.kpi.totalTime': 'Tempo totale',
  'stats.kpi.totalTime.manual': '{hours} ore, di cui {minutes} dichiarate a mano',
  'stats.kpi.totalTime.all': '{hours} ore complessive',
  'stats.kpi.avgSatisfaction': 'Soddisfazione media',
  'stats.kpi.avgSatisfaction.hint': 'su tutte le sessioni',
  'stats.kpi.avgEffort': 'Effort medio percepito',
  'stats.kpi.avgEffort.hint': 'sessione media: {minutes}',
  'stats.kpi.last30': 'Ultimi 30 giorni',
  'stats.kpi.last30.hint': '{sessions} sessioni in {days} giorni',
  'stats.kpi.gamesInLibrary': 'Giochi in libreria',
  'stats.kpi.gamesInLibrary.hint': '{count} in corso',
  'stats.kpi.finishedDropped': 'Finiti / abbandonati',
  'stats.kpi.finishedDropped.hint': 'backlog: {backlog} · wishlist: {wishlist}',
  'stats.kpi.estimatedBacklog': 'Backlog stimato',
  'stats.kpi.estimatedBacklog.hint': '{hours} ore di sola storia principale',
  'stats.kpi.remaining': 'Manca per finire',
  'stats.kpi.remaining.hint': 'somma dei giochi in corso',
  'stats.kpi.completionist': 'Backlog al 100%',
  'stats.kpi.completionist.hint': 'se volessi completare tutto',
  'stats.kpi.retroTime': 'Tempo retrogaming',
  'stats.kpi.retroTime.hint': "{count} giochi d'epoca giocati",
  'stats.kpi.knownDurations': 'Durate note',
  'stats.kpi.knownDurations.hint': 'giochi con durata HowLongToBeat',
  'stats.kpi.avgMetascore': 'Metascore medio',
  'stats.kpi.avgMetascore.hint': '{count} giochi con punteggio Metacritic',
  'stats.kpi.started': 'Già iniziati',
  'stats.kpi.started.hint': 'giochi con partita iniziata o ore dichiarate',
  'stats.kpi.streak': 'Serie attuale',
  'stats.kpi.streak.hint': 'sessione registrata ogni giorno',

  // Sections
  'stats.weeks.title': 'Tempo per settimana (ultime 8)',
  'stats.effortSatisfaction.title': 'Soddisfazione per effort',
  'stats.effortSatisfaction.hint':
    "Serve a capire quanto l'impegno si traduce in divertimento: cerca la riga con la soddisfazione più alta.",
  'stats.table.sessions': 'Sessioni',
  'stats.topByTime.title': 'Dove è finito il tempo',
  'stats.bestValue.title': 'Miglior resa (piacere / effort)',
  'stats.bestValue.empty': 'Servono almeno 30 minuti registrati su un gioco.',
  'stats.bestValue.entry': 'resa {efficiency} · {minutes} · effort medio {effort}/5',
  'stats.group.title': 'Tempo per tipo di piattaforma',
  'stats.group.entry': '{group} · {count} giochi',
  'stats.platform.title': 'Tempo per piattaforma',
  'stats.genre.title': 'Tempo per genere',
  'stats.recent.title': 'Ultime sessioni',
  'stats.recent.entry': '{minutes} · effort {effort}/5 · soddisfazione {satisfaction}/5',
  'stats.backlogStatus.title': 'Stati del backlog',

  // Shared bits
  'stats.noData': 'Nessun dato.',
  'stats.noSessions': 'Nessuna sessione registrata.',
  'stats.entry.withScore': '{minutes} · {sessions} sessioni · {score}/5',
  'stats.entry.plain': '{minutes} · {sessions} sessioni',
  'stats.deletedGame': 'gioco eliminato'
}
