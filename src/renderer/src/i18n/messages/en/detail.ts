/**
 * Strings for the "detail" area.
 * Keys must be prefixed with "detail." and mirrored in it/detail.ts.
 */
export default {
  // Loading and empty states
  'detail.loading': 'Loading the game…',
  'detail.notFound.title': 'Game not found',
  'detail.notFound.message': 'Maybe it was deleted.',
  'detail.backToLibrary': 'Back to library',
  'detail.favorite': 'Favorite',
  'detail.platform.group': 'Group: {group}',

  // Header actions
  'detail.session.log': 'Log session',
  'detail.edit': 'Edit details',
  'detail.external': 'External page',

  // Played / progress / run stats
  'detail.stat.played': 'Time played',
  'detail.stat.played.hintManual': '{sessions} sessions + {manual} declared',
  'detail.stat.played.hint': '{count} sessions logged',
  'detail.stat.progress': 'Progress',
  'detail.stat.progress.hint': 'out of {duration} of main story',
  'detail.stat.progress.noDuration': 'an estimated duration is needed',
  'detail.stat.run': 'Run',
  'detail.started': 'Started',
  'detail.notStarted': 'Not started',
  'detail.stat.run.since': 'since {date}',
  'detail.stat.run.hint': 'mark the start in the box below',
  'detail.stat.satisfaction': 'Average satisfaction',
  'detail.stat.satisfaction.none': 'no sessions',
  'detail.stat.satisfaction.hint': 'from logged sessions',
  'detail.stat.effort': 'Average perceived effort',
  'detail.stat.effort.hint': 'Estimated in library: {value}/5',
  'detail.stat.efficiency': 'Return (pleasure/effort)',
  'detail.stat.efficiency.hint': 'How much the effort pays off',
  'detail.stat.lastSession': 'Last session',
  'detail.stat.lastSession.daysAgo': '{count} days ago',
  'detail.stat.lastSession.never': 'never started',
  'detail.stat.demonstrated': 'Demonstrated pleasure',
  'detail.stat.demonstrated.hint': 'Declared: {value}/5',

  // Metacritic
  'detail.metacritic.title': 'Metacritic',
  'detail.metacritic.update': 'Update score',
  'detail.metacritic.search': 'Search on Metacritic',
  'detail.metacritic.open': 'Open on Metacritic',
  'detail.metacritic.reviews': '{count} reviews',
  'detail.metacritic.source': 'source: {source}',
  'detail.metacritic.platformScores': 'Scores by platform',
  'detail.metacritic.noVotes': 'no votes',
  'detail.metacritic.critics': 'Critics: {positive} positive · {neutral} mixed · {negative} negative',
  'detail.metacritic.empty':
    'No score saved: use “Search on Metacritic” (the search also runs automatically when you add a game from Settings).',
  'detail.metacritic.noPlatforms': 'platforms n/a',
  'detail.metacritic.use': 'Use this',
  'detail.metacritic.tone': 'Band',
  'detail.metacritic.tone.good': 'Green',
  'detail.metacritic.tone.mixed': 'Yellow',
  'detail.metacritic.tone.bad': 'Red',
  'detail.metacritic.tone.hint': 'same thresholds as Metacritic: 75+ / 50-74 / below 50',

  // Duration (HowLongToBeat)
  'detail.duration.title': 'Duration (HowLongToBeat)',
  'detail.duration.update': 'Update durations',
  'detail.duration.open': 'Open on HLTB',
  'detail.duration.match': 'match {percent}%',
  'detail.duration.use': 'Use this',
  'detail.duration.remaining': 'Remaining',
  'detail.duration.empty': 'No known duration: use “Update durations” or enter it in “Edit details”.',

  // GOGDB
  'detail.gogdb.title': 'GOGDB · GOG product data',
  'detail.gogdb.open': 'Open on GOGDB',
  'detail.gogdb.store': 'GOG page',
  'detail.gogdb.builds': '{count} builds published',
  'detail.gogdb.lastBuild': 'latest {date}',
  'detail.gogdb.series': 'series: {series}',
  'detail.gogdb.release': 'released {year}',
  'detail.gogdb.note':
    'GOGDB has no search API but publishes all its data as JSON under /data: we use it here for description, boxart, builds and DOSBox detection.',

  // Quick ratings
  'detail.quick.title': 'Quick ratings',
  'detail.quick.status': 'Library status',
  'detail.quick.effort': 'Effort required',
  'detail.quick.score': 'Your score',
  'detail.quick.scoreValue': '{score}/{max}',
  'detail.quick.scoreHint': 'not rated yet',

  // Playtime
  'detail.playtime.label': 'Hours already played (outside the app)',
  'detail.playtime.placeholder': 'e.g. 12',
  'detail.playtime.save': 'Save hours',
  'detail.playtime.hint': 'Before using Backlog Wars or on another platform: they add up to your sessions.',
  'detail.playtime.sessions': 'Sessions:',
  'detail.playtime.declared': 'Declared:',
  'detail.playtime.total': 'Total:',

  // Session log
  'detail.sessions.title': 'Session log',
  'detail.sessions.total': '{duration} in total',
  'detail.sessions.empty.title': 'No sessions logged',
  'detail.sessions.empty.message': 'Log the first session to start measuring time, effort and satisfaction.',
  'detail.sessions.empty.action': 'Log the first session',
  'detail.sessions.lastNote': 'Last note: {note}',

  // Toasts and confirm dialogs
  'detail.toast.durationNoMatch': 'No reliable match on HowLongToBeat: pick from the suggestions.',
  'detail.toast.durationsFrom': 'Durations from “{title}” (match {percent}%).',
  'detail.toast.durationsUpdated': 'Durations updated.',
  'detail.toast.hoursSaved': 'Already-played hours saved: {duration}.',
  'detail.toast.hoursReset': 'Already-played hours reset.',
  'detail.toast.metacriticNoMatch': 'No reliable Metacritic entry: pick from the suggestions.',
  'detail.toast.metascoreFrom': 'Metascore {score} from “{title}”.',
  'detail.toast.metascore': 'Metascore {score}: {title}.',
  'detail.delete.title': 'Delete the game?',
  'detail.delete.message': '"{title}" and its {count} sessions will be permanently removed.',
  'detail.toast.deleted': 'Game deleted.',
  'detail.deleteSession.title': 'Delete the session?',
  'detail.deleteSession.message': 'Session of {date} ({duration}). Its time will also be removed from the total.',
  'detail.toast.sessionDeleted': 'Session deleted.'
}
