/**
 * Strings for the "play" area: the picker ("What do I play?") and the
 * single-elimination tournament.
 * Keys must be prefixed with "play." and mirrored in it/play.ts.
 */
export default {
  // Picker header
  'play.title': 'What do I play now?',
  'play.subtitle':
    '{pool} games in the running out of {total} · the draw weighs effort, pleasure, priority and how much time has passed',
  'play.loading': 'Preparing the arena…',
  'play.tournamentMode': 'Tournament mode',

  // Filters
  'play.filters.title': 'Filters',
  'play.filters.statuses': 'Statuses to draw',
  'play.filters.targetEffort': 'Energy I have right now',
  'play.filters.maxEffort': 'Maximum effort I can handle',
  'play.filters.minPleasure': 'Minimum pleasure',
  'play.filters.avoidRecent': 'Exclude games played in the last',
  'play.filters.days': '{count} days',
  'play.filters.platformType': 'Platform type',
  'play.filters.timeAvailable': 'Time I have right now',
  'play.filters.timeUnset': 'not specified',
  'play.filters.maxDuration': 'Maximum length (main story)',
  'play.filters.noLimit': 'no limit',
  'play.filters.neverPlayed': 'Never played',
  'play.filters.favoritesOnly': 'Favorites only',

  // Draw weights
  'play.weights.title': 'Draw weights',
  'play.weights.effort': 'Energy compatibility',
  'play.weights.pleasure': 'Proven pleasure',
  'play.weights.novelty': 'Novelty (how long since you played it)',
  'play.weights.duration': 'Length vs. the time I have',
  'play.weights.total': 'Total weights: {total}%',
  'play.weights.allZero': '· all zero: uniform draw',
  'play.saveDefaults': 'Save as defaults',
  'play.defaultsSaved': 'Filters and weights saved as defaults.',
  'play.noCandidates': 'No game matches the filters: widen the selection.',

  // Slot machine
  'play.mode.smart': 'Smart draw',
  'play.mode.random': 'Pure random',
  'play.slot.rolling': 'Drawing…',
  'play.slot.drawn': 'Drawn!',
  'play.slot.ready': 'Ready to draw',
  'play.roll.rolling': 'Drawing…',
  'play.roll.again': 'Roll again',
  'play.roll.start': 'Draw the next game',
  'play.empty.poolNotice':
    'No game passes these filters. Try raising the maximum effort, lowering the minimum pleasure or including more statuses.',

  // Result card
  'play.result.played.one': 'Played {time} in 1 session',
  'play.result.played.other': 'Played {time} in {count} sessions',
  'play.result.avgSatisfaction': 'average satisfaction {value}/5',
  'play.result.story': 'story {time}',
  'play.result.remaining': '{time} to go',
  'play.result.unknownDuration': 'length unknown: look it up from the game page',
  'play.result.score': 'score',
  'play.breakdown.energy': 'Energy',
  'play.breakdown.novelty': 'Novelty',
  'play.breakdown.time': 'Time',
  'play.accept': "I'll play it: log session",
  'play.reject': 'Not in the mood, roll again',
  'play.discard': 'Discard',
  'play.openDetail': 'Open page',

  // Pool and recent draws
  'play.pool.title': 'In the running ({count})',
  'play.pool.sortedByScore': 'sorted by score',
  'play.pool.emptyTitle': 'No candidates',
  'play.pool.emptyMessage': 'Add games to the backlog or widen the filters to make something show up in the arena.',
  'play.pool.goToLibrary': 'Go to the library',
  'play.pool.row': 'effort {effort}/5 · pleasure {pleasure}/5',
  'play.recent.title': 'Recent draws',
  'play.recent.smart': 'smart',
  'play.recent.random': 'random',

  // Tournament
  'play.tournament.title': 'Backlog tournament',
  'play.tournament.subtitle':
    'Single-elimination duels: pick the winner of every match-up and let the backlog decide on its own.',
  'play.tournament.loading': 'Preparing the bracket…',
  'play.tournament.generate': 'Generate bracket',
  'play.tournament.needTwo': 'You need at least 2 games in the running to hold a tournament.',
  'play.tournament.size': 'Tournament size',
  'play.tournament.sizeGames': '{count} games',
  'play.tournament.poolCount': '{count} games in the running',
  'play.tournament.emptyTitle': 'No tournament running',
  'play.tournament.emptyMessage':
    'Set the filters and generate a bracket: duels are settled with a click, and the winner goes to sessions.',

  // Bracket
  'play.round.final': 'Final',
  'play.round.semifinals': 'Semi-finals',
  'play.round.number': 'Round {round}',
  'play.bracket.slot': 'effort {effort}/5 · pleasure {pleasure}/5',
  'play.bracket.waiting': 'waiting…',
  'play.champion.title': 'Backlog champion',
  'play.champion.stats': '{platform} · effort {effort}/5 · pleasure {pleasure}/5',
  'play.champion.playNow': "I'll play it now",
  'play.champion.newTournament': 'New tournament'
} as const
