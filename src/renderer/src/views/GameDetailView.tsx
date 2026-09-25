import { useEffect, useState } from 'react'
import {
  GAME_STATUSES,
  effortKey,
  metacriticTone,
  platformGroupKey,
  platformGroupOf,
  pleasureKey,
  statusMeta,
  toneKey
} from '@shared/catalog'
import type { GameStatus } from '@shared/catalog'
import { formatMinutes, todayIso } from '@shared/format'
import type { DurationCandidate, GogdbInfo, MetacriticCandidate, MetacriticDetails } from '@shared/types'
import { deleteGame, deleteSession, setGameStatus, toggleFavorite, updateGame } from '../db/repo'
import type { PlaySession } from '../db/types'
import { errorMessage, useI18n } from '../i18n'
import { LinksPanel } from '../components/LinksPanel'
import { NotesPanel } from '../components/NotesPanel'
import {
  Cover,
  DurationBars,
  EmulatorHint,
  EmptyState,
  Loading,
  RatingDots,
  RetroChip,
  StatCard
} from '../components/ui'
import {
  completionRatio,
  formatDuration,
  hasStarted,
  manualMinutes,
  playedMinutes,
  referenceMinutes,
  remainingMinutes
} from '../logic/duration'
import { observedPleasure } from '../logic/picker'
import { MAX_PERSONAL_SCORE, personalScore } from '../logic/score'
import { useApp } from '../state/app'
import { useGame, useSessionsForGame } from '../state/data'
import { useSettings } from '../state/settings'
import { useToast } from '../state/toast'

