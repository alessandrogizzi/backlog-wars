/**
 * Strings for the "stats" area.
 * Keys must be prefixed with "stats." and mirrored in it/stats.ts.
 */
export default {
  'stats.genre.unknown': 'Genre not set',

  // Page
  'stats.title': 'Statistics',
  'stats.subtitle': 'Here you will see time, effort and satisfaction for your games.',
  'stats.loading': 'Computing statistics…',
  'stats.empty.title': 'No data yet',
  'stats.empty.message': 'Add games and log a few sessions: charts, averages and rankings will appear here.',

  // Header
  'stats.header.summary': '{sessions} sessions across {games} games · current streak of {streak}',
  'stats.streak.one': '{count} day',
  'stats.streak.other': '{count} days',

  // KPI cards
  'stats.kpi.totalTime': 'Total time',
  'stats.kpi.totalTime.manual': '{hours} hours, of which {minutes} logged by hand',
  'stats.kpi.totalTime.all': '{hours} hours in total',
  'stats.kpi.avgSatisfaction': 'Average satisfaction',
  'stats.kpi.avgSatisfaction.hint': 'across all sessions',
  'stats.kpi.avgEffort': 'Average perceived effort',
  'stats.kpi.avgEffort.hint': 'average session: {minutes}',
  'stats.kpi.last30': 'Last 30 days',
  'stats.kpi.last30.hint': '{sessions} sessions over {days} days',
  'stats.kpi.gamesInLibrary': 'Games in library',
  'stats.kpi.gamesInLibrary.hint': '{count} in progress',
  'stats.kpi.finishedDropped': 'Finished / dropped',
  'stats.kpi.finishedDropped.hint': 'backlog: {backlog} · wishlist: {wishlist}',
  'stats.kpi.estimatedBacklog': 'Estimated backlog',
  'stats.kpi.estimatedBacklog.hint': '{hours} hours of main story only',
  'stats.kpi.remaining': 'Left to finish',
  'stats.kpi.remaining.hint': 'sum of the games in progress',
  'stats.kpi.completionist': '100% backlog',
  'stats.kpi.completionist.hint': 'if you wanted to complete everything',
  'stats.kpi.retroTime': 'Retro gaming time',
  'stats.kpi.retroTime.hint': '{count} retro games played',
  'stats.kpi.knownDurations': 'Known durations',
  'stats.kpi.knownDurations.hint': 'games with a HowLongToBeat duration',
  'stats.kpi.avgMetascore': 'Average Metascore',
  'stats.kpi.avgMetascore.hint': '{count} games with a Metacritic score',
  'stats.kpi.started': 'Already started',
  'stats.kpi.started.hint': 'games with a started playthrough or logged hours',
  'stats.kpi.streak': 'Current streak',
  'stats.kpi.streak.hint': 'a session logged every day',

  // Sections
  'stats.weeks.title': 'Time per week (last 8)',
  'stats.effortSatisfaction.title': 'Satisfaction by effort',
  'stats.effortSatisfaction.hint': 'It shows how effort turns into fun: look for the row with the highest satisfaction.',
  'stats.table.sessions': 'Sessions',
  'stats.topByTime.title': 'Where the time went',
  'stats.bestValue.title': 'Best value (pleasure / effort)',
  'stats.bestValue.empty': 'At least 30 minutes logged on a game are needed.',
  'stats.bestValue.entry': 'value {efficiency} · {minutes} · average effort {effort}/5',
  'stats.group.title': 'Time by platform type',
  'stats.group.entry': '{group} · {count} games',
  'stats.platform.title': 'Time by platform',
  'stats.genre.title': 'Time by genre',
  'stats.recent.title': 'Latest sessions',
  'stats.recent.entry': '{minutes} · effort {effort}/5 · satisfaction {satisfaction}/5',
  'stats.backlogStatus.title': 'Backlog statuses',

  // Shared bits
  'stats.noData': 'No data.',
  'stats.noSessions': 'No sessions logged.',
  'stats.entry.withScore': '{minutes} · {sessions} sessions · {score}/5',
  'stats.entry.plain': '{minutes} · {sessions} sessions',
  'stats.deletedGame': 'deleted game'
}
