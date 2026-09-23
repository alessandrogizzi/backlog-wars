import { useMemo, useState } from 'react'
import { DEFAULT_PICKABLE_STATUSES, GAME_STATUSES, PLATFORM_GROUPS } from '@shared/catalog'
import type { GameStatus, PlatformGroup } from '@shared/catalog'
import { formatMinutes } from '@shared/format'
import { formatDuration, referenceMinutes } from '../logic/duration'
import type { Game } from '../db/types'
import { useI18n } from '../i18n'
import { Cover, EmptyState, Loading, Slider } from '../components/ui'
import {
  DEFAULT_PICK_FILTERS,
  bracketSizes,
  buildBracket,
  buildPool,
  championOf,
  pickWinner,
  type Bracket,
  type BracketMatch,
  type PickFilters
} from '../logic/picker'
import { useApp } from '../state/app'
import { useGames } from '../state/data'
import { useSettings } from '../state/settings'
import { useToast } from '../state/toast'

export function TournamentView() {
  const games = useGames()
  const { settings } = useSettings()
  const { openSessionForm, go } = useApp()
  const { notify } = useToast()
  const { t } = useI18n()

  const [filters, setFilters] = useState<PickFilters>(() => ({
    ...DEFAULT_PICK_FILTERS,
    statuses: [...DEFAULT_PICKABLE_STATUSES],
    targetEffort: settings.defaultEffortTarget,
    maxEffort: settings.defaultMaxEffort,
    minPleasure: settings.defaultMinPleasure
  }))
  const [size, setSize] = useState(8)
  const [bracket, setBracket] = useState<Bracket | null>(null)

  const platforms = useMemo(() => [...new Set((games ?? []).map((game) => game.platform).filter(Boolean))].sort(), [games])
  const genres = useMemo(() => [...new Set((games ?? []).flatMap((game) => game.genres))].sort(), [games])
  const pool = useMemo(() => buildPool(games ?? [], filters, settings.weights, Date.now()), [games, filters, settings.weights])
  const champion = bracket ? championOf(bracket) : null

  const patch = (changes: Partial<PickFilters>): void => setFilters((current) => ({ ...current, ...changes }))

  const generate = (): void => {
    if (pool.length < 2) {
      notify(t('play.tournament.needTwo'), 'error')
      return
    }
    setBracket(buildBracket(pool, size, Math.random))
  }

  const decide = (match: BracketMatch, game: Game): void => {
    if (!game.id || match.winner !== null) return
    setBracket((current) => (current ? pickWinner(current, match.id, game.id!) : current))
  }

  if (!games) return <Loading label={t('play.tournament.loading')} />

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <h1>{t('play.tournament.title')}</h1>
          <p className="view-sub">{t('play.tournament.subtitle')}</p>
        </div>
        <div className="view-actions">
          <button type="button" className="btn primary" onClick={generate}>
            🏆 {t('play.tournament.generate')}
          </button>
          {bracket ? (
            <button type="button" className="btn ghost" onClick={() => setBracket(null)}>
              {t('common.reset')}
            </button>
          ) : null}
        </div>
      </header>

      <section className="card">
        <div className="form-grid">
          <label className="field">
            <span className="field-label">{t('play.tournament.size')}</span>
            <select className="select" value={size} onChange={(event) => setSize(Number(event.target.value))}>
              {bracketSizes().map((value) => (
                <option key={value} value={value}>
                  {t('play.tournament.sizeGames', { count: value })}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">{t('label.platform')}</span>
            <select className="select" value={filters.platform} onChange={(event) => patch({ platform: event.target.value })}>
              <option value="all">{t('common.all')}</option>
              {platforms.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">{t('label.genre')}</span>
            <select className="select" value={filters.genre} onChange={(event) => patch({ genre: event.target.value })}>
              <option value="all">{t('common.all')}</option>
              {genres.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <Slider
              label={t('play.filters.maxEffort')}
              value={filters.maxEffort}
              onChange={(value) => patch({ maxEffort: value })}
              display={`${filters.maxEffort}/5`}
            />
            <Slider
              label={t('play.filters.minPleasure')}
              value={filters.minPleasure}
              onChange={(value) => patch({ minPleasure: value })}
              display={`${filters.minPleasure}/5`}
            />
          </div>
        </div>
        <div className="platform-group-chips">
          {PLATFORM_GROUPS.map((group) => {
            const active = filters.groups.includes(group.id)
            return (
              <button
                key={group.id}
                type="button"
                className={`chip${active ? ' active' : ''}`}
                onClick={() =>
                  patch({
                    groups: active
                      ? filters.groups.filter((entry) => entry !== group.id)
                      : [...filters.groups, group.id as PlatformGroup]
                  })
                }
              >
                {group.icon} {t(group.labelKey)}
              </button>
            )
          })}
        </div>
        <div className="chip-group">
          {GAME_STATUSES.map((status) => {
            const active = filters.statuses.includes(status.id)
            return (
              <button
                key={status.id}
                type="button"
                className={`chip${active ? ' active' : ''}`}
                onClick={() =>
                  patch({
                    statuses: active
                      ? filters.statuses.filter((entry) => entry !== status.id)
                      : [...filters.statuses, status.id as GameStatus]
                  })
                }
              >
                {t(status.shortKey)}
              </button>
            )
          })}
          <span className="muted small">{t('play.tournament.poolCount', { count: pool.length })}</span>
        </div>
      </section>

      {!bracket ? (
        <EmptyState
          icon="🏆"
          title={t('play.tournament.emptyTitle')}
          message={t('play.tournament.emptyMessage')}
          action={
            <button type="button" className="btn primary" onClick={generate}>
              {t('play.tournament.generate')}
            </button>
          }
        />
      ) : (
        <>
          <section className="bracket">
            {bracket.rounds.map((round, roundIndex) => (
              <div key={roundIndex} className="bracket-round">
                <h3 className="bracket-round-title">
                  {roundIndex === bracket.rounds.length - 1
                    ? t('play.round.final')
                    : roundIndex === bracket.rounds.length - 2
                      ? t('play.round.semifinals')
                      : t('play.round.number', { round: roundIndex + 1 })}
                </h3>
                {round.map((match) => (
                  <div key={match.id} className="bracket-match">
                    {[match.a, match.b].map((game, slot) => (
                      <button
                        key={`${match.id}-${slot}`}
                        type="button"
                        className={`bracket-slot${game && match.winner === game.id ? ' winner' : ''}${
                          match.winner !== null && (!game || match.winner !== game.id) ? ' loser' : ''
                        }`}
                        disabled={!game || match.winner !== null}
                        onClick={() => game && decide(match, game)}
                      >
                        {game ? (
                          <>
                            <Cover game={game} size="sm" />
                            <span className="bracket-slot-body">
                              <strong>{game.title}</strong>
                              <span className="muted small">
                                {t('play.bracket.slot', {
                                  effort: game.effortEstimate,
                                  pleasure: game.pleasure
                                })}
                                {game.sessionCount > 0
                                  ? ` · ${formatMinutes(game.totalMinutes)}`
                                  : ` · ${t('label.neverPlayed')}`}
                                {referenceMinutes(game) ? ` · ⏳ ${formatDuration(referenceMinutes(game))}` : ''}
                              </span>
                            </span>
                          </>
                        ) : (
                          <span className="muted small">{t('play.bracket.waiting')}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </section>

          {champion ? (
            <section className="card champion">
              <Cover game={champion} size="lg" />
              <div>
                <span className="champion-label">🏆 {t('play.champion.title')}</span>
                <h2>{champion.title}</h2>
                <p className="muted small">
                  {t('play.champion.stats', {
                    platform: champion.platform,
                    effort: champion.effortEstimate,
                    pleasure: champion.pleasure
                  })}
                </p>
                <div className="view-actions">
                  <button type="button" className="btn primary" onClick={() => openSessionForm({ game: champion })}>
                    ⏱ {t('play.champion.playNow')}
                  </button>
                  <button type="button" className="btn ghost" onClick={() => go({ name: 'detail', gameId: champion.id! })}>
                    {t('play.openDetail')}
                  </button>
                  <button type="button" className="btn ghost" onClick={generate}>
                    {t('play.champion.newTournament')}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
