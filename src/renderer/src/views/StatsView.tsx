import { useMemo } from 'react'
import { GAME_STATUSES, platformGroupKey } from '@shared/catalog'
import { formatHours, formatMinutes } from '@shared/format'
import { BarChart, EmptyState, Loading, StatCard } from '../components/ui'
import { useI18n } from '../i18n'
import { UNKNOWN_GENRE, computeDashboard } from '../logic/stats'
import { useApp } from '../state/app'
import { useGames, useSessions } from '../state/data'

export function StatsView() {
  const games = useGames()
  const sessions = useSessions()
  const { go, openGameForm } = useApp()
  const { t, formatDate, formatDecimal } = useI18n()

  const dashboard = useMemo(
    () => computeDashboard(games ?? [], sessions ?? [], { weeks: 8 }),
    [games, sessions]
  )

  if (!games || !sessions) return <Loading label={t('stats.loading')} />

  if (games.length === 0) {
    return (
      <div className="view">
        <header className="view-header">
          <div>
            <h1>{t('stats.title')}</h1>
            <p className="view-sub">{t('stats.subtitle')}</p>
          </div>
        </header>
        <EmptyState
          icon="📊"
          title={t('stats.empty.title')}
          message={t('stats.empty.message')}
          action={
            <button type="button" className="btn primary" onClick={() => openGameForm()}>
              {t('app.addGame')}
            </button>
          }
        />
      </div>
    )
  }

  const maxEffortSessions = Math.max(1, ...dashboard.effortBuckets.map((bucket) => bucket.sessions))

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <h1>{t('stats.title')}</h1>
          <p className="view-sub">
            {t('stats.header.summary', {
              sessions: dashboard.totalSessions,
              games: dashboard.gamesWithSessions,
              streak: t(dashboard.streakDays === 1 ? 'stats.streak.one' : 'stats.streak.other', {
                count: dashboard.streakDays
              })
            })}
          </p>
        </div>
      </header>

      <section className="stat-grid">
        <StatCard
          label={t('stats.kpi.totalTime')}
          value={formatMinutes(dashboard.totalMinutes)}
          hint={
            dashboard.manualMinutes > 0
              ? t('stats.kpi.totalTime.manual', {
                  hours: formatHours(dashboard.totalMinutes),
                  minutes: formatMinutes(dashboard.manualMinutes)
                })
              : t('stats.kpi.totalTime.all', { hours: formatHours(dashboard.totalMinutes) })
          }
          tone="accent"
        />
        <StatCard
          label={t('stats.kpi.avgSatisfaction')}
          value={dashboard.avgSatisfaction !== null ? `${dashboard.avgSatisfaction}/5` : '—'}
          hint={t('stats.kpi.avgSatisfaction.hint')}
          tone="good"
        />
        <StatCard
          label={t('stats.kpi.avgEffort')}
          value={dashboard.avgEffort !== null ? `${dashboard.avgEffort}/5` : '—'}
          hint={t('stats.kpi.avgEffort.hint', { minutes: formatMinutes(dashboard.avgSessionMinutes ?? 0) })}
        />
        <StatCard
          label={t('stats.kpi.last30')}
          value={formatMinutes(dashboard.minutesLast30)}
          hint={t('stats.kpi.last30.hint', { sessions: dashboard.sessionsLast30, days: dashboard.activeDaysLast30 })}
        />
        <StatCard
          label={t('stats.kpi.gamesInLibrary')}
          value={String(dashboard.totalGames)}
          hint={t('stats.kpi.gamesInLibrary.hint', { count: dashboard.byStatus.playing })}
        />
        <StatCard
          label={t('stats.kpi.finishedDropped')}
          value={`${dashboard.byStatus.completed} / ${dashboard.byStatus.dropped}`}
          hint={t('stats.kpi.finishedDropped.hint', {
            backlog: dashboard.byStatus.backlog,
            wishlist: dashboard.byStatus.wishlist
          })}
        />
      </section>

      <section className="stat-grid">
        <StatCard
          label={t('stats.kpi.estimatedBacklog')}
          value={formatMinutes(dashboard.estimatedBacklogMinutes)}
          hint={t('stats.kpi.estimatedBacklog.hint', { hours: formatHours(dashboard.estimatedBacklogMinutes) })}
          tone="accent"
        />
        <StatCard
          label={t('stats.kpi.remaining')}
          value={formatMinutes(dashboard.remainingMinutes)}
          hint={t('stats.kpi.remaining.hint')}
          tone="warn"
        />
        <StatCard
          label={t('stats.kpi.completionist')}
          value={formatMinutes(dashboard.completionistBacklogMinutes)}
          hint={t('stats.kpi.completionist.hint')}
        />
        <StatCard
          label={t('stats.kpi.retroTime')}
          value={formatMinutes(dashboard.retroMinutes)}
          hint={t('stats.kpi.retroTime.hint', { count: dashboard.retroGames })}
        />
        <StatCard
          label={t('stats.kpi.knownDurations')}
          value={`${dashboard.gamesWithDuration}/${dashboard.totalGames}`}
          hint={t('stats.kpi.knownDurations.hint')}
        />
        <StatCard
          label={t('stats.kpi.avgMetascore')}
          value={dashboard.averageMetacritic !== null ? `${dashboard.averageMetacritic}/100` : '—'}
          hint={t('stats.kpi.avgMetascore.hint', { count: dashboard.gamesWithMetacritic })}
          tone={dashboard.averageMetacritic !== null && dashboard.averageMetacritic >= 75 ? 'good' : 'default'}
        />
        <StatCard
          label={t('stats.kpi.started')}
          value={String(dashboard.startedGames)}
          hint={t('stats.kpi.started.hint')}
          tone="good"
        />
        <StatCard
          label={t('stats.kpi.streak')}
          value={t(dashboard.streakDays === 1 ? 'stats.streak.one' : 'stats.streak.other', {
            count: dashboard.streakDays
          })}
          hint={t('stats.kpi.streak.hint')}
          tone="good"
        />
      </section>

      <div className="stats-columns">
        <section className="card">
          <h2 className="section-title">{t('stats.weeks.title')}</h2>
          <BarChart data={dashboard.weeks.map((week) => ({ label: week.label, value: week.minutes }))} />
        </section>

        <section className="card">
          <h2 className="section-title">{t('stats.effortSatisfaction.title')}</h2>
          <div className="stack">
            <table className="table compact">
              <thead>
                <tr>
                  <th>{t('label.effort')}</th>
                  <th>{t('stats.table.sessions')}</th>
                  <th>{t('label.duration')}</th>
                  <th>{t('stats.kpi.avgSatisfaction')}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.effortBuckets.map((bucket) => (
                  <tr key={bucket.effort}>
                    <td>
                      <span className="effort-pill">{bucket.effort}/5</span>
                      <span className="bar-inline">
                        <span
                          className="bar-inline-fill"
                          style={{ width: `${(bucket.sessions / maxEffortSessions) * 100}%` }}
                        />
                      </span>
                    </td>
                    <td>{bucket.sessions}</td>
                    <td>{formatMinutes(bucket.minutes)}</td>
                    <td>{bucket.avgSatisfaction !== null ? `${bucket.avgSatisfaction}/5` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small">{t('stats.effortSatisfaction.hint')}</p>
          </div>
        </section>
      </div>

      <div className="stats-columns">
        <section className="card">
          <h2 className="section-title">{t('stats.topByTime.title')}</h2>
          {dashboard.topByTime.length === 0 ? (
            <p className="muted">{t('stats.noSessions')}</p>
          ) : (
            <ul className="simple-list">
              {dashboard.topByTime.map((entry) => (
                <li key={entry.game.id}>
                  <button type="button" className="link" onClick={() => go({ name: 'detail', gameId: entry.game.id! })}>
                    {entry.game.title}
                  </button>
                  <span className="muted small">
                    {entry.avgSatisfaction !== null
                      ? t('stats.entry.withScore', {
                          minutes: formatMinutes(entry.minutes),
                          sessions: entry.sessions,
                          score: entry.avgSatisfaction
                        })
                      : t('stats.entry.plain', { minutes: formatMinutes(entry.minutes), sessions: entry.sessions })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="section-title">{t('stats.bestValue.title')}</h2>
          {dashboard.bestValue.length === 0 ? (
            <p className="muted">{t('stats.bestValue.empty')}</p>
          ) : (
            <ul className="simple-list">
              {dashboard.bestValue.map((entry) => (
                <li key={entry.game.id}>
                  <button type="button" className="link" onClick={() => go({ name: 'detail', gameId: entry.game.id! })}>
                    {entry.game.title}
                  </button>
                  <span className="muted small">
                    {t('stats.bestValue.entry', {
                      efficiency: entry.efficiency !== null ? formatDecimal(entry.efficiency, 2) : undefined,
                      minutes: formatMinutes(entry.minutes),
                      effort: entry.avgEffort
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="stats-columns">
        <section className="card">
          <h2 className="section-title">{t('stats.group.title')}</h2>
          {dashboard.groupSpread.length === 0 ? (
            <p className="muted">{t('stats.noData')}</p>
          ) : (
            <ul className="spread-list">
              {dashboard.groupSpread.map((entry) => {
                const max = Math.max(1, ...dashboard.groupSpread.map((item) => item.minutes))
                return (
                  <li key={entry.group}>
                    <span className="spread-label">
                      {t('stats.group.entry', { group: t(platformGroupKey(entry.group)), count: entry.games })}
                    </span>
                    <span className="bar-inline">
                      <span className="bar-inline-fill" style={{ width: `${(entry.minutes / max) * 100}%` }} />
                    </span>
                    <span className="muted small">{formatMinutes(entry.minutes)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="section-title">{t('stats.platform.title')}</h2>
          {dashboard.platformSpread.length === 0 ? (
            <p className="muted">{t('stats.noData')}</p>
          ) : (
            <ul className="spread-list">
              {dashboard.platformSpread.map((entry) => {
                const max = Math.max(1, dashboard.platformSpread[0].minutes)
                return (
                  <li key={entry.label}>
                    <span className="spread-label">
                      {entry.label === UNKNOWN_GENRE ? t('stats.genre.unknown') : entry.label}
                    </span>
                    <span className="bar-inline">
                      <span className="bar-inline-fill" style={{ width: `${(entry.minutes / max) * 100}%` }} />
                    </span>
                    <span className="muted small">{formatMinutes(entry.minutes)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="section-title">{t('stats.genre.title')}</h2>
          {dashboard.genreSpread.length === 0 ? (
            <p className="muted">{t('stats.noData')}</p>
          ) : (
            <ul className="spread-list">
              {dashboard.genreSpread.map((entry) => {
                const max = Math.max(1, dashboard.genreSpread[0].minutes)
                return (
                  <li key={entry.label}>
                    <span className="spread-label">
                      {entry.label === UNKNOWN_GENRE ? t('stats.genre.unknown') : entry.label}
                    </span>
                    <span className="bar-inline">
                      <span className="bar-inline-fill" style={{ width: `${(entry.minutes / max) * 100}%` }} />
                    </span>
                    <span className="muted small">{formatMinutes(entry.minutes)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <h2 className="section-title">{t('stats.recent.title')}</h2>
        {dashboard.recentSessions.length === 0 ? (
          <p className="muted">{t('stats.noSessions')}</p>
        ) : (
          <ul className="simple-list">
            {dashboard.recentSessions.map((session) => {
              const game = games.find((entry) => entry.id === session.gameId)
              return (
                <li key={session.id}>
                  <span>
                    {formatDate(session.date)} ·{' '}
                    <button type="button" className="link" onClick={() => game && go({ name: 'detail', gameId: game.id! })}>
                      {game?.title ?? t('stats.deletedGame')}
                    </button>
                  </span>
                  <span className="muted small">
                    {t('stats.recent.entry', {
                      minutes: formatMinutes(session.minutes),
                      effort: session.effort,
                      satisfaction: session.satisfaction
                    })}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">{t('stats.backlogStatus.title')}</h2>
        <div className="chip-group">
          {GAME_STATUSES.map((status) => (
            <span key={status.id} className={`chip static status-${status.id}`}>
              {t(status.labelKey)}: {dashboard.byStatus[status.id]}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
