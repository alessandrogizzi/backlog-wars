/**
 * Strings for the "settings" area.
 * Keys must be prefixed with "settings." and mirrored in it/settings.ts.
 */
export default {
  'settings.loading': 'Loading settings…',
  'settings.subtitle': 'Metadata sources, draw weights, data backup and app information.',
  'settings.save': 'Save settings',
  'settings.saved': 'Settings saved.',
  'settings.days': '{count} days',
  'settings.hours': '{count} hours',

  // Metadata search
  'settings.metadata.title': 'Metadata search',
  'settings.rawg.label': 'RAWG API key',
  'settings.rawg.hint': 'Optional: without a key the app uses the Steam Store. The key is free at rawg.io/apidocs.',
  'settings.rawg.placeholder': 'paste your RAWG key here',
  'settings.rawg.show': 'Show',
  'settings.rawg.hide': 'Hide',
  'settings.rawg.get': 'Get a key',
  'settings.provider.label': 'Default source',
  'settings.provider.auto': 'Automatic: Steam + GOG + HowLongToBeat (+ RAWG)',
  'settings.provider.steam': 'Steam Store only (no key)',
  'settings.provider.gog': 'GOG only (no key, great for retro PC gaming)',
  'settings.provider.hltb': 'HowLongToBeat only (durations and consoles, retro included)',
  'settings.provider.rawg': 'RAWG only (key required)',
  'settings.steamCountry.label': 'Steam country',
  'settings.country.hint': '2-letter code, e.g. IT, US, GB',
  'settings.gogCountry.label': 'GOG country',
  'settings.gogCurrency.label': 'GOG currency',
  'settings.gogCurrency.hint': '3-letter code, e.g. EUR, USD',
  'settings.metacritic.label': 'Metacritic API key',
  'settings.metacritic.hint':
    "Optional: the app uses Metacritic's public key. Fill it in only if scores stop arriving.",
  'settings.metacritic.placeholder': 'leave empty to use the public key',
  'settings.hltbAuto': 'Search durations on HowLongToBeat when I add a game',
  'settings.metacriticAuto': 'Search the Metascore when I add a game',
  'settings.sources.gogdb':
    'GOGDB is used automatically for GOG games: description, boxart, published builds and DOSBox flag. Its data is public JSON in',
  'settings.sources.gogdbCache': ', with a one-hour local cache.',
  'settings.sources.metacritic':
    'The Metascore comes from the Metacritic JSON backend (review count, sentiment, Must Play badge and per-platform scores), with a 24-hour cache.',

  // Draw defaults
  'settings.draw.title': 'Draw defaults',
  'settings.effortTarget': 'Available energy',
  'settings.maxEffort': 'Maximum tolerated effort',
  'settings.minPleasure': 'Minimum pleasure',
  'settings.avoidRecent': 'Exclude games played in the last',
  'settings.timeAvailable': 'Time available per session',
  'settings.timeAvailable.none': 'not specified',
  'settings.maxHours': 'Maximum accepted duration (main story)',
  'settings.maxHours.none': 'no limit',
  'settings.weights.title': 'Weights',
  'settings.weights.effort': 'Energy compatibility',
  'settings.weights.pleasure': 'Demonstrated pleasure',
  'settings.weights.novelty': 'Novelty',
  'settings.weights.duration': 'Duration vs available time',

  // Data and backup
  'settings.backup.title': 'Data and backup',
  'settings.backup.note':
    'Everything is stored locally (IndexedDB inside the app profile), with no server and no account. Export a JSON file so you never lose anything.',
  'settings.backup.export': 'Export backup',
  'settings.backup.importMerge': 'Import (merge)',
  'settings.backup.importReplace': 'Import (replace)',
  'settings.backup.seed': 'Load sample data',
  'settings.backup.wipe': 'Delete all data',
  'settings.backup.saved': 'Backup saved to {path}',
  'settings.import.done': 'Imported {games} games and {sessions} sessions{skipped}.',
  'settings.import.skipped': ' ({count} records skipped)',
  'settings.seed.added': 'Added {count} sample games.',
  'settings.seed.present': 'Sample data was already there.',
  'settings.wiped': 'Local database wiped.',
  'settings.confirm.replace.title': 'Replace all data?',
  'settings.confirm.replace.message':
    'The local database will be emptied and filled with the contents of the backup. This cannot be undone.',
  'settings.confirm.replace.confirm': 'Replace everything',
  'settings.confirm.wipe.title': 'Delete all data?',
  'settings.confirm.wipe.message':
    'Games, sessions, draws and settings will be deleted from the local database.',
  'settings.confirm.wipe.confirm': 'Delete everything',

  // App information
  'settings.info.title': 'Information',
  'settings.info.app': 'Application',
  'settings.info.node': 'Node',
  'settings.info.userData': 'Data folder'
} as const
