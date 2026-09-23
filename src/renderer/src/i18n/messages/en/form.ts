/**
 * Strings for the "form" area.
 * Keys must be prefixed with "form." and mirrored in it/form.ts.
 */
export default {
  'form.title.add': 'Add a game',
  'form.title.edit': 'Edit game',
  'form.subtitle': 'Search data online (retro gaming too) or fill it in by hand',
  'form.addToBacklog': 'Add to backlog',

  // Online search
  'form.section.search': 'Search info online',
  'form.search.placeholder': 'Game title (e.g. Chrono Trigger, Hollow Knight)',
  'form.search.results': '{count} results',
  'form.search.error': 'error',
  'form.search.noDetails': 'no details',
  'form.search.tooShort': 'Type at least 2 characters to search online.',
  'form.search.empty': 'No results: try another title or fill it in by hand.',
  'form.provider.auto': 'Automatic (Steam + GOG + HowLongToBeat)',
  'form.provider.steam': 'Steam',
  'form.provider.gog': 'GOG',
  'form.provider.hltb': 'HowLongToBeat (durations and consoles)',
  'form.provider.rawg': 'RAWG (key required)',
  'form.rawgTip':
    'Tip: with a free RAWG key (Settings) you add another source with rich descriptions.',
  'form.metadata.imported': 'Data imported from {provider}.',

  // Duration (HowLongToBeat)
  'form.section.duration': 'Duration (HowLongToBeat)',
  'form.durations.lookup': 'Search duration online',
  'form.durations.use': 'Use this one',
  'form.durations.suggestedEffort': 'Use suggested effort: {value}/5',
  'form.durations.source': 'From HowLongToBeat (id {id})',
  'form.durations.updated': ' · updated {date}',
  'form.durations.imported': 'Durations imported from HowLongToBeat ({title}).',
  'form.durations.match': 'HowLongToBeat: “{title}” (similarity {percent}%)',
  'form.durations.matchShort': 'match {percent}%',
  'form.durations.found': 'Duration found: {duration}.',
  'form.durations.none': 'No reliable match: pick one of the suggestions or enter the duration by hand.',
  'form.durations.taken': 'Duration taken from “{title}”.',
  'form.duration.main': 'Main story (hours)',
  'form.duration.mainExtra': 'Story + extra (hours)',
  'form.duration.completionist': '100% (hours)',
  'form.duration.allStyles': 'All styles (hours)',
  'form.duration.why':
    'Durations help the draw understand whether a game fits in the evening and estimate how much is left.',

  // Progress
  'form.section.progress': 'Progress',
  'form.progress.state.label': 'Playthrough status',
  'form.progress.state.hint': 'Tells a never-started game apart from one already begun',
  'form.progress.notStarted': 'Not started yet',
  'form.progress.started': 'Already started',
  'form.progress.playedBefore.label': 'Hours already played',
  'form.progress.playedBefore.hint':
    'Before using Backlog Wars or on another platform: they add up to the sessions',
  'form.progress.playedSoFar': 'Time played so far:',
  'form.progress.declared': '(of which {duration} declared by hand)',
  'form.progress.reference': ' · {percent}% of the main story · {missing} left',

  // Metacritic
  'form.section.metacritic': 'Metacritic',
  'form.metacritic.reviews': ' · {count} critic reviews',
  'form.metacritic.platforms': 'platforms n/a',
  'form.metacritic.use': 'Use this one',
  'form.metacritic.lookup': 'Search on Metacritic',
  'form.metacritic.open': 'Open Metacritic page',
  'form.metacritic.source': 'Score source: {source}',
  'form.metacritic.applied': 'Metascore {score}: {title}.',
  'form.metacritic.match': 'Metacritic: “{title}” ({year}) · similarity {percent}%',
  'form.metacritic.found': 'Metascore found: {score}.',
  'form.metacritic.none':
    'No reliable Metacritic entry: pick one of the suggestions or enter the score by hand.',
  'form.metacritic.taken': 'Score taken from “{title}”.',

  // GOGDB panel
  'form.section.gogdb': 'data from the GOG database',
  'form.gogdb.builds': '{count} builds',
  'form.gogdb.last': 'last {date}',
  'form.gogdb.series': 'series: {name}',
  'form.gogdb.loaded': 'GOGDB: {count} builds · last {last}',

  // Game data
  'form.section.data': 'Game data',
  'form.data.title': 'Title *',
  'form.data.titlePlaceholder': 'Game name',
  'form.data.platformHint': 'Includes PC, modern consoles and retro gaming',
  'form.data.releaseYear': 'Release year',
  'form.data.metascore': 'Metascore (manual)',
  'form.data.developer': 'Developer',
  'form.data.publisher': 'Publisher',
  'form.data.coverUrl': 'Cover URL',
  'form.data.externalUrl': 'External link',
  'form.data.externalUrlPlaceholder': 'Steam, GOG, HowLongToBeat page, …',
  'form.data.tags': 'Personal tags',
  'form.data.tagsHint': 'Comma-separated: e.g. relaxing, co-op, evening',
  'form.data.description': 'Description',
  'form.data.selectedPlatform': 'Selected platform: {platform}',

  // Ratings
  'form.rating.effort': 'Effort required',
  'form.rating.pleasure': 'Expected pleasure',
  'form.rating.priorityHint': 'How much I care about playing it',
  'form.rating.favorite': 'Favourite',
  'form.rating.dosbox': 'DOS game: runs in DOSBox',
  'form.rating.favoriteHint': 'Favourites get a bonus in the draw',

  // Notes and links
  'form.notes.label': 'Notes',
  'form.notes.hint': 'Notes are now a list: manage them from the game page',
  'form.notes.body':
    'Open the game page to add, edit or delete notes: each one keeps its creation date and last edit date.',
  'form.firstNote.label': 'First note (optional)',
  'form.firstNote.hint': 'It will be saved as the first note of the game, dated today',
  'form.firstNote.placeholder': 'Where I left off, what I want to do, …',
  'form.firstLink.label': 'First useful link (optional)',
  'form.firstLink.hint':
    'Guide, wiki, video, mod: the preview will be read from the page and you can add more from the game page',

  // Feedback
  'form.error.titleRequired': 'The title is required.',
  'form.saved.updated': 'Game updated.',
  'form.saved.added': '"{title}" added to the backlog.'
} as const
