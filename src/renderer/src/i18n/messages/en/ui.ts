/**
 * Strings for the "ui" area.
 * Keys must be prefixed with "ui." and mirrored in it/ui.ts.
 */
export default {
  'ui.toast.close': 'Close notification',

  'ui.rating.valueOf': '{value} of {max}',
  'ui.cover.alt': 'Cover of {title}',
  'ui.duration.estimated': 'Estimated duration: {duration}',
  'ui.duration.played': 'played: {duration}',
  'ui.duration.remaining': '{duration} left',
  'ui.duration.main': 'Main story',
  'ui.duration.mainExtra': 'Story + extra',
  'ui.duration.completionist': '100% completion',
  'ui.duration.allStyles': 'All styles',
  'ui.duration.empty': 'No known duration for this game.',
  'ui.duration.playedTitle': 'Played: {duration}',
  'ui.duration.playedOf': 'Played {played} of {reference}',
  'ui.duration.declared': '(of which {declared} declared by hand)',
  'ui.duration.missing': 'missing',
  'ui.retro.label': 'Retro',
  'ui.retro.title': 'Retro platform: playable via emulator or original hardware',
  'ui.emulator.retro': 'Retro platform',
  'ui.emulator.recommended': 'recommended:'
} as const
