/** Strings for the "play" area: the picker ("What do I play?") and the tournament. Italian mirror of en/play.ts. */
export default {
  // Picker header
  'play.title': 'Cosa gioco adesso?',
  'play.subtitle':
    '{pool} giochi in lizza su {total} · il sorteggio tiene conto di effort, piacere, priorità e quanto tempo è passato',
  'play.loading': "Preparo l'arena…",
  'play.tournamentMode': 'Modalità torneo',

  // Filters
  'play.filters.title': 'Filtri',
  'play.filters.statuses': 'Stati da sorteggiare',
  'play.filters.targetEffort': 'Energia che ho adesso',
  'play.filters.maxEffort': 'Effort massimo tollerato',
  'play.filters.minPleasure': 'Piacere minimo',
  'play.filters.avoidRecent': 'Escludi i giocati negli ultimi',
  'play.filters.days': '{count} giorni',
  'play.filters.platformType': 'Tipo di piattaforma',
  'play.filters.timeAvailable': 'Tempo che ho adesso',
  'play.filters.timeUnset': 'non specificato',
  'play.filters.maxDuration': 'Durata massima (storia principale)',
  'play.filters.noLimit': 'nessun limite',
  'play.filters.neverPlayed': 'Mai giocati',
  'play.filters.favoritesOnly': 'Solo preferiti',

  // Draw weights
  'play.weights.title': 'Pesi del sorteggio',
  'play.weights.effort': "Compatibilità con l'energia",
  'play.weights.pleasure': 'Piacere dimostrato',
  'play.weights.novelty': 'Novità (da quanto non lo giochi)',
  'play.weights.duration': 'Durata rispetto al tempo che ho',
  'play.weights.total': 'Totale pesi: {total}%',
  'play.weights.allZero': '· tutti a zero: estrazione uniforme',
  'play.saveDefaults': 'Salva come predefiniti',
  'play.defaultsSaved': 'Filtri e pesi salvati come predefiniti.',
  'play.noCandidates': 'Nessun gioco corrisponde ai filtri: allarga la selezione.',

  // Slot machine
  'play.mode.smart': 'Sorteggio intelligente',
  'play.mode.random': 'Puro caso',
  'play.slot.rolling': 'Estrazione in corso…',
  'play.slot.drawn': 'Estratto!',
  'play.slot.ready': 'Pronto a estrarre',
  'play.roll.rolling': 'Estraggo…',
  'play.roll.again': 'Rilancia',
  'play.roll.start': 'Estrai il prossimo gioco',
  'play.empty.poolNotice':
    "Nessun gioco passa questi filtri. Prova ad alzare l'effort massimo, abbassare il piacere minimo o includere più stati.",

  // Result card
  'play.result.played.one': 'Giocato {time} in 1 sessione',
  'play.result.played.other': 'Giocato {time} in {count} sessioni',
  'play.result.avgSatisfaction': 'soddisfazione media {value}/5',
  'play.result.story': 'storia {time}',
  'play.result.remaining': 'mancano {time}',
  'play.result.unknownDuration': 'durata sconosciuta: cercala dalla scheda del gioco',
  'play.result.score': 'punteggio',
  'play.breakdown.energy': 'Energia',
  'play.breakdown.novelty': 'Novità',
  'play.breakdown.time': 'Tempo',
  'play.accept': 'Ci gioco: registra sessione',
  'play.reject': 'Non mi va, rilancia',
  'play.discard': 'Scarta',
  'play.openDetail': 'Apri scheda',

  // Pool and recent draws
  'play.pool.title': 'In lizza ({count})',
  'play.pool.sortedByScore': 'ordinati per punteggio',
  'play.pool.emptyTitle': 'Nessun candidato',
  'play.pool.emptyMessage': "Aggiungi giochi al backlog o allarga i filtri per far comparire qualcosa nell'arena.",
  'play.pool.goToLibrary': 'Vai alla libreria',
  'play.pool.row': 'effort {effort}/5 · piacere {pleasure}/5',
  'play.recent.title': 'Ultimi sorteggi',
  'play.recent.smart': 'intelligente',
  'play.recent.random': 'caso',

  // Tournament
  'play.tournament.title': 'Torneo del backlog',
  'play.tournament.subtitle':
    'Sfide a eliminazione diretta: scegli il vincitore di ogni duello e lascia che il backlog decida da solo.',
  'play.tournament.loading': 'Preparo il tabellone…',
  'play.tournament.generate': 'Genera tabellone',
  'play.tournament.needTwo': 'Servono almeno 2 giochi in lizza per fare un torneo.',
  'play.tournament.size': 'Dimensione torneo',
  'play.tournament.sizeGames': '{count} giochi',
  'play.tournament.poolCount': '{count} giochi in lizza',
  'play.tournament.emptyTitle': 'Nessun torneo in corso',
  'play.tournament.emptyMessage':
    'Imposta i filtri e genera un tabellone: i duelli si giocano a colpi di clic, il vincitore va in sessioni.',

  // Bracket
  'play.round.final': 'Finale',
  'play.round.semifinals': 'Semifinali',
  'play.round.number': 'Turno {round}',
  'play.bracket.slot': 'effort {effort}/5 · piacere {pleasure}/5',
  'play.bracket.waiting': 'in attesa…',
  'play.champion.title': 'Campione del backlog',
  'play.champion.stats': '{platform} · effort {effort}/5 · piacere {pleasure}/5',
  'play.champion.playNow': 'Ci gioco adesso',
  'play.champion.newTournament': 'Nuovo torneo'
} as const
