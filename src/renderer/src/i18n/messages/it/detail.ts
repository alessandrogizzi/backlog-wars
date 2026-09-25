/** Strings for the "detail" area. Italian mirror of en/detail.ts. */
export default {
  // Loading and empty states
  'detail.loading': 'Carico la scheda…',
  'detail.notFound.title': 'Gioco non trovato',
  'detail.notFound.message': 'Forse è stato eliminato.',
  'detail.backToLibrary': 'Torna alla libreria',
  'detail.favorite': 'Preferito',
  'detail.platform.group': 'Gruppo: {group}',

  // Header actions
  'detail.session.log': 'Registra sessione',
  'detail.edit': 'Modifica dati',
  'detail.external': 'Scheda esterna',

  // Played / progress / run stats
  'detail.stat.played': 'Tempo giocato',
  'detail.stat.played.hintManual': '{sessions} sessioni + {manual} dichiarate',
  'detail.stat.played.hint': '{count} sessioni registrate',
  'detail.stat.progress': 'Avanzamento',
  'detail.stat.progress.hint': 'su {duration} di storia principale',
  'detail.stat.progress.noDuration': 'serve una durata stimata',
  'detail.stat.run': 'Partita',
  'detail.started': 'Già iniziata',
  'detail.notStarted': 'Non iniziata',
  'detail.stat.run.since': 'dal {date}',
  'detail.stat.run.hint': "segna l'inizio dal riquadro sotto",
  'detail.stat.satisfaction': 'Soddisfazione media',
  'detail.stat.satisfaction.none': 'nessuna sessione',
  'detail.stat.satisfaction.hint': 'dalle sessioni registrate',
  'detail.stat.effort': 'Effort medio percepito',
  'detail.stat.effort.hint': 'Stimato in libreria: {value}/5',
  'detail.stat.efficiency': 'Resa (piacere/effort)',
  'detail.stat.efficiency.hint': "Quanto ripaga l'impegno",
  'detail.stat.lastSession': 'Ultima sessione',
  'detail.stat.lastSession.daysAgo': '{count} giorni fa',
  'detail.stat.lastSession.never': 'mai avviato',
  'detail.stat.demonstrated': 'Piacere dimostrato',
  'detail.stat.demonstrated.hint': 'Dichiarato: {value}/5',

  // Metacritic
  'detail.metacritic.title': 'Metacritic',
  'detail.metacritic.update': 'Aggiorna punteggio',
  'detail.metacritic.search': 'Cerca su Metacritic',
  'detail.metacritic.open': 'Apri su Metacritic',
  'detail.metacritic.reviews': '{count} recensioni',
  'detail.metacritic.source': 'fonte: {source}',
  'detail.metacritic.platformScores': 'Punteggi per piattaforma',
  'detail.metacritic.noVotes': 'nessun voto',
  'detail.metacritic.critics': 'Critica: {positive} positive · {neutral} miste · {negative} negative',
  'detail.metacritic.empty':
    'Nessun punteggio salvato: usa “Cerca su Metacritic” (la ricerca è automatica anche quando aggiungi un gioco dalle Impostazioni).',
  'detail.metacritic.noPlatforms': 'piattaforme n.d.',
  'detail.metacritic.use': 'Usa questo',
  'detail.metacritic.tone': 'Fascia',
  'detail.metacritic.tone.good': 'Verde',
  'detail.metacritic.tone.mixed': 'Gialla',
  'detail.metacritic.tone.bad': 'Rossa',
  'detail.metacritic.tone.hint': 'stesse soglie di Metacritic: 75+ / 50-74 / sotto 50',

  // Duration (HowLongToBeat)
  'detail.duration.title': 'Durata (HowLongToBeat)',
  'detail.duration.update': 'Aggiorna durate',
  'detail.duration.open': 'Apri su HLTB',
  'detail.duration.match': 'match {percent}%',
  'detail.duration.use': 'Usa questa',
  'detail.duration.remaining': 'Mancano',
  'detail.duration.empty': 'Nessuna durata nota: usa “Aggiorna durate” oppure inseriscila in “Modifica dati”.',

  // GOGDB
  'detail.gogdb.title': 'GOGDB · dati del prodotto GOG',
  'detail.gogdb.open': 'Apri su GOGDB',
  'detail.gogdb.store': 'Pagina GOG',
  'detail.gogdb.builds': '{count} build pubblicate',
  'detail.gogdb.lastBuild': 'ultima {date}',
  'detail.gogdb.series': 'serie: {series}',
  'detail.gogdb.release': 'uscita {year}',
  'detail.gogdb.note':
    'GOGDB non espone una API di ricerca ma pubblica tutti i dati come JSON in /data: qui li usiamo per descrizione, boxart, build e segnalazione DOSBox.',

  // Quick ratings
  'detail.quick.title': 'Valutazioni rapide',
  'detail.quick.status': 'Stato in libreria',
  'detail.quick.effort': 'Effort richiesto',
  'detail.quick.score': 'Il tuo voto',
  'detail.quick.scoreValue': '{score}/{max}',
  'detail.quick.scoreHint': 'non ancora valutato',

  // Playtime
  'detail.playtime.label': "Ore già giocate (fuori dall'app)",
  'detail.playtime.placeholder': 'es. 12',
  'detail.playtime.save': 'Salva ore',
  'detail.playtime.hint': "Prima di usare Backlog Wars o su un'altra piattaforma: si sommano alle sessioni.",
  'detail.playtime.sessions': 'Sessioni:',
  'detail.playtime.declared': 'Dichiarate:',
  'detail.playtime.total': 'Totale:',

  // Session log
  'detail.sessions.title': 'Diario delle sessioni',
  'detail.sessions.total': '{duration} in totale',
  'detail.sessions.empty.title': 'Nessuna sessione registrata',
  'detail.sessions.empty.message': 'Registra la prima sessione per iniziare a misurare tempo, effort e soddisfazione.',
  'detail.sessions.empty.action': 'Registra la prima sessione',
  'detail.sessions.lastNote': 'Ultima nota: {note}',

  // Toasts and confirm dialogs
  'detail.toast.durationNoMatch': 'Nessuna corrispondenza affidabile su HowLongToBeat: scegli fra i suggerimenti.',
  'detail.toast.durationsFrom': 'Durate da “{title}” (match {percent}%).',
  'detail.toast.durationsUpdated': 'Durate aggiornate.',
  'detail.toast.hoursSaved': 'Ore già giocate salvate: {duration}.',
  'detail.toast.hoursReset': 'Ore già giocate azzerate.',
  'detail.toast.metacriticNoMatch': 'Nessuna scheda Metacritic affidabile: scegli fra i suggerimenti.',
  'detail.toast.metascoreFrom': 'Metascore {score} da “{title}”.',
  'detail.toast.metascore': 'Metascore {score}: {title}.',
  'detail.delete.title': 'Eliminare il gioco?',
  'detail.delete.message': '"{title}" e le sue {count} sessioni verranno rimossi definitivamente.',
  'detail.toast.deleted': 'Gioco eliminato.',
  'detail.deleteSession.title': 'Eliminare la sessione?',
  'detail.deleteSession.message': 'Sessione del {date} ({duration}). Verrà rimosso anche il tempo dal totale.',
  'detail.toast.sessionDeleted': 'Sessione eliminata.'
}
