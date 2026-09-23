import { useMemo, useState } from 'react'
import { formatMinutes } from '@shared/format'
import { deleteSession } from '../db/repo'
import type { PlaySession } from '../db/types'
import { EmptyState, Loading, RatingDots, StatCard } from '../components/ui'
import { useI18n } from '../i18n'
import { useApp } from '../state/app'
import { useGames, useSessions } from '../state/data'
import { useToast } from '../state/toast'

type SortKey = 'date' | 'minutes' | 'satisfaction' | 'effort'

export function SessionsView() {
  const sessions = useSessions()
  const games = useGames()
  const { openSessionForm, confirm, go } = useApp()
  const { notify } = useToast()
  const { t, formatDate, formatDecimal } = useI18n()

  const [gameFilter, setGameFilter] = useState<string>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState<SortKey>('date')

  const gameById = useMemo(() => new Map((games ?? []).map((game) => [game.id!, game])), [games])

  const filtered = useMemo(() => {
    const list = (sessions ?? []).filter((session) => {
      if (gameFilter !== 'all' && String(session.gameId) !== gameFilter) return false
      if (from && session.date < from) return false
      if (to && session.date > to) return false
      return true
    })
    const sorters: Record<SortKey, (a: PlaySession, b: PlaySession) => number> = {
      date: (a, b) => b.startedAt - a.startedAt,
      minutes: (a, b) => b.minutes - a.minutes,
      satisfaction: (a, b) => b.satisfaction - a.satisfaction,
      effort: (a, b) => b.effort - a.effort
    }
    return [...list].sort(sorters[sort])
  }, [sessions, gameFilter, from, to, sort])

  const totals = useMemo(() => {
    const minutes = filtered.reduce((sum, session) => sum + session.minutes, 0)
    const avg = (values: number[]): string =>
      values.length === 0 ? '—' : formatDecimal(values.reduce((sum, value) => sum + value, 0) / values.length, 2)
    return {
      minutes,
      count: filtered.length,
      satisfaction: avg(filtered.map((session) => session.satisfaction)),
      effort: avg(filtered.map((session) => session.effort)),
      days: new Set(filtered.map((session) => session.date)).size
    }
  }, [filtered])

  const handleDelete = async (session: PlaySession): Promise<void> => {
    const title = gameById.get(session.gameId)?.title ?? t('log.gameDeleted')
    const accepted = await confirm({
      title: t('log.delete.title'),
      message: t('log.delete.message', {
        title,
        date: formatDate(session.date),
        minutes: formatMinutes(session.minutes)
      }),
      confirmLabel: t('common.delete'),
      danger: true
    })
    if (!accepted || !session.id) return
    await deleteSession(session.id)
    notify(t('log.deleted'), 'ok')
  }

  if (!sessions || !games) return <Loading label={t('log.loading')} />

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <h1>{t('log.title')}</h1>
          <p className="view-sub">{t('log.subtitle')}</p>
        </div>
        <div className="view-actions">
          <button type="button" className="btn primary" onClick={() => openSessionForm()}>
            {t('log.newSession')}
          </button>
        </div>
      </header>

      {sessions.length === 0 ? (
        <EmptyState
          icon="⏱"
          title={t('log.empty.title')}
          message={t('log.empty.message')}
          action={
            <button type="button" className="btn primary" onClick={() => openSessionForm()}>
              {t('log.empty.action')}
            </button>
          }
        />
      ) : (
        <>
          <section className="stat-grid">
            <StatCard
              label={t('log.kpi.filtered')}
              value={String(totals.count)}
              hint={t(totals.days === 1 ? 'log.kpi.days.one' : 'log.kpi.days.other', { count: totals.days })}
            />
            <StatCard label={t('log.kpi.totalTime')} value={formatMinutes(totals.minutes)} tone="accent" />
            <StatCard label={t('log.kpi.avgSatisfaction')} value={`${totals.satisfaction}/5`} tone="good" />
            <StatCard label={t('log.kpi.avgEffort')} value={`${totals.effort}/5`} />
          </section>

          <section className="filters card">
            <div className="filters-row">
              <select className="select" value={gameFilter} onChange={(event) => setGameFilter(event.target.value)}>
                <option value="all">{t('log.filter.allGames')}</option>
                {games.map((game) => (
                  <option key={game.id} value={String(game.id)}>
                    {game.title}
                  </option>
                ))}
              </select>
              <label className="inline-field">
                <span className="field-label">{t('log.filter.from')}</span>
                <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </label>
              <label className="inline-field">
                <span className="field-label">{t('log.filter.to')}</span>
                <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </label>
              <select className="select" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                <option value="date">{t('log.sort.date')}</option>
                <option value="minutes">{t('log.sort.minutes')}</option>
                <option value="satisfaction">{t('log.sort.satisfaction')}</option>
                <option value="effort">{t('log.sort.effort')}</option>
              </select>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  setGameFilter('all')
                  setFrom('')
                  setTo('')
                }}
              >
                {t('common.reset')}
              </button>
            </div>
          </section>

          <section className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('log.table.date')}</th>
                  <th>{t('log.table.game')}</th>
                  <th>{t('label.duration')}</th>
                  <th>{t('label.effort')}</th>
                  <th>{t('log.table.satisfaction')}</th>
                  <th>{t('log.table.notes')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((session) => {
                  const game = gameById.get(session.gameId)
                  return (
                    <tr key={session.id}>
                      <td className="nowrap">{formatDate(session.date)}</td>
                      <td>
                        <button
                          type="button"
                          className="link"
                          onClick={() => game && go({ name: 'detail', gameId: game.id! })}
                        >
                          {game?.title ?? t('log.gameDeleted')}
                        </button>
                        {game ? <span className="muted small"> · {game.platform}</span> : null}
                      </td>
                      <td className="nowrap">{formatMinutes(session.minutes)}</td>
                      <td>
                        <RatingDots readOnly value={session.effort} tone="effort" />
                      </td>
                      <td>
                        <RatingDots readOnly value={session.satisfaction} tone="satisfaction" />
                      </td>
                      <td className="notes-cell">
                        {session.progress ? <div>{session.progress}</div> : null}
                        {session.notes ? <div className="muted small">{session.notes}</div> : null}
                      </td>
                      <td className="nowrap">
                        <button type="button" className="btn small ghost" onClick={() => openSessionForm({ session })}>
                          {t('common.edit')}
                        </button>
                        <button type="button" className="btn small ghost danger" onClick={() => void handleDelete(session)}>
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? <p className="muted">{t('log.noResults')}</p> : null}
          </section>
        </>
      )}
    </div>
  )
}
