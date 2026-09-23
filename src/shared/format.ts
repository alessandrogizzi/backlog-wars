/** Shared formatting helpers (main + renderer + tests). Pure functions. */

export function formatMinutes(minutes: number | null | undefined): string {
  const total = Math.max(0, Math.round(minutes ?? 0))
  if (total < 60) return `${total}m`
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

export function formatHours(minutes: number | null | undefined): string {
  const total = Math.max(0, minutes ?? 0)
  return (total / 60).toFixed(total >= 600 ? 0 : 1).replace('.', ',')
}

export function todayIso(now: Date | number = new Date()): string {
  const date = typeof now === 'number' ? new Date(now) : now
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

/** Locale used when the caller does not specify one (the app defaults to English). */
export const DEFAULT_LOCALE = 'en-GB'

/** ISO date (YYYY-MM-DD) formatted according to the app language. */
export function formatDate(iso?: string | null, locale: string = DEFAULT_LOCALE): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  if (!y || !m || !d) return iso
  return new Date(`${y}-${m}-${d}T12:00:00`).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/** Date and time (timestamp) formatted according to the app language. */
export function formatDateTime(ts?: number | null, locale: string = DEFAULT_LOCALE): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00`)
  const to = Date.parse(`${toIso}T00:00:00`)
  if (Number.isNaN(from) || Number.isNaN(to)) return 0
  return Math.round((to - from) / 86_400_000)
}

/** Normalises ISO or textual dates ("9 Jul, 2013", "1999.06.01") to YYYY-MM-DD (local date). */
export function isoDateFromAny(value?: string | number | null): string | undefined {
  if (!value) return undefined
  const text = String(value).trim()
  // Plain date or ISO timestamp: the leading part is already the date declared by the source.
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const dotted = /^(\d{4})\.(\d{2})\.(\d{2})/.exec(text)
  if (dotted) return `${dotted[1]}-${dotted[2]}-${dotted[3]}`
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return undefined
  const offset = parsed.getTimezoneOffset() * 60_000
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 10)
}

/** Number with the decimal separator of the active language. */
export function formatDecimal(value: number, locale: string = DEFAULT_LOCALE, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function stripHtml(html?: string | null): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
