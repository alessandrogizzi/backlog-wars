/** Strings for the "settings" area. Italian mirror of en/settings.ts. */
export default {
  'settings.loading': 'Carico le impostazioni…',
  'settings.subtitle': "Fonti dei metadati, pesi del sorteggio, backup dei dati e informazioni sull'app.",
  'settings.save': 'Salva impostazioni',
  'settings.saved': 'Impostazioni salvate.',
  'settings.days': '{count} giorni',
  'settings.hours': '{count} ore',

  // Metadata search
  'settings.metadata.title': 'Ricerca dei metadati',
  'settings.rawg.label': 'Chiave API RAWG',
  'settings.rawg.hint': "Facoltativa: senza chiave l'app usa lo Steam Store. La chiave è gratuita su rawg.io/apidocs.",
  'settings.rawg.placeholder': 'incolla qui la chiave RAWG',
  'settings.rawg.show': 'Mostra',
  'settings.rawg.hide': 'Nascondi',
  'settings.rawg.get': 'Ottieni chiave',
  'settings.provider.label': 'Fonte predefinita',
  'settings.provider.auto': 'Automatico: Steam + GOG + HowLongToBeat (+ RAWG)',
  'settings.provider.steam': 'Solo Steam Store (nessuna chiave)',
  'settings.provider.gog': 'Solo GOG (nessuna chiave, ottimo per il retrogaming PC)',
  'settings.provider.hltb': 'Solo HowLongToBeat (durate e console, retrogaming incluso)',
  'settings.provider.rawg': 'Solo RAWG (richiede chiave)',
  'settings.steamCountry.label': 'Paese Steam',
  'settings.country.hint': 'Codice a 2 lettere, es. IT, US, GB',
  'settings.gogCountry.label': 'Paese GOG',
  'settings.gogCurrency.label': 'Valuta GOG',
  'settings.gogCurrency.hint': 'Codice a 3 lettere, es. EUR, USD',
  'settings.metacritic.label': 'Chiave API Metacritic',
  'settings.metacritic.hint':
    "Facoltativa: l'app usa la chiave pubblica del sito Metacritic. Compila solo se i punteggi smettono di arrivare.",
  'settings.metacritic.placeholder': 'lascia vuoto per usare la chiave pubblica',
  'settings.hltbAuto': 'Cerca le durate su HowLongToBeat quando aggiungo un gioco',
  'settings.metacriticAuto': 'Cerca il Metascore quando aggiungo un gioco',
  'settings.sources.gogdb':
    'GOGDB viene usato automaticamente per i giochi GOG: descrizione, boxart, build pubblicate e segnalazione DOSBox. I suoi dati sono JSON pubblici in',
  'settings.sources.gogdbCache': ", con cache locale di un'ora.",
  'settings.sources.metacritic':
    'Il Metascore arriva dal backend JSON di Metacritic (numero di recensioni, sentiment, badge Must Play e punteggi per piattaforma), con cache di 24 ore.',

  // Draw defaults
  'settings.draw.title': 'Valori predefiniti del sorteggio',
  'settings.effortTarget': 'Energia disponibile',
  'settings.maxEffort': 'Effort massimo tollerato',
  'settings.minPleasure': 'Piacere minimo',
  'settings.avoidRecent': 'Escludi i giochi giocati negli ultimi',
  'settings.timeAvailable': 'Tempo disponibile per sessione',
  'settings.timeAvailable.none': 'non specificato',
  'settings.maxHours': 'Durata massima accettata (storia principale)',
  'settings.maxHours.none': 'nessun limite',
  'settings.weights.title': 'Pesi',
  'settings.weights.effort': "Compatibilità con l'energia",
  'settings.weights.pleasure': 'Piacere dimostrato',
  'settings.weights.novelty': 'Novità',
  'settings.weights.duration': 'Durata vs tempo disponibile',

  // Data and backup
  'settings.backup.title': 'Dati e backup',
  'settings.backup.note':
    "Tutto è salvato in locale (IndexedDB dentro il profilo dell'app), senza server né account. Esporta un file JSON per non perdere nulla.",
  'settings.backup.export': 'Esporta backup',
  'settings.backup.importMerge': 'Importa (unisci)',
  'settings.backup.importReplace': 'Importa (sostituisci)',
  'settings.backup.seed': 'Carica dati di esempio',
  'settings.backup.wipe': 'Cancella tutti i dati',
  'settings.backup.saved': 'Backup salvato in {path}',
  'settings.import.done': 'Importati {games} giochi e {sessions} sessioni{skipped}.',
  'settings.import.skipped': ' ({count} record saltati)',
  'settings.seed.added': 'Aggiunti {count} giochi di esempio.',
  'settings.seed.present': 'I dati di esempio erano già presenti.',
  'settings.wiped': 'Database locale svuotato.',
  'settings.confirm.replace.title': 'Sostituire tutti i dati?',
  'settings.confirm.replace.message':
    'Il database locale verrà svuotato e riempito con il contenuto del backup. Operazione irreversibile.',
  'settings.confirm.replace.confirm': 'Sostituisci tutto',
  'settings.confirm.wipe.title': 'Cancellare tutti i dati?',
  'settings.confirm.wipe.message':
    'Giochi, sessioni, sorteggi e impostazioni verranno eliminati dal database locale.',
  'settings.confirm.wipe.confirm': 'Cancella tutto',

  // App information
  'settings.info.title': 'Informazioni',
  'settings.info.app': 'Applicazione',
  'settings.info.node': 'Node',
  'settings.info.userData': 'Cartella dati'
}
