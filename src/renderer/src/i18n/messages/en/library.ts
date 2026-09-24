/**
 * Strings for the "library" area.
 * Keys must be prefixed with "library." and mirrored in it/library.ts.
 *
 * Suffix keys (`…Suffix`) intentionally include the leading " · " separator so
 * the JSX can concatenate optional parts without hard-coding punctuation.
 */
export default {
  // View shell
  'library.loading': 'Opening the backlog…',
  'library.stats.count': '{shown} of {total} games',
  'library.stats.retroOnly': 'retro only',
  'library.stats.noMetascore': 'no Metascore',

  // Header actions
  'library.actions.updateMetascores': 'Update missing Metascores',
  'library.actions.logSession': 'Log session',

  // Metacritic bulk enrichment
  'library.metacritic.allHave': 'Every game has a Metascore',
  'library.metacritic.searchFor': 'Look up the Metascore for {count} games',
  'library.metacritic.complete': 'Every game in the library already has a Metascore.',
  'library.metacritic.confirmTitle': 'Search for the missing Metascores?',
  'library.metacritic.confirmMessage':
    '{count} games will be queried on Metacritic, one at a time. You can keep using the app.',
  'library.metacritic.updated': 'Metascores updated: {updated} of {total}.',
  'library.metacritic.updatedSkipped': 'Metascores updated: {updated} of {total} · {skipped} without a score.',

  // Demo data
  'library.seed.added': 'Added {count} sample games.',
  'library.seed.present': 'The sample games were already there.',

  // Delete a game
  'library.delete.title': 'Delete the game?',
  'library.delete.message':
    '"{title}" will be removed together with its {count} sessions. This cannot be undone.',
  'library.deleted': '"{title}" deleted.',

  // Empty states
  'library.empty.title': 'The backlog is empty',
  'library.empty.message':
    'Add the games you have piling up: you can look them up online, draw them at random and keep track of your sessions.',
  'library.empty.addFirst': 'Add the first game',
  'library.empty.loadDemo': 'Load sample data',
  'library.noResults.title': 'No games found',
  'library.noResults.message': 'Try changing the search filters.',

  // Filters
  'library.filters.searchPlaceholder': 'Search by title, genre, tag…',
  'library.filters.allPlatforms': 'All platforms',
  'library.filters.allGenres': 'All genres',
  'library.filters.favoritesOnly': 'Favorites only',
  'library.metascoreGood': 'Metascore 75+',
  'library.metascoreGoodHint': 'Only games with a Metascore of 75 or higher',
  'library.noMetascore': 'No score',
  'library.noMetascoreHint': 'Only games with no Metascore',

  // Sort select (LIBRARY_SORT_OPTIONS values live in logic/library.ts)
  'library.sort.label': 'Sort: {value}',
  'library.sort.updated': 'Recently updated',
  'library.sort.title': 'Title (A-Z)',
  'library.sort.metacritic': 'Metascore (Metacritic)',
  'library.sort.effort': 'Required effort',
  'library.sort.pleasure': 'Observed pleasure',
  'library.sort.priority': 'Priority',
  'library.sort.time': 'Time played',
  'library.sort.duration': 'Estimated length',
  'library.sort.remaining': 'Time left',
  'library.sort.lastPlayed': 'Last session',

  // Game card
  'library.card.metascore': 'Metascore {score}',
  'library.card.sentimentSuffix': ' · {sentiment}',
  'library.card.dosbox': 'DOSBox',
  'library.card.favoriteAdd': 'Add to favorites',
  'library.card.favoriteRemove': 'Remove from favorites',
  'library.card.playedTimeManual': 'Played time: {time} (of which {manual} declared by hand)',
  'library.card.playedTimeSessions': 'Played time from the logged sessions',
  'library.card.sessions': 'Logged sessions',
  'library.card.links': '{count} useful links saved',
  'library.card.startedHint': 'Marked as already started, with no logged sessions',
  'library.card.started': 'started',
  'library.card.lastSession': 'Last session',
  'library.card.play': 'Play'
} as const
