import { useState, type ChangeEvent, type ReactNode } from 'react'
import type { GameStatus } from '@shared/catalog'
import { emulatorHint, isRetroPlatform, statusLabelKey } from '@shared/catalog'
import { clamp, formatMinutes } from '@shared/format'
import type { Game } from '../db/types'
import { useI18n } from '../i18n'
import {
  completionRatio,
  formatDuration,
  manualMinutes,
  playedMinutes,
  referenceMinutes,
  remainingMinutes,
  type DurationFields
} from '../logic/duration'

/* ------------------------------- Modal --------------------------------- */

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = 'md'
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const { t } = useI18n()
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal modal-${size}`}>
        <header className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="btn icon ghost" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}

/* ------------------------------- Fields -------------------------------- */

export function Field({
  label,
  hint,
  children,
  wide
}: {
  label: string
  hint?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <label className={`field${wide ? ' field-wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  multi = false
}: {
  options: Array<{ value: T; label: string }>
  value: T[] 
  onChange: (next: T[]) => void
  multi?: boolean
}) {
  const toggle = (option: T): void => {
    if (!multi) {
      onChange([option])
      return
    }
    onChange(value.includes(option) ? value.filter((entry) => entry !== option) : [...value, option])
  }
  return (
    <div className="chip-group">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={`chip${value.includes(option.value) ? ' active' : ''}`}
          onClick={() => toggle(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (next: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segment${value === option.value ? ' active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({
  value,
  min = 1,
  max = 5,
  step = 1,
  onChange,
  label,
  display
}: {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (next: number) => void
  label?: string
  display?: string
}) {
  return (
    <div className="slider">
      <div className="slider-head">
        {label ? <span className="field-label">{label}</span> : null}
        {display ? <span className="slider-value">{display}</span> : null}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
        // Prevent the mouse wheel from changing the value while the page scrolls.
        onWheel={(event) => event.currentTarget.blur()}
      />
    </div>
  )
}

export function RatingDots({
  value,
  onChange,
  max = 5,
  readOnly = false,
  tone = 'pleasure',
  label
}: {
  value: number
  onChange?: (next: number) => void
  max?: number
  readOnly?: boolean
  tone?: 'pleasure' | 'effort' | 'priority' | 'satisfaction'
  label?: string
}) {
  const { t } = useI18n()
  return (
    <div className={`rating rating-${tone}${readOnly ? ' read-only' : ''}`}>
      {label ? <span className="field-label">{label}</span> : null}
      <div className="dots">
        {Array.from({ length: max }, (_, index) => index + 1).map((dot) => (
          <button
            key={dot}
            type="button"
            className={`dot${dot <= Math.round(value) ? ' on' : ''}`}
            disabled={readOnly}
            onClick={() => onChange?.(dot)}
            aria-label={t('ui.rating.valueOf', { value: dot, max })}
          />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------ Presentation ---------------------------- */

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function StatusBadge({ status }: { status: GameStatus }) {
  const { t } = useI18n()
  return <span className={`badge status-${status}`}>{t(statusLabelKey(status))}</span>
}

export function Cover({ game, size = 'md' }: { game: Pick<Game, 'title' | 'coverUrl'>; size?: 'sm' | 'md' | 'lg' }) {
  const { t } = useI18n()
  const [broken, setBroken] = useState(false)
  const initials = game.title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

  if (!game.coverUrl || broken) {
    return (
      <div className={`cover cover-${size} cover-fallback`}>
        <span>{initials || '?'}</span>
      </div>
    )
  }
  return (
    <img
      className={`cover cover-${size}`}
      src={game.coverUrl}
      alt={t('ui.cover.alt', { title: game.title })}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  )
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default'
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'accent' | 'good' | 'warn'
}) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </div>
  )
}

export function BarChart({ data, unit = 'm' }: { data: Array<{ label: string; value: number }>; unit?: string }) {
  const max = Math.max(1, ...data.map((entry) => entry.value))
  return (
    <div className="bar-chart">
      {data.map((entry) => (
        <div key={entry.label} className="bar-column" title={`${entry.label}: ${entry.value}${unit}`}>
          <span className="bar-value">{entry.value > 0 ? `${entry.value}${unit}` : ''}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${clamp((entry.value / max) * 100, 2, 100)}%` }} />
          </div>
          <span className="bar-label">{entry.label}</span>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  message,
  action
}: {
  icon: string
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  )
}

export function ScoreBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="score-bar">
      {label ? <span className="score-bar-label">{label}</span> : null}
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${clamp(value, 0, 100)}%` }} />
      </div>
      <span className="score-bar-value">{Math.round(value)}</span>
    </div>
  )
}

export function Loading({ label }: { label?: string }) {
  const { t } = useI18n()
  return <div className="loading">{label ?? t('common.loading')}</div>
}

export function MinutesInput({
  minutes,
  onChange
}: {
  minutes: number
  onChange: (next: number) => void
}) {
  const presets = [15, 30, 45, 60, 90, 120, 180]
  return (
    <div className="minutes-input">
      <input
        className="input"
        type="number"
        min={1}
        max={1440}
        value={minutes}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value)))}
      />
      <div className="chip-group">
        {presets.map((preset) => (
          <button key={preset} type="button" className="chip" onClick={() => onChange(preset)}>
            {formatMinutes(preset)}
          </button>
        ))}
      </div>
    </div>
  )
}

/* -------------------------- Durations and retrogaming ------------------- */

/** Compact badge with the main story duration. No "time left": how much a game
 * still needs is a guess, the length HowLongToBeat measured is a fact. */
export function DurationBadge({ game }: { game: Partial<DurationFields> }) {
  const { t } = useI18n()
  const reference = referenceMinutes(game)
  if (!reference) return null
  const played = playedMinutes(game) > 0
  return (
    <span
      className="badge badge-duration"
      title={`${t('ui.duration.estimated', { duration: formatDuration(reference) })}${
        played ? ` · ${t('ui.duration.played', { duration: formatDuration(playedMinutes(game)) })}` : ''
      }`}
    >
      ⏳ {formatDuration(reference)}
    </span>
  )
}

/**
 * The average time the game needs against the time played: the estimate on the
 * left, my hours on the right, and a bar relating them. Deliberately without a
 * "time left" figure, which would be a guess dressed up as a number.
 */
export function PlaytimeMeter({ game }: { game: Partial<DurationFields> }) {
  const { t } = useI18n()
  const reference = referenceMinutes(game)
  const played = playedMinutes(game)
  const declared = manualMinutes(game)

  const playedTitle =
    declared > 0
      ? t('library.card.playedTimeManual', { time: formatMinutes(played), manual: formatMinutes(declared) })
      : t('library.card.playedTimeSessions')

  // No estimate to compare with: the playtime on its own is still worth a line.
  if (!reference) {
    if (played <= 0) return null
    return (
      <p className="playtime playtime-solo" title={playedTitle}>
        ⏱ {formatMinutes(played)}
      </p>
    )
  }

  const percent = Math.round((completionRatio(game) ?? 0) * 100)
  const summary = `${t('ui.duration.playedOf', {
    played: formatMinutes(played),
    reference: formatDuration(reference)
  })}${declared > 0 ? ` ${t('ui.duration.declared', { declared: formatMinutes(declared) })}` : ''}`

  return (
    <div className="playtime" title={summary}>
      <span className="playtime-head">
        <span className="playtime-side">
          <span className="playtime-label">⏳ {t('ui.playtime.average')}</span>
          <span className="playtime-reference">{formatDuration(reference)}</span>
        </span>
        <span className="playtime-side playtime-side-end">
          <span className="playtime-label">⏱ {t('ui.playtime.mine')}</span>
          <span className="playtime-played">{formatMinutes(played)}</span>
        </span>
      </span>
      <span
        className="playtime-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={summary}
      >
        <span className="playtime-fill" style={{ width: `${percent}%` }} />
      </span>
    </div>
  )
}

/** "Retro" chip for vintage platforms. */
export function RetroChip({ platform }: { platform: string }) {
  const { t } = useI18n()
  if (!isRetroPlatform(platform)) return null
  return (
    <span className="badge badge-retro" title={t('ui.retro.title')}>
      👾 {t('ui.retro.label')}
    </span>
  )
}

/** HowLongToBeat duration bars with the time already played. */
export function DurationBars({ game }: { game: Partial<DurationFields> }) {
  const { t } = useI18n()
  const rows = [
    { label: t('ui.duration.main'), value: game.durationMain },
    { label: t('ui.duration.mainExtra'), value: game.durationMainExtra },
    { label: t('ui.duration.completionist'), value: game.durationCompletionist },
    { label: t('ui.duration.allStyles'), value: game.durationAllStyles }
  ].filter((row): row is { label: string; value: number } => typeof row.value === 'number' && row.value > 0)

  if (rows.length === 0) {
    return <p className="muted small">{t('ui.duration.empty')}</p>
  }

  const played = playedMinutes(game)
  const declared = manualMinutes(game)
  const reference = referenceMinutes(game)
  const max = Math.max(...rows.map((row) => row.value), played)
  const ratio = completionRatio(game)

  return (
    <div className="duration-bars">
      {rows.map((row) => (
        <div key={row.label} className="duration-row">
          <span className="duration-label">{row.label}</span>
          <span className="duration-track">
            <span className="duration-fill" style={{ width: `${(row.value / max) * 100}%` }} />
            {played > 0 ? (
              <span
                className="duration-played"
                style={{ width: `${(Math.min(played, row.value) / max) * 100}%` }}
                title={t('ui.duration.playedTitle', { duration: formatMinutes(played) })}
              />
            ) : null}
          </span>
          <span className="duration-value">{formatDuration(row.value)}</span>
        </div>
      ))}
      {reference && played > 0 ? (
        <p className="muted small">
          {t('ui.duration.playedOf', { played: formatMinutes(played), reference: formatDuration(reference) })}
          {declared > 0 ? ` ${t('ui.duration.declared', { declared: formatMinutes(declared) })}` : ''}
          {ratio !== undefined ? ` · ${Math.round(ratio * 100)}%` : ''} · {t('ui.duration.missing')}{' '}
          <strong>{formatDuration(remainingMinutes(game))}</strong>
        </p>
      ) : null}
    </div>
  )
}

/** Summary of how to play a vintage title today. */
export function EmulatorHint({ platform }: { platform: string }) {
  const { t } = useI18n()
  const hint = emulatorHint(platform)
  if (!isRetroPlatform(platform)) return null
  return (
    <p className="muted small">
      👾 {t('ui.emulator.retro')}
      {hint ? (
        <>
          {' '}
          · {t('ui.emulator.recommended')} <strong>{hint}</strong>
        </>
      ) : null}
    </p>
  )
}
