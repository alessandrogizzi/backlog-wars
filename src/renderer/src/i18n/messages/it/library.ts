/** Strings for the "library" area. Italian mirror of en/library.ts. */
export default {
  // View shell
  'library.loading': 'Apro il backlog…',
  'library.stats.count': '{shown} di {total} giochi',
  'library.stats.retroOnly': 'solo retrogaming',
  'library.stats.noMetascore': 'senza Metascore',

  // Header actions
  'library.actions.updateMetascores': 'Aggiorna i Metascore mancanti',
  'library.actions.logSession': 'Registra sessione',

  // Metacritic bulk enrichment
  'library.metacritic.allHave': 'Tutti i giochi hanno un Metascore',
  'library.metacritic.searchFor': 'Cerca il Metascore per {count} giochi',
  'library.metacritic.complete': 'Tutti i giochi in libreria hanno già un Metascore.',
  'library.metacritic.confirmTitle': 'Cercare i Metascore mancanti?',
  'library.metacritic.confirmMessage':
    'Verranno interrogati {count} giochi su Metacritic, uno alla volta. Puoi continuare a usare l\'app.',
  'library.metacritic.updated': 'Metascore aggiornati: {updated} su {total}.',
  'library.metacritic.updatedSkipped': 'Metascore aggiornati: {updated} su {total} · {skipped} senza voto.',

  // Demo data
  'library.seed.added': 'Aggiunti {count} giochi di esempio.',
  'library.seed.present': 'I giochi di esempio erano già presenti.',

  // Delete a game
  'library.delete.title': 'Eliminare il gioco?',
  'library.delete.message':
    '"{title}" verrà rimosso insieme alle sue {count} sessioni. L\'operazione non è annullabile.',
  'library.deleted': '"{title}" eliminato.',

  // Empty states
  'library.empty.title': 'Il backlog è vuoto',
  'library.empty.message':
    'Aggiungi i giochi che hai in arretrato: potrai cercarli online, sorteggiarli e tenere traccia delle sessioni.',
  'library.empty.addFirst': 'Aggiungi il primo gioco',
  'library.empty.loadDemo': 'Carica dati di esempio',
  'library.noResults.title': 'Nessun gioco trovato',
  'library.noResults.message': 'Prova a cambiare i filtri di ricerca.',

  // Filters
  'library.filters.searchPlaceholder': 'Cerca per titolo, genere, tag…',
  'library.filters.allPlatforms': 'Tutte le piattaforme',
  'library.filters.allGenres': 'Tutti i generi',
  'library.filters.favoritesOnly': 'Solo preferiti',
  'library.metascoreGood': 'Metascore 75+',
  'library.metascoreGoodHint': 'Solo giochi con Metascore da 75 in su',
  'library.noMetascore': 'Senza voto',
  'library.noMetascoreHint': 'Solo giochi senza Metascore',

  // Sort select (LIBRARY_SORT_OPTIONS values live in logic/library.ts)
  'library.sort.label': 'Ordina: {value}',
  'library.sort.updated': 'Modificati di recente',
  'library.sort.title': 'Titolo (A-Z)',
  'library.sort.metacritic': 'Metascore (Metacritic)',
  'library.sort.effort': 'Effort richiesto',
  'library.sort.pleasure': 'Piacere dimostrato',
  'library.sort.priority': 'Priorità',
  'library.sort.time': 'Tempo giocato',
  'library.sort.duration': 'Durata stimata',
  'library.sort.remaining': 'Quanto manca',
  'library.sort.lastPlayed': 'Ultima sessione',

  // Game card
  'library.card.metascore': 'Metascore {score}',
  'library.card.metascoreOutOf100': 'Metascore {score}/100',
  'library.card.sentimentSuffix': ' · {sentiment}',
  'library.card.reviewsSuffix': ' · {count} recensioni',
  'library.card.mustPlaySuffix': ' · ★ Must Play',
  'library.card.metacritic': 'Metacritic',
  'library.card.metascoreUnavailableHint':
    'Metascore non ancora disponibile: usa “Aggiorna i Metascore mancanti” in alto',
  'library.card.dosbox': 'DOSBox',
  'library.card.favoriteAdd': 'Aggiungi ai preferiti',
  'library.card.favoriteRemove': 'Rimuovi dai preferiti',
  'library.card.playedTimeManual': 'Tempo giocato: {time} (di cui {manual} dichiarate a mano)',
  'library.card.playedTimeSessions': 'Tempo giocato dalle sessioni registrate',
  'library.card.sessions': 'Sessioni registrate',
  'library.card.links': '{count} link utili salvati',
  'library.card.startedHint': 'Segnato come già iniziato, senza sessioni registrate',
  'library.card.started': 'iniziato',
  'library.card.lastSession': 'Ultima sessione',
  'library.card.play': 'Gioca'
}
