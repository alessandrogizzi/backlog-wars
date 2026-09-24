import { metacriticTone } from '@shared/catalog'
import { todayIso } from '@shared/format'
import type { Game } from '../db/types'
import { hasStarted } from '../logic/duration'
import { observedPleasure } from '../logic/picker'
import { useI18n } from '../i18n'
import { Cover, PlaytimeMeter, RatingDots, RetroChip, StatusBadge } from './ui'

export function GameCard({
  game,
  linkCount = 0,
  onOpen,
  onPlay,
  onEdit,
  onDelete,
  onToggleFavorite
}: {
  game: Game
  linkCount?: number
  onOpen: (game: Game) => void
  onPlay: (game: Game) => void
  onEdit: (game: Game) => void
  onDelete: (game: Game) => void
  onToggleFavorite: (game: Game) => void
}) {
  const { t, formatDate } = useI18n()
  const stop = (action: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation()
    action()
  }

  return (
    <article className="game-card" onClick={() => onOpen(game)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onOpen(game)}>
      <div className="game-card-cover">
        <Cover game={game} />
        {game.metacritic ? (
          <span
            className={`metacritic metascore-${metacriticTone(game.metacritic)}`}
            title={`${t('library.card.metascore', { score: game.metacritic })}${game.metacriticSentiment ? t('library.card.sentimentSuffix', { sentiment: game.metacriticSentiment }) : ''}`}
          >
            {game.metacritic}
            {game.mustPlay === 1 ? ' ★' : ''}
          </span>
        ) : null}
      </div>
      <div className="game-card-body">
        <div className="game-card-head">
          <h3 title={game.title}>{game.title}</h3>
          <button
            type="button"
            className={`fav${game.favorite === 1 ? ' on' : ''}`}
            onClick={stop(() => onToggleFavorite(game))}
            aria-label={game.favorite === 1 ? t('library.card.favoriteRemove') : t('library.card.favoriteAdd')}
          >
            {game.favorite === 1 ? '★' : '☆'}
          </button>
        </div>
        <div className="game-card-meta">
          <StatusBadge status={game.status} />
          <span className="muted">{game.platform}</span>
          <RetroChip platform={game.platform} />
          {game.releaseYear ? <span className="muted">{game.releaseYear}</span> : null}
        </div>

        {game.usesDosbox === 1 ? (
          <div className="game-card-flags">
            <span className="badge dosbox-flag">{t('library.card.dosbox')}</span>
          </div>
        ) : null}

        <PlaytimeMeter game={game} />

        <div className="meters">
          <div className="meter-row">
            <span className="meter-label">{t('label.effort')}</span>
            <RatingDots readOnly value={game.effortEstimate} tone="effort" />
          </div>
          <div className="meter-row">
            <span className="meter-label">{t('label.pleasure')}</span>
            <RatingDots readOnly value={observedPleasure(game)} tone="pleasure" />
          </div>
        </div>

        <div className="game-card-stats">
          <span title={t('library.card.sessions')}>🎬 {game.sessionCount}</span>
          {linkCount > 0 ? <span title={t('library.card.links', { count: linkCount })}>🔗 {linkCount}</span> : null}
          {hasStarted(game) && game.sessionCount === 0 ? (
            <span className="badge badge-started" title={t('library.card.startedHint')}>
              ▶ {t('library.card.started')}
            </span>
          ) : null}
          <span title={t('library.card.lastSession')}>
            📅 {game.lastPlayedAt ? formatDate(todayIso(game.lastPlayedAt)) : t('label.neverPlayed')}
          </span>
        </div>

        <div className="game-card-actions">
          <button type="button" className="btn small primary" onClick={stop(() => onPlay(game))}>
            ▶ {t('library.card.play')}
          </button>
          <button type="button" className="btn small ghost" onClick={stop(() => onEdit(game))}>
            {t('common.edit')}
          </button>
          <button type="button" className="btn small ghost danger" onClick={stop(() => onDelete(game))}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    </article>
  )
}
