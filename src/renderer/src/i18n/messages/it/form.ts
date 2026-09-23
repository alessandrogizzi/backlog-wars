/** Strings for the "form" area. Italian mirror of en/form.ts. */
export default {
  'form.title.add': 'Aggiungi un gioco',
  'form.title.edit': 'Modifica gioco',
  'form.subtitle': 'Cerca i dati online (anche retrogaming) oppure compila a mano',
  'form.addToBacklog': 'Aggiungi al backlog',

  // Online search
  'form.section.search': 'Cerca informazioni online',
  'form.search.placeholder': 'Titolo del gioco (es. Chrono Trigger, Hollow Knight)',
  'form.search.results': '{count} risultati',
  'form.search.error': 'errore',
  'form.search.noDetails': 'nessun dettaglio',
  'form.search.tooShort': 'Scrivi almeno 2 caratteri per cercare online.',
  'form.search.empty': 'Nessun risultato: prova con un altro titolo o compila a mano.',
  'form.provider.auto': 'Automatico (Steam + GOG + HowLongToBeat)',
  'form.provider.steam': 'Steam',
  'form.provider.gog': 'GOG',
  'form.provider.hltb': 'HowLongToBeat (durate e console)',
  'form.provider.rawg': 'RAWG (serve chiave)',
  'form.rawgTip':
    "Suggerimento: con una chiave RAWG gratuita (Impostazioni) aggiungi un'altra fonte con descrizioni ricche.",
  'form.metadata.imported': 'Dati importati da {provider}.',

  // Duration (HowLongToBeat)
  'form.section.duration': 'Durata (HowLongToBeat)',
  'form.durations.lookup': 'Cerca durata online',
  'form.durations.use': 'Usa questa',
  'form.durations.suggestedEffort': 'Usa effort suggerito: {value}/5',
  'form.durations.source': 'Da HowLongToBeat (id {id})',
  'form.durations.updated': ' · aggiornata {date}',
  'form.durations.imported': 'Durate importate da HowLongToBeat ({title}).',
  'form.durations.match': 'HowLongToBeat: “{title}” (somiglianza {percent}%)',
  'form.durations.matchShort': 'match {percent}%',
  'form.durations.found': 'Durata trovata: {duration}.',
  'form.durations.none':
    'Nessuna corrispondenza affidabile: scegli fra i suggerimenti o inserisci la durata a mano.',
  'form.durations.taken': 'Durata presa da “{title}”.',
  'form.duration.main': 'Storia (ore)',
  'form.duration.mainExtra': 'Storia + extra (ore)',
  'form.duration.completionist': '100% (ore)',
  'form.duration.allStyles': 'Tutti gli stili (ore)',
  'form.duration.why':
    'Le durate servono al sorteggio per capire se un gioco ci sta nella serata e per stimare quanto manca.',

  // Progress
  'form.section.progress': 'Avanzamento',
  'form.progress.state.label': 'Stato della partita',
  'form.progress.state.hint': 'Distingue un gioco mai avviato da uno già iniziato',
  'form.progress.notStarted': 'Non ancora iniziato',
  'form.progress.started': 'Già iniziato',
  'form.progress.playedBefore.label': 'Ore già giocate',
  'form.progress.playedBefore.hint':
    "Prima di usare Backlog Wars o su un'altra piattaforma: si sommano alle sessioni",
  'form.progress.playedSoFar': 'Tempo giocato finora:',
  'form.progress.declared': '(di cui {duration} dichiarate a mano)',
  'form.progress.reference': ' · {percent}% della storia principale · mancano {missing}',

  // Metacritic
  'form.section.metacritic': 'Metacritic',
  'form.metacritic.reviews': ' · {count} recensioni della critica',
  'form.metacritic.platforms': 'piattaforme n.d.',
  'form.metacritic.use': 'Usa questo',
  'form.metacritic.lookup': 'Cerca su Metacritic',
  'form.metacritic.open': 'Apri scheda Metacritic',
  'form.metacritic.source': 'Fonte del punteggio: {source}',
  'form.metacritic.applied': 'Metascore {score}: {title}.',
  'form.metacritic.match': 'Metacritic: “{title}” ({year}) · somiglianza {percent}%',
  'form.metacritic.found': 'Metascore trovato: {score}.',
  'form.metacritic.none':
    'Nessuna scheda Metacritic affidabile: scegli fra i suggerimenti o inserisci il punteggio a mano.',
  'form.metacritic.taken': 'Punteggio preso da “{title}”.',

  // GOGDB panel
  'form.section.gogdb': 'dati dal database GOG',
  'form.gogdb.builds': '{count} build',
  'form.gogdb.last': 'ultima {date}',
  'form.gogdb.series': 'serie: {name}',
  'form.gogdb.loaded': 'GOGDB: {count} build · ultima {last}',

  // Game data
  'form.section.data': 'Dati del gioco',
  'form.data.title': 'Titolo *',
  'form.data.titlePlaceholder': 'Nome del gioco',
  'form.data.platformHint': 'Include PC, console moderne e retrogaming',
  'form.data.releaseYear': 'Anno di uscita',
  'form.data.metascore': 'Metascore (manuale)',
  'form.data.developer': 'Sviluppatore',
  'form.data.publisher': 'Publisher',
  'form.data.coverUrl': 'URL copertina',
  'form.data.externalUrl': 'Link esterno',
  'form.data.externalUrlPlaceholder': 'Scheda Steam, GOG, HowLongToBeat, …',
  'form.data.tags': 'Tag personali',
  'form.data.tagsHint': 'Separati da virgola: es. rilassante, coop, serale',
  'form.data.description': 'Descrizione',
  'form.data.selectedPlatform': 'Piattaforma selezionata: {platform}',

  // Ratings
  'form.rating.effort': 'Effort richiesto',
  'form.rating.pleasure': 'Piacere atteso',
  'form.rating.priorityHint': 'Quanto ci tengo a giocarlo',
  'form.rating.favorite': 'Preferito',
  'form.rating.dosbox': 'Gioco DOS: parte in DOSBox',
  'form.rating.favoriteHint': 'I preferiti ricevono un bonus nel sorteggio',

  // Notes and links
  'form.notes.label': 'Note',
  'form.notes.hint': 'Le note ora sono una lista: si gestiscono dalla scheda del gioco',
  'form.notes.body':
    "Apri la scheda del gioco per aggiungere, modificare o eliminare le note: ognuna conserva la data di creazione e quella dell'ultima modifica.",
  'form.firstNote.label': 'Prima nota (facoltativa)',
  'form.firstNote.hint': 'Verrà salvata come prima nota del gioco, con la data di oggi',
  'form.firstNote.placeholder': "Dove l'ho lasciato, cosa voglio fare, …",
  'form.firstLink.label': 'Primo link utile (facoltativo)',
  'form.firstLink.hint':
    "Guida, wiki, video, mod: l'anteprima verrà letta dalla pagina e potrai aggiungerne altri dalla scheda",

  // Feedback
  'form.error.titleRequired': 'Il titolo è obbligatorio.',
  'form.saved.updated': 'Gioco aggiornato.',
  'form.saved.added': '"{title}" aggiunto al backlog.'
}
