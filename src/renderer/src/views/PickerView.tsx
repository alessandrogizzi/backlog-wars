import { useMemo, useState } from 'react'
import {
  DEFAULT_PICKABLE_STATUSES,
  GAME_STATUSES,
  PLATFORM_GROUPS,
  effortKey,
  pleasureKey
} from '@shared/catalog'
import type { GameStatus, PlatformGroup } from '@shared/catalog'
import type { PickWeights } from '@shared/types'
import { formatMinutes } from '@shared/format'
import { recordPick } from '../db/repo'
import { useI18n } from '../i18n'
import { Cover, DurationBadge, EmptyState, Loading, RatingDots, RetroChip, ScoreBar, Slider } from '../components/ui'
import { formatDuration, playedMinutes, referenceMinutes, remainingMinutes } from '../logic/duration'
import {
  DEFAULT_PICK_FILTERS,
  buildPool,
  describeFilters,
  shuffle,
  uniformPick,
  weightedPick,
  type PickFilters,
  type ScoredGame
} from '../logic/picker'
import { useApp } from '../state/app'
import { useGames } from '../state/data'
import { useSettings } from '../state/settings'
import { useToast } from '../state/toast'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export function PickerView() {
  const games = useGames()
  const { settings, save } = useSettings()
  const { openSessionForm, go } = useApp()
  const { notify } = useToast()
  const { t } = useI18n()

  const [filters, setFilters] = useState<PickFilters>(() => ({
    ...DEFAULT_PICK_FILTERS,
    statuses: [...DEFAULT_PICKABLE_STATUSES],
    targetEffort: settings.defaultEffortTarget,
    maxEffort: settings.defaultMaxEffort,
    minPleasure: settings.defaultMinPleasure,
    avoidRecentDays: settings.avoidRecentDays,
    maxHours: settings.defaultMaxHours,
    timeAvailableHours: settings.timeAvailableHours
  }))
  const [weights, setWeights] = useState<PickWeights>(settings.weights)
  const [mode, setMode] = useState<'smart' | 'random'>('smart')
  const [rolling, setRolling] = useState(false)
  const [rollTitle, setRollTitle] = useState('')
  const [result, setResult] = useState<ScoredGame | null>(null)
  const [pickId, setPickId] = useState<number | null>(null)
  const [recent, setRecent] = useState<Array<{ title: string; score: number; mode: string }>>([])

  const platforms = useMemo(
    () => [...new Set((games ?? []).map((game) => game.platform).filter(Boolean))].sort(),
    [games]
  )
  const genres = useMemo(() => [...new Set((games ?? []).flatMap((game) => game.genres))].sort(), [games])

  const pool = useMemo(
    () => buildPool(games ?? [], filters, weights, Date.now()),
    [games, filters, weights]
  )

  const patchFilters = (changes: Partial<PickFilters>): void => setFilters((current) => ({ ...current, ...changes }))
  const patchWeights = (changes: Partial<PickWeights>): void => setWeights((current) => ({ ...current, ...changes }))
  const weightTotal =
    weights.effort + weights.pleasure + weights.priority + weights.novelty + weights.duration

  const roll = async (): Promise<void> => {
    if (pool.length === 0) {
      notify(t('play.noCandidates'), 'error')
      return
    }
    setResult(null)
    setPickId(null)
    setRolling(true)
    const picked = mode === 'smart' ? weightedPick(pool, Math.random) : uniformPick(pool, Math.random)
    const titles = shuffle(pool.slice(0, Math.min(14, pool.length)).map((entry) => entry.game.title), Math.random)
    for (let index = 0; index < 14; index += 1) {
      setRollTitle(titles[index % titles.length])
      await sleep(45 + index * 18)
    }
    setRolling(false)
    if (!picked || !picked.game.id) return
    setRollTitle(picked.game.title)
    setResult(picked)
    const id = await recordPick({
      gameId: picked.game.id,
      mode: mode === 'smart' ? 'smart' : 'roulette',
      accepted: 0,
      filters: describeFilters(filters)
    })
    setPickId(id)
    setRecent((current) => [{ title: picked.game.title, score: picked.score, mode }, ...current].slice(0, 8))
  }

  const saveDefaults = async (): Promise<void> => {
    await save({
      defaultEffortTarget: filters.targetEffort,
      defaultMaxEffort: filters.maxEffort,
      defaultMinPleasure: filters.minPleasure,
      avoidRecentDays: filters.avoidRecentDays,
      defaultMaxHours: filters.maxHours,
      timeAvailableHours: filters.timeAvailableHours,
      weights
    })
    notify(t('play.defaultsSaved'), 'ok')
  }

  if (!games) return <Loading label={t('play.loading')} />

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <h1>{t('play.title')}</h1>
          <p className="view-sub">{t('play.subtitle', { pool: pool.length, total: games.length })}</p>
        </div>
        <div className="view-actions">
          <button type="button" className="btn ghost" onClick={() => void go({ name: 'tournament' })}>
            🏆 {t('play.tournamentMode')}
          </button>
        </div>
      </header>

      <div className="picker-layout">
        <section className="card picker-filters">
          <h2 className="section-title">{t('play.filters.title')}</h2>

          <div className="stack">
            <div className="field">
              <span className="field-label">{t('play.filters.statuses')}</span>
              <div className="chip-group">
                {GAME_STATUSES.map((status) => {
                  const active = filters.statuses.includes(status.id)
                  return (
                    <button
                      key={status.id}
                      type="button"
                      className={`chip${active ? ' active' : ''}`}
                      onClick={() =>
                        patchFilters({
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
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span className="field-label">{t('label.platform')}</span>
                <select
                  className="select"
                  value={filters.platform}
                  onChange={(event) => patchFilters({ platform: event.target.value })}
                >
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
                <select className="select" value={filters.genre} onChange={(event) => patchFilters({ genre: event.target.value })}>
                  <option value="all">{t('common.all')}</option>
                  {genres.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <Slider
            label={t('play.filters.targetEffort')}
            value={filters.targetEffort}
            onChange={(value) => patchFilters({ targetEffort: value })}
            display={`${filters.targetEffort}/5 · ${t(effortKey(filters.targetEffort))}`}
          />
          <Slider
            label={t('play.filters.maxEffort')}
            value={filters.maxEffort}
            onChange={(value) => patchFilters({ maxEffort: value })}
            display={`${filters.maxEffort}/5`}
          />
          <Slider
            label={t('play.filters.minPleasure')}
            value={filters.minPleasure}
            onChange={(value) => patchFilters({ minPleasure: value })}
            display={`${filters.minPleasure}/5 · ${t(pleasureKey(filters.minPleasure))}`}
          />
          <Slider
            label={t('play.filters.avoidRecent')}
            value={filters.avoidRecentDays}
            min={0}
            max={30}
            onChange={(value) => patchFilters({ avoidRecentDays: value })}
            display={filters.avoidRecentDays === 0 ? t('common.no') : t('play.filters.days', { count: filters.avoidRecentDays })}
          />

          <div className="field">
            <span className="field-label">{t('play.filters.platformType')}</span>
            <div className="platform-group-chips">
              {PLATFORM_GROUPS.map((group) => {
                const active = filters.groups.includes(group.id)
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={`chip${active ? ' active' : ''}`}
                    onClick={() =>
                      patchFilters({
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
          </div>

          <Slider
            label={t('play.filters.timeAvailable')}
            value={filters.timeAvailableHours}
            min={0}
            max={8}
            step={0.5}
            onChange={(value) => patchFilters({ timeAvailableHours: value })}
            display={
              filters.timeAvailableHours === 0
                ? t('play.filters.timeUnset')
                : `${filters.timeAvailableHours} ${t('label.hours')}`
            }
          />
          <Slider
            label={t('play.filters.maxDuration')}
            value={filters.maxHours}
            min={0}
            max={120}
            step={5}
            onChange={(value) => patchFilters({ maxHours: value })}
            display={filters.maxHours === 0 ? t('play.filters.noLimit') : `${filters.maxHours} ${t('label.hours')}`}
          />

          <div className="chip-group">
            <button
              type="button"
              className={`chip${filters.onlyNeverPlayed ? ' active' : ''}`}
              onClick={() => patchFilters({ onlyNeverPlayed: !filters.onlyNeverPlayed })}
            >
              {t('play.filters.neverPlayed')}
            </button>
            <button
              type="button"
              className={`chip${filters.onlyFavorites ? ' active' : ''}`}
              onClick={() => patchFilters({ onlyFavorites: !filters.onlyFavorites })}
            >
              ★ {t('play.filters.favoritesOnly')}
            </button>
          </div>

          <h2 className="section-title">{t('play.weights.title')}</h2>
          <Slider
            label={t('play.weights.effort')}
            value={weights.effort}
            min={0}
            max={100}
            step={5}
            onChange={(value) => patchWeights({ effort: value })}
            display={`${weights.effort}%`}
          />
          <Slider
            label={t('play.weights.pleasure')}
            value={weights.pleasure}
            min={0}
            max={100}
            step={5}
            onChange={(value) => patchWeights({ pleasure: value })}
            display={`${weights.pleasure}%`}
          />
          <Slider
            label={t('label.priority')}
            value={weights.priority}
            min={0}
            max={100}
            step={5}
            onChange={(value) => patchWeights({ priority: value })}
            display={`${weights.priority}%`}
          />
          <Slider
            label={t('play.weights.novelty')}
            value={weights.novelty}
            min={0}
            max={100}
            step={5}
            onChange={(value) => patchWeights({ novelty: value })}
            display={`${weights.novelty}%`}
          />
          <Slider
            label={t('play.weights.duration')}
            value={weights.duration}
            min={0}
            max={100}
            step={5}
            onChange={(value) => patchWeights({ duration: value })}
            display={`${weights.duration}%`}
          />
          <div className="stack">
            <p className="muted small">
              {t('play.weights.total', { total: weightTotal })}
              {weightTotal === 0 ? ` ${t('play.weights.allZero')}` : ''}
            </p>

            <div className="view-actions">
              <button
                type="button"
                className="btn ghost small"
                onClick={() =>
                  setFilters({
                    ...DEFAULT_PICK_FILTERS,
                    statuses: [...DEFAULT_PICKABLE_STATUSES],
                    targetEffort: settings.defaultEffortTarget,
                    maxEffort: settings.defaultMaxEffort,
                    minPleasure: settings.defaultMinPleasure,
                    avoidRecentDays: settings.avoidRecentDays,
                    maxHours: settings.defaultMaxHours,
                    timeAvailableHours: settings.timeAvailableHours
                  })
                }
              >
                {t('common.clearFilters')}
              </button>
              <button type="button" className="btn ghost small" onClick={() => void saveDefaults()}>
                {t('play.saveDefaults')}
              </button>
            </div>
          </div>
        </section>

        <section className="picker-stage">
          <div className="card slot">
            <div className="mode-switch">
              <button
                type="button"
                className={`chip${mode === 'smart' ? ' active' : ''}`}
                onClick={() => setMode('smart')}
              >
                🧠 {t('play.mode.smart')}
              </button>
              <button
                type="button"
                className={`chip${mode === 'random' ? ' active' : ''}`}
                onClick={() => setMode('random')}
              >
                🎲 {t('play.mode.random')}
              </button>
            </div>

            <div className={`slot-window${rolling ? ' rolling' : ''}`}>
              <span className="slot-label">
                {rolling ? t('play.slot.rolling') : result ? t('play.slot.drawn') : t('play.slot.ready')}
              </span>
              <span className="slot-title">{rollTitle || t('common.dash')}</span>
            </div>

            <button type="button" className="btn primary big block" onClick={() => void roll()} disabled={rolling}>
              {rolling ? t('play.roll.rolling') : result ? `🎲 ${t('play.roll.again')}` : `🎲 ${t('play.roll.start')}`}
            </button>

            {pool.length === 0 ? (
              <p className="notice">{t('play.empty.poolNotice')}</p>
            ) : null}
          </div>

          {result ? (
            <div className="card result-card">
              <div className="result-head">
                <Cover game={result.game} size="md" />
                <div className="result-info">
                  <h2>{result.game.title}</h2>
                  <p className="muted small">
                    {result.game.platform}
                    {result.game.releaseYear ? ` · ${result.game.releaseYear}` : ''} ·{' '}
                    {result.game.genres.slice(0, 3).join(', ') || t('label.genreUnknown')}
                  </p>
                  <p className="muted small">
                    {result.game.sessionCount === 1
                      ? t('play.result.played.one', { time: formatMinutes(result.game.totalMinutes) })
                      : t('play.result.played.other', {
                          time: formatMinutes(result.game.totalMinutes),
                          count: result.game.sessionCount
                        })}
                    {result.game.avgSatisfaction !== null
                      ? ` · ${t('play.result.avgSatisfaction', { value: result.game.avgSatisfaction })}`
                      : ''}
                  </p>
                  <div className="meter-row">
                    <span className="meter-label">{t('label.effort')}</span>
                    <RatingDots readOnly value={result.game.effortEstimate} tone="effort" />
                    <span className="meter-label">{t('label.pleasure')}</span>
                    <RatingDots readOnly value={result.game.pleasure} tone="pleasure" />
                    <RetroChip platform={result.game.platform} />
                  </div>
                  <div className="meter-row">
                    <DurationBadge game={result.game} />
                    {referenceMinutes(result.game) ? (
                      <span className="muted small">
                        {t('play.result.story', { time: formatDuration(referenceMinutes(result.game)) })} ·{' '}
                        {t('play.result.remaining', { time: formatDuration(remainingMinutes(result.game)) })}
                      </span>
                    ) : (
                      <span className="muted small">{t('play.result.unknownDuration')}</span>
                    )}
                  </div>
                </div>
                <div className="result-score">
                  <span className="score-big">{result.score}</span>
                  <span className="muted small">{t('play.result.score')}</span>
                </div>
              </div>

              <div className="breakdown">
                <ScoreBar label={t('play.breakdown.energy')} value={result.breakdown.effort * 100} />
                <ScoreBar label={t('label.pleasure')} value={result.breakdown.pleasure * 100} />
                <ScoreBar label={t('label.priority')} value={result.breakdown.priority * 100} />
                <ScoreBar label={t('play.breakdown.novelty')} value={result.breakdown.novelty * 100} />
                <ScoreBar label={t('play.breakdown.time')} value={result.breakdown.duration * 100} />
              </div>

              <div className="view-actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => openSessionForm({ game: result.game, pickId: pickId ?? undefined })}
                >
                  ✅ {t('play.accept')}
                </button>
                <button type="button" className="btn ghost" onClick={() => void roll()} disabled={rolling}>
                  🔁 {t('play.reject')}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setResult(null)
                    setRollTitle('')
                  }}
                >
                  {t('play.discard')}
                </button>
                <button type="button" className="btn ghost" onClick={() => go({ name: 'detail', gameId: result.game.id! })}>
                  {t('play.openDetail')}
                </button>
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="section-head">
              <h2 className="section-title">{t('play.pool.title', { count: pool.length })}</h2>
              <span className="muted small">{t('play.pool.sortedByScore')}</span>
            </div>
            {pool.length === 0 ? (
              <EmptyState
                icon="🫥"
                title={t('play.pool.emptyTitle')}
                message={t('play.pool.emptyMessage')}
                action={
                  <button type="button" className="btn primary" onClick={() => go({ name: 'library' })}>
                    {t('play.pool.goToLibrary')}
                  </button>
                }
              />
            ) : (
              <ul className="pool-list">
                {pool.slice(0, 10).map((entry) => (
                  <li key={entry.game.id} className="pool-row">
                    <button type="button" className="pool-title" onClick={() => go({ name: 'detail', gameId: entry.game.id! })}>
                      {entry.game.title}
                    </button>
                    <span className="muted small">
                      {t('play.pool.row', {
                        effort: entry.game.effortEstimate,
                        pleasure: entry.game.pleasure
                      })}{' '}
                      ·{' '}
                      {entry.game.lastPlayedAt || playedMinutes(entry.game) > 0
                        ? formatMinutes(playedMinutes(entry.game))
                        : t('label.neverPlayed')}
                      {referenceMinutes(entry.game) ? ` · ⏳ ${formatDuration(referenceMinutes(entry.game))}` : ''}
                    </span>
                    <ScoreBar value={entry.score} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {recent.length > 0 ? (
            <div className="card">
              <h2 className="section-title">{t('play.recent.title')}</h2>
              <ul className="simple-list">
                {recent.map((entry, index) => (
                  <li key={`${entry.title}-${index}`}>
                    <span>{entry.title}</span>
                    <span className="muted small">
                      {entry.mode === 'smart' ? t('play.recent.smart') : t('play.recent.random')} · {entry.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