export function GameDetailView({ gameId }: { gameId: number }) {
  const game = useGame(gameId)
  const sessions = useSessionsForGame(gameId)
  const { go, openGameForm, openSessionForm, confirm } = useApp()
  const { settings } = useSettings()
  const { t, formatDate, formatDateTime, formatDecimal } = useI18n()
  const { notify } = useToast()
  const [gogdb, setGogdb] = useState<GogdbInfo | null>(null)
  const [durationBusy, setDurationBusy] = useState(false)
  const [durationCandidates, setDurationCandidates] = useState<DurationCandidate[]>([])
  const [metacriticDetails, setMetacriticDetails] = useState<MetacriticDetails | null>(null)
  const [metacriticBusy, setMetacriticBusy] = useState(false)
  const [metacriticCandidates, setMetacriticCandidates] = useState<MetacriticCandidate[]>([])
  const [hoursDraft, setHoursDraft] = useState('')

  useEffect(() => {
    const manual = game?.playedBeforeMinutes ?? 0
    setHoursDraft(manual > 0 ? String(Math.round((manual / 60) * 10) / 10) : '')
  }, [game?.id, game?.playedBeforeMinutes])

  const gogProductId = game?.provider === 'gog' && /^\d+$/.test(game.providerId ?? '') ? (game.providerId as string) : null
  const metacriticSlug = /\/game\/([^/]+)\//.exec(game?.metacriticUrl ?? '')?.[1] ?? null

  // Per-platform scores: they come from the Metacritic page (cached in the main process).
  useEffect(() => {
    if (!metacriticSlug) {
      setMetacriticDetails(null)
      return
    }
    let active = true
    void window.backlog
      .getMetacriticDetails({ slug: metacriticSlug, apiKey: settings.metacriticApiKey })
      .then((result) => {
        if (active && result.ok) setMetacriticDetails(result.data)
      })
    return () => {
      active = false
    }
  }, [metacriticSlug, settings.metacriticApiKey])

  // For GOG games, load the details from GOGDB (description, builds, DOSBox).
  useEffect(() => {
    if (!gogProductId) {
      setGogdb(null)
      return
    }
    let active = true
    void window.backlog.getGogdbInfo({ productId: gogProductId }).then((result) => {
      if (active && result.ok) setGogdb(result.data)
    })
    return () => {
      active = false
    }
  }, [gogProductId])

  if (game === undefined) return <Loading label={t('detail.loading')} />

  if (game === null) {
    return (
      <EmptyState
        icon="🚫"
        title={t('detail.notFound.title')}
        message={t('detail.notFound.message')}
        action={
          <button type="button" className="btn primary" onClick={() => go({ name: 'library' })}>
            {t('detail.backToLibrary')}
          </button>
        }
      />
    )
  }

  const sessionsList = sessions ?? []
  const lastSession = sessionsList[0]
  const daysSince = game.lastPlayedAt
    ? Math.floor((Date.now() - game.lastPlayedAt) / 86_400_000)
    : null
  const efficiency =
    game.avgSatisfaction !== null && game.avgEffort ? Math.round((game.avgSatisfaction / game.avgEffort) * 100) / 100 : null

  const saveDurations = async (metadata: { durations?: DurationCandidate['metadata']['durations'] }): Promise<boolean> => {
    const durations = metadata.durations
    if (!durations) return false
    await updateGame(gameId, {
      hltbId: durations.hltbId,
      durationMain: durations.main,
      durationMainExtra: durations.mainExtra,
      durationCompletionist: durations.completionist,
      durationAllStyles: durations.allStyles,
      durationUpdatedAt: Date.now()
    })
    return true
  }

  const refreshDurations = async (): Promise<void> => {
    setDurationBusy(true)
    try {
      const response = await window.backlog.getDurations({ title: game.title, year: game.releaseYear })
      if (!response.ok) {
        notify(errorMessage(t, response), 'error')
        return
      }
      const { best, alternatives } = response.data
      setDurationCandidates(alternatives)
      if (!best) {
        notify(t('detail.toast.durationNoMatch'), 'info')
        return
      }
      await saveDurations(best.metadata)
      notify(t('detail.toast.durationsFrom', { title: best.metadata.title, percent: Math.round(best.score * 100) }), 'ok')
    } finally {
      setDurationBusy(false)
    }
  }

  const saveManualHours = async (): Promise<void> => {
    const hours = Number(hoursDraft.replace(',', '.'))
    const minutes = Number.isFinite(hours) && hours > 0 ? Math.round(hours * 60) : undefined
    await updateGame(gameId, {
      playedBeforeMinutes: minutes,
      // Declaring hours means the game has been started.
      startedAt: minutes ? (game.startedAt ?? Date.now()) : game.startedAt
    })
    notify(
      minutes ? t('detail.toast.hoursSaved', { duration: formatDuration(minutes) }) : t('detail.toast.hoursReset'),
      'ok'
    )
  }

  const refreshMetacritic = async (): Promise<void> => {
    setMetacriticBusy(true)
    try {
      const response = await window.backlog.getMetacritic({
        title: game.title,
        year: game.releaseYear,
        platform: game.platform,
        apiKey: settings.metacriticApiKey
      })
      if (!response.ok) {
        notify(errorMessage(t, response), 'error')
        return
      }
      const { best, alternatives } = response.data
      setMetacriticCandidates(alternatives)
      if (!best) {
        notify(t('detail.toast.metacriticNoMatch'), 'info')
        return
      }
      await updateGame(gameId, {
        metacritic: best.candidate.score,
        metacriticUrl: best.candidate.url,
        metacriticReviewCount: best.candidate.reviewCount,
        metacriticSentiment: best.candidate.sentiment,
        mustPlay: best.candidate.mustPlay ? 1 : 0,
        metacriticSource: 'metacritic',
        metacriticUpdatedAt: Date.now()
      })
      notify(
        t('detail.toast.metascoreFrom', { score: best.candidate.score ?? '—', title: best.candidate.title }),
        'ok'
      )
    } finally {
      setMetacriticBusy(false)
    }
  }

  const useMetacriticCandidate = async (candidate: MetacriticCandidate): Promise<void> => {
    await updateGame(gameId, {
      metacritic: candidate.score ?? game.metacritic,
      metacriticUrl: candidate.url,
      metacriticReviewCount: candidate.reviewCount,
      metacriticSentiment: candidate.sentiment,
      mustPlay: candidate.mustPlay ? 1 : 0,
      metacriticSource: 'metacritic',
      metacriticUpdatedAt: Date.now()
    })
    setMetacriticCandidates([])
    notify(t('detail.toast.metascore', { score: candidate.score ?? '—', title: candidate.title }), 'ok')
  }

  const handleDelete = async (): Promise<void> => {
    const accepted = await confirm({
      title: t('detail.delete.title'),
      message: t('detail.delete.message', { title: game.title, count: sessionsList.length }),
      confirmLabel: t('common.delete'),
      danger: true
    })
    if (!accepted) return
    await deleteGame(gameId)
    notify(t('detail.toast.deleted'), 'ok')
    go({ name: 'library' })
  }

  const handleDeleteSession = async (session: PlaySession): Promise<void> => {
    const accepted = await confirm({
      title: t('detail.deleteSession.title'),
      message: t('detail.deleteSession.message', {
        date: formatDate(session.date),
        duration: formatMinutes(session.minutes)
      }),
      confirmLabel: t('common.delete'),
      danger: true
    })
    if (!accepted || !session.id) return
    await deleteSession(session.id)
    notify(t('detail.toast.sessionDeleted'), 'ok')
  }

  return (
    <div className="view">
      <button type="button" className="btn ghost small back" onClick={() => go({ name: 'library' })}>
        ← {t('nav.library')}
      </button>

      <header className="detail-header card">
        <Cover game={game} size="lg" />
        <div className="detail-info">
          <div className="detail-title-row">
            <h1>{game.title}</h1>
            <button
              type="button"
              className={`fav big${game.favorite === 1 ? ' on' : ''}`}
              onClick={() => void toggleFavorite(gameId)}
              aria-label={t('detail.favorite')}
            >
              {game.favorite === 1 ? '★' : '☆'}
            </button>
          </div>
          <div className="detail-meta">
            <span className={`badge status-${game.status}`}>
              {t(statusMeta(game.status).labelKey)}
            </span>
            <span className="muted" title={t('detail.platform.group', { group: t(platformGroupKey(platformGroupOf(game.platform))) })}>
              {game.platform}
            </span>
            <RetroChip platform={game.platform} />
            {game.usesDosbox === 1 ? <span className="badge dosbox-flag">DOSBox</span> : null}
            {game.releaseYear ? <span className="muted">{game.releaseYear}</span> : null}
            {game.metacritic ? <span className="badge badge-neutral">Metacritic {game.metacritic}</span> : null}
            {game.developer ? <span className="muted">{game.developer}</span> : null}
          </div>
          {game.genres.length > 0 ? (
            <div className="chip-group">
              {game.genres.map((genre) => (
                <span key={genre} className="chip static">
                  {genre}
                </span>
              ))}
            </div>
          ) : null}
          {game.tags.length > 0 ? (
            <div className="tag-row">
              {game.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
          <EmulatorHint platform={game.platform} />
          {game.description ? <p className="detail-description">{game.description}</p> : null}
          <div className="view-actions">
            <button type="button" className="btn primary" onClick={() => openSessionForm({ game })}>
              ⏱ {t('detail.session.log')}
            </button>
            <button type="button" className="btn ghost" onClick={() => openGameForm({ game })}>
              {t('detail.edit')}
            </button>
            {game.externalUrl ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() => void window.backlog.openExternal(game.externalUrl!).then((result) => {
                  if (!result.ok) notify(errorMessage(t, result), 'error')
                })}
              >
                🔗 {t('detail.external')}
              </button>
            ) : null}
            <button type="button" className="btn ghost danger" onClick={() => void handleDelete()}>
              {t('common.delete')}
            </button>
          </div>
        </div>
      </header>

      <section className="stat-grid">
        <StatCard
          label={t('detail.stat.played')}
          value={formatMinutes(playedMinutes(game))}
          hint={
            manualMinutes(game) > 0
              ? t('detail.stat.played.hintManual', {
                  sessions: sessionsList.length,
                  manual: formatMinutes(manualMinutes(game))
                })
              : t('detail.stat.played.hint', { count: sessionsList.length })
          }
        />
        <StatCard
          label={t('detail.stat.progress')}
          value={completionRatio(game) !== undefined ? `${Math.round(completionRatio(game)! * 100)}%` : '—'}
          hint={
            referenceMinutes(game)
              ? t('detail.stat.progress.hint', { duration: formatDuration(referenceMinutes(game)) })
              : t('detail.stat.progress.noDuration')
          }
          tone="accent"
        />
        <StatCard
          label={t('detail.stat.run')}
          value={hasStarted(game) ? t('detail.started') : t('detail.notStarted')}
          hint={game.startedAt ? t('detail.stat.run.since', { date: formatDate(todayIso(game.startedAt)) }) : t('detail.stat.run.hint')}
          tone={hasStarted(game) ? 'good' : 'default'}
        />
        <StatCard
          label={t('detail.stat.satisfaction')}
          value={game.avgSatisfaction !== null ? `${game.avgSatisfaction}/5` : '—'}
          hint={game.sessionCount === 0 ? t('detail.stat.satisfaction.none') : t('detail.stat.satisfaction.hint')}
          tone="good"
        />
        <StatCard
          label={t('detail.stat.effort')}
          value={game.avgEffort !== null ? `${game.avgEffort}/5` : '—'}
          hint={t('detail.stat.effort.hint', { value: game.effortEstimate })}
        />
        <StatCard
          label={t('detail.stat.efficiency')}
          value={efficiency !== null ? formatDecimal(efficiency, 2) : '—'}
          hint={t('detail.stat.efficiency.hint')}
          tone={efficiency !== null && efficiency >= 1.5 ? 'good' : 'default'}
        />
        <StatCard
          label={t('detail.stat.lastSession')}
          value={game.lastPlayedAt ? formatDate(todayIso(game.lastPlayedAt)) : t('label.neverPlayed')}
          hint={daysSince !== null ? t('detail.stat.lastSession.daysAgo', { count: daysSince }) : t('detail.stat.lastSession.never')}
        />
        <StatCard
          label={t('detail.stat.demonstrated')}
          value={`${formatDecimal(observedPleasure(game), 1)}/5`}
          hint={t('detail.stat.demonstrated.hint', { value: game.pleasure })}
        />
      </section>

      <section className="card detail-grid">
        <h2 className="section-title">🏅 {t('detail.metacritic.title')}</h2>

        <div className="detail-grid-content">
        <div className="metacritic-card-head">
          <span className={`metascore metascore-${metacriticTone(game.metacritic)}`}>{game.metacritic ?? '—'}</span>
          <span className="muted small">
            Metascore · {t(toneKey(game.metacritic))}
            {game.metacriticReviewCount ? ` · ${t('detail.metacritic.reviews', { count: game.metacriticReviewCount })}` : ''}
            {game.metacriticSentiment ? ` · ${game.metacriticSentiment}` : ''}
          </span>
          {game.mustPlay === 1 ? <span className="badge badge-mustplay">★ Must Play</span> : null}
          {game.metacriticSource ? (
            <span className="badge badge-neutral">{t('detail.metacritic.source', { source: game.metacriticSource })}</span>
          ) : null}
        </div>

        {metacriticDetails && metacriticDetails.platformScores.length > 0 ? (
          <div className="platform-scores">
            <span className="field-label">{t('detail.metacritic.platformScores')}</span>
            {metacriticDetails.platformScores.map((entry) => (
              <div key={entry.platform} className="platform-score-row">
                <span>{entry.platform}</span>
                <span className={`metascore small metascore-${metacriticTone(entry.score)}`}>
                  {entry.score ?? '—'}
                </span>
                <span className="muted">
                  {entry.reviewCount ? t('detail.metacritic.reviews', { count: entry.reviewCount }) : t('detail.metacritic.noVotes')}
                  {entry.releaseDate ? ` · ${formatDate(entry.releaseDate)}` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {metacriticDetails &&
        (metacriticDetails.positiveCount !== undefined || metacriticDetails.negativeCount !== undefined) ? (
          <p className="muted small">
            {t('detail.metacritic.critics', {
              positive: metacriticDetails.positiveCount ?? 0,
              neutral: metacriticDetails.neutralCount ?? 0,
              negative: metacriticDetails.negativeCount ?? 0
            })}
          </p>
        ) : null}

        {!game.metacritic && !metacriticBusy ? (
          <p className="muted small">{t('detail.metacritic.empty')}</p>
        ) : null}

        {metacriticCandidates.length > 0 ? (
          <ul className="suggestion-list">
            {metacriticCandidates.map((candidate) => (
              <li key={candidate.id} className="suggestion-row">
                <span>
                  <span className={`metascore small metascore-${metacriticTone(candidate.score)}`}>
                    {candidate.score ?? '—'}
                  </span>{' '}
                  <strong>{candidate.title}</strong>{' '}
                  <span className="muted small">
                    {candidate.year ?? '—'} · {candidate.platforms.slice(0, 3).join(', ') || t('detail.metacritic.noPlatforms')}
                  </span>
                </span>
                <button type="button" className="btn small ghost" onClick={() => void useMetacriticCandidate(candidate)}>
                  {t('detail.metacritic.use')}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        </div>

        <div className="detail-grid-side">
          <div className="view-actions">
            <button type="button" className="btn small" onClick={() => void refreshMetacritic()} disabled={metacriticBusy}>
              {metacriticBusy ? t('common.searching') : game.metacritic ? t('detail.metacritic.update') : t('detail.metacritic.search')}
            </button>
            {game.metacriticUrl ? (
              <button
                type="button"
                className="btn small ghost"
                onClick={() =>
                  void window.backlog.openExternal(game.metacriticUrl as string).then((result) => {
                    if (!result.ok) notify(errorMessage(t, result), 'error')
                  })
                }
              >
                {t('detail.metacritic.open')}
              </button>
            ) : null}
          </div>

          <StatCard
            label={t('detail.metacritic.tone')}
            value={
              game.metacritic
                ? game.metacritic >= 75
                  ? t('detail.metacritic.tone.good')
                  : game.metacritic >= 50
                    ? t('detail.metacritic.tone.mixed')
                    : t('detail.metacritic.tone.bad')
                : '—'
            }
            hint={t('detail.metacritic.tone.hint')}
            tone={game.metacritic && game.metacritic >= 75 ? 'good' : 'default'}
          />
        </div>
      </section>

      <section className="card detail-grid">
        <h2 className="section-title">⏳ {t('detail.duration.title')}</h2>

        <div className="detail-grid-content">
            <DurationBars game={game} />
            {durationCandidates.length > 0 ? (
              <ul className="suggestion-list">
                {durationCandidates.map((candidate) => (
                  <li key={`${candidate.metadata.providerId}-${candidate.metadata.title}`} className="suggestion-row">
                    <span>
                      <strong>{candidate.metadata.title}</strong>{' '}
                      <span className="muted small">
                        {candidate.metadata.releaseYear ?? '—'} ·{' '}
                        {formatDuration(candidate.metadata.durations?.main ?? candidate.metadata.durations?.allStyles)} ·{' '}
                        {t('detail.duration.match', { percent: Math.round(candidate.score * 100) })}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() =>
                        void saveDurations(candidate.metadata).then((saved) => {
                          if (saved) {
                            setDurationCandidates([])
                            notify(t('detail.toast.durationsUpdated'), 'ok')
                          }
                        })
                      }
                    >
                      {t('detail.duration.use')}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
        </div>

        <div className="detail-grid-side">
          <div className="view-actions">
            <button type="button" className="btn small" onClick={() => void refreshDurations()} disabled={durationBusy}>
              {durationBusy ? t('common.searching') : t('detail.duration.update')}
            </button>
            {game.hltbId ? (
              <button
                type="button"
                className="btn small ghost"
                onClick={() =>
                  void window.backlog.openExternal(`https://howlongtobeat.com/game/${game.hltbId}`).then((result) => {
                    if (!result.ok) notify(errorMessage(t, result), 'error')
                  })
                }
              >
                {t('detail.duration.open')}
              </button>
            ) : null}
          </div>

          {referenceMinutes(game) ? (
            <StatCard
              label={t('detail.duration.remaining')}
              value={formatDuration(remainingMinutes(game))}
              hint={t('detail.stat.progress.hint', { duration: formatDuration(referenceMinutes(game)) })}
              tone="accent"
            />
          ) : (
            <p className="muted small">{t('detail.duration.empty')}</p>
          )}
        </div>
      </section>

      {gogdb ? (
        <section className="card">
          <div className="section-head">
            <h2 className="section-title">🗄️ {t('detail.gogdb.title')}</h2>
            <div className="view-actions">
              <button
                type="button"
                className="btn small ghost"
                onClick={() =>
                  void window.backlog.openExternal(gogdb.gogdbUrl).then((result) => {
                    if (!result.ok) notify(errorMessage(t, result), 'error')
                  })
                }
              >
                {t('detail.gogdb.open')}
              </button>
              {gogdb.storeUrl ? (
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() =>
                    void window.backlog.openExternal(gogdb.storeUrl as string).then((result) => {
                      if (!result.ok) notify(errorMessage(t, result), 'error')
                    })
                  }
                >
                  {t('detail.gogdb.store')}
                </button>
              ) : null}
            </div>
          </div>
          <div className="gogdb-panel">
            <div className="gogdb-meta">
              <span>{t('detail.gogdb.builds', { count: gogdb.buildCount })}</span>
              {gogdb.lastBuildAt ? <span>{t('detail.gogdb.lastBuild', { date: gogdb.lastBuildAt })}</span> : null}
              {gogdb.buildSystems.length > 0 ? <span>{gogdb.buildSystems.join(', ')}</span> : null}
              {gogdb.usesDosbox ? <span className="badge dosbox-flag">DOSBox</span> : null}
              {gogdb.series ? <span>{t('detail.gogdb.series', { series: gogdb.series })}</span> : null}
              {gogdb.releaseYear ? <span>{t('detail.gogdb.release', { year: gogdb.releaseYear })}</span> : null}
            </div>
            {gogdb.tags.length > 0 ? (
              <div className="tag-row">
                {gogdb.tags.slice(0, 10).map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="muted small">{t('detail.gogdb.note')}</p>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2 className="section-title">{t('detail.quick.title')}</h2>
        <div className="quick-grid">
          <div className="rating-block">
            <span className="field-label">{t('detail.quick.status')}</span>
            <select
              className="select"
              value={game.status}
              onChange={(event) => void setGameStatus(gameId, event.target.value as GameStatus)}
            >
              {GAME_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {t(status.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="rating-block">
            <span className="field-label">{t('detail.quick.effort')}</span>
            <RatingDots
              value={game.effortEstimate}
              tone="effort"
              onChange={(value) => void updateGame(gameId, { effortEstimate: value })}
            />
            <span className="muted small">{t(effortKey(game.effortEstimate))}</span>
          </div>
          <div className="rating-block">
            <span className="field-label">{t('label.pleasure')}</span>
            <RatingDots
              value={game.pleasure}
              tone="pleasure"
              onChange={(value) => void updateGame(gameId, { pleasure: value })}
            />
            <span className="muted small">{t(pleasureKey(game.pleasure))}</span>
          </div>
          <div className="rating-block">
            <span className="field-label">{t('label.priority')}</span>
            <RatingDots
              value={game.priority}
              tone="priority"
              onChange={(value) => void updateGame(gameId, { priority: value })}
            />
          </div>
          <div className="rating-block">
            <span className="field-label">{t('detail.quick.score')}</span>
            <input
              type="range"
              min={0}
              max={MAX_PERSONAL_SCORE}
              step={1}
              value={personalScore(game)}
              aria-label={t('detail.quick.score')}
              onChange={(event) => void updateGame(gameId, { personalScore: Number(event.target.value) })}
            />
            <span className="muted small">
              {personalScore(game) > 0
                ? t('detail.quick.scoreValue', { score: personalScore(game), max: MAX_PERSONAL_SCORE })
                : t('detail.quick.scoreHint')}
            </span>
          </div>
        </div>

        <div className="playtime-row">
          <label className="field">
            <span className="field-label">{t('detail.playtime.label')}</span>
            <div className="inline-row">
              <input
                className="input"
                type="number"
                min={0}
                step={0.5}
                placeholder={t('detail.playtime.placeholder')}
                value={hoursDraft}
                onChange={(event) => setHoursDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void saveManualHours()
                }}
              />
              <button type="button" className="btn small" onClick={() => void saveManualHours()}>
                {t('detail.playtime.save')}
              </button>
            </div>
            <span className="field-hint">{t('detail.playtime.hint')}</span>
          </label>

          <span className="playtime-summary">
            <span>
              {t('detail.playtime.sessions')} <strong>{formatMinutes(game.totalMinutes)}</strong>
            </span>
            <span>
              {t('detail.playtime.declared')} <strong>{formatMinutes(manualMinutes(game))}</strong>
            </span>
            <span>
              {t('detail.playtime.total')} <strong>{formatMinutes(playedMinutes(game))}</strong>
            </span>
          </span>
        </div>
      </section>

      <NotesPanel gameId={gameId} />

      <LinksPanel gameId={gameId} />

      <section className="card">
        <div className="section-head">
          <h2 className="section-title">{t('detail.sessions.title')}</h2>
          <span className="muted small">
            {sessionsList.length > 0
              ? t('detail.sessions.total', {
                  duration: formatMinutes(sessionsList.reduce((sum, session) => sum + session.minutes, 0))
                })
              : t('detail.stat.satisfaction.none')}
          </span>
        </div>

        {sessionsList.length === 0 ? (
          <EmptyState
            icon="⏱"
            title={t('detail.sessions.empty.title')}
            message={t('detail.sessions.empty.message')}
            action={
              <button type="button" className="btn primary" onClick={() => openSessionForm({ game })}>
                {t('detail.sessions.empty.action')}
              </button>
            }
          />
        ) : (
          <ul className="session-list">
            {sessionsList.map((session) => (
              <li key={session.id} className="session-row">
                <div className="session-main">
                  <span className="session-date">{formatDate(session.date)}</span>
                  <span className="session-minutes">{formatMinutes(session.minutes)}</span>
                  <span className="session-ratings">
                    <RatingDots readOnly value={session.effort} tone="effort" />
                    <RatingDots readOnly value={session.satisfaction} tone="satisfaction" />
                  </span>
                </div>
                <div className="session-detail">
                  {session.progress ? <span className="muted small">{session.progress}</span> : null}
                  {session.notes ? <span className="muted small">“{session.notes}”</span> : null}
                </div>
                <div className="session-actions">
                  <button type="button" className="btn small ghost" onClick={() => openSessionForm({ session })}>
                    {t('common.edit')}
                  </button>
                  <button type="button" className="btn small ghost danger" onClick={() => void handleDeleteSession(session)}>
                    {t('common.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {lastSession?.notes ? <p className="muted small">{t('detail.sessions.lastNote', { note: lastSession.notes })}</p> : null}
      </section>
    </div>
  )
}
