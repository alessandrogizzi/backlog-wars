/**
 * Strings for the "log" area.
 * Keys must be prefixed with "log." and mirrored in it/log.ts.
 */
export default {
  // Sessions view
  'log.title': 'Game sessions',
  'log.subtitle': 'Complete log: time, perceived effort and satisfaction of every play session.',
  'log.newSession': '+ New session',
  'log.loading': 'Loading sessions…',
  'log.empty.title': 'No sessions logged',
  'log.empty.message':
    'Every time you play log time, effort and satisfaction: statistics and draws will use this data.',
  'log.empty.action': 'Log the first session',

  // KPI cards
  'log.kpi.filtered': 'Sessions filtered',
  'log.kpi.days.one': '{count} day of play',
  'log.kpi.days.other': '{count} days of play',
  'log.kpi.totalTime': 'Total time',
  'log.kpi.avgSatisfaction': 'Average satisfaction',
  'log.kpi.avgEffort': 'Average effort',

  // Filters
  'log.filter.allGames': 'All games',
  'log.filter.from': 'From',
  'log.filter.to': 'To',
  'log.sort.date': 'Sort: date',
  'log.sort.minutes': 'Sort: duration',
  'log.sort.satisfaction': 'Sort: satisfaction',
  'log.sort.effort': 'Sort: effort',

  // Table
  'log.table.date': 'Date',
  'log.table.game': 'Game',
  'log.table.satisfaction': 'Satisfaction',
  'log.table.notes': 'Notes',
  'log.gameDeleted': 'deleted game',
  'log.noResults': 'No session matches the filters.',

  // Delete confirm and toasts
  'log.delete.title': 'Delete the session?',
  'log.delete.message': '{title} · {date} · {minutes}. The time will be removed from the totals.',
  'log.deleted': 'Session deleted.',
  'log.updated': 'Session updated.',
  'log.created': 'Session logged. Have fun!',

  // Session form
  'log.form.editTitle': 'Edit session',
  'log.form.newTitle': 'Log a session',
  'log.form.subtitle': 'How and how much did you play?',
  'log.form.noGames': 'Add a game to the backlog first, then you can log sessions.',
  'log.form.choose': '— choose —',
  'log.form.playedTime': 'Time played',
  'log.form.effort': 'Effort required by the session',
  'log.form.effortHint': 'How much energy it cost you',
  'log.form.satisfactionHint': 'How much you liked it',
  'log.form.progress': 'Progress',
  'log.form.progressHint': 'E.g. reached chapter 3, beat the boss, started a new run',
  'log.form.statusAfter': 'Game status after the session',
  'log.form.statusAfterHint': "Leave unchanged if you don't want to change the status in your library",
  'log.form.statusUnchanged': '— unchanged —',
  'log.form.chooseGame': 'Choose the game for the session.',
  'log.form.saveEdit': 'Save changes',
  'log.form.saveNew': 'Save session'
}
