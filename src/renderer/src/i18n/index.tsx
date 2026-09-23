import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { DEFAULT_LOCALE, formatDate, formatDateTime, formatDecimal } from '@shared/format'
import { useSettings } from '../state/settings'
import enCore from './messages/en/core'
import enDetail from './messages/en/detail'
import enForm from './messages/en/form'
import enLibrary from './messages/en/library'
import enLinks from './messages/en/links'
import enLog from './messages/en/log'
import enNotes from './messages/en/notes'
import enPlay from './messages/en/play'
import enSettings from './messages/en/settings'
import enStats from './messages/en/stats'
import enUi from './messages/en/ui'
import itCore from './messages/it/core'
import itDetail from './messages/it/detail'
import itForm from './messages/it/form'
import itLibrary from './messages/it/library'
import itLinks from './messages/it/links'
import itLog from './messages/it/log'
import itNotes from './messages/it/notes'
import itPlay from './messages/it/play'
import itSettings from './messages/it/settings'
import itStats from './messages/it/stats'
import itUi from './messages/it/ui'

/**
 * Lightweight i18n: flat key/value dictionaries split by area, so each area can
 * be edited independently. English is the source of truth and the default
 * language; the typecheck fails if a key is missing from the Italian mirror.
 */
export type Language = 'en' | 'it'

export const LANGUAGES: Array<{ id: Language; labelKey: string; flag: string }> = [
  { id: 'en', labelKey: 'app.language.en', flag: '🇬🇧' },
  { id: 'it', labelKey: 'app.language.it', flag: '🇮🇹' }
]

export const DEFAULT_LANGUAGE: Language = 'en'

/** Composed English dictionary: defines every valid translation key. */
export const en = {
  ...enCore,
  ...enLibrary,
  ...enDetail,
  ...enPlay,
  ...enLog,
  ...enStats,
  ...enSettings,
  ...enForm,
  ...enNotes,
  ...enLinks,
  ...enUi
}

export type TranslationKey = keyof typeof en

/** Italian dictionary: annotated so a missing key is a compile error. */
export const it: Record<TranslationKey, string> = {
  ...itCore,
  ...itLibrary,
  ...itDetail,
  ...itPlay,
  ...itLog,
  ...itStats,
  ...itSettings,
  ...itForm,
  ...itNotes,
  ...itLinks,
  ...itUi
}

export const dictionaries: Record<Language, Record<string, string>> = { en, it }

export type TranslateParams = Record<string, string | number | undefined | null>

/** Replaces `{name}` placeholders with the passed values. */
export function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined || value === null ? match : String(value)
  })
}

/**
 * Translates a key. If it is missing in the requested language it falls back to
 * English and, as a last resort, returns the key itself (useful in development).
 */
export function translate(language: Language, key: string, params?: TranslateParams): string {
  const template = dictionaries[language]?.[key] ?? en[key as TranslationKey] ?? key
  return interpolate(template, params)
}

/**
 * Localized error message built from an error or a failed Result.
 * Uses the code when present (see ErrorCode in shared/types) and falls back to
 * the English message coming from the main process or the data layer.
 */
export function errorMessage(t: (key: string, params?: TranslateParams) => string, failure: unknown): string {
  const translateCode = (code?: string, details?: TranslateParams, fallback?: string): string | undefined => {
    if (!code) return undefined
    const key = `error.${code}`
    const template = dictionaries.en[key]
    if (!template) return undefined
    // If the message has placeholders but we have no details, the original text is better.
    if (/\{\w+\}/.test(template) && !details) return undefined
    return t(key, details)
  }

  if (failure instanceof Error) {
    const coded = failure as Error & { code?: string; details?: TranslateParams }
    return translateCode(coded.code, coded.details) ?? failure.message
  }
  if (failure && typeof failure === 'object') {
    const coded = failure as { error?: string; code?: string; details?: TranslateParams }
    return (
      translateCode(coded.code, coded.details, coded.error) ??
      coded.error ??
      t('error.unknown', { message: '' })
    )
  }
  return t('error.unknown', { message: String(failure ?? '') })
}

export function localeOf(language: Language): string {
  return language === 'it' ? 'it-IT' : DEFAULT_LOCALE
}

export interface I18n {
  language: Language
  locale: string
  setLanguage: (language: Language) => Promise<void>
  t: (key: string, params?: TranslateParams) => string
  formatDate: (iso?: string | null) => string
  formatDateTime: (ts?: number | null) => string
  formatDecimal: (value: number, digits?: number) => string
}

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { settings, save } = useSettings()
  const language = (settings.language ?? DEFAULT_LANGUAGE) as Language

  const setLanguage = useCallback(
    async (next: Language) => {
      await save({ language: next })
    },
    [save]
  )

  const value = useMemo<I18n>(() => {
    const locale = localeOf(language)
    return {
      language,
      locale,
      setLanguage,
      t: (key, params) => translate(language, key, params),
      formatDate: (iso) => formatDate(iso, locale),
      formatDateTime: (ts) => formatDateTime(ts, locale),
      formatDecimal: (value, digits) => formatDecimal(value, locale, digits)
    }
  }, [language, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
