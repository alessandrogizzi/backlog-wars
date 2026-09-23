import { useState } from 'react'
import { GAME_STATUSES, GENRE_OPTIONS, PLATFORM_OPTIONS, effortKey, metacriticTone, pleasureKey, toneKey } from '@shared/catalog'
import type { GameStatus } from '@shared/catalog'
import type {
  DurationCandidate,
  GameMetadata,
  GogdbInfo,
  MetacriticCandidate,
  MetadataSourceStatus,
  ProviderChoice
} from '@shared/types'
import {
  completionRatio,
  formatDuration,
  playedMinutes,
  remainingMinutes,
  suggestEffortFromMinutes
} from '../logic/duration'
import { addLink, addNote, createGame, updateGame, updateLink } from '../db/repo'
import { emptyDraft, normalizeUrl, type GameDraft } from '../db/types'
import { errorMessage, useI18n, type TranslateParams } from '../i18n'
import { useSettings } from '../state/settings'
import { useToast } from '../state/toast'
import type { GameFormRequest } from '../state/app'
import { Cover, DurationBars, Field, Modal, RatingDots, RetroChip, Segmented } from './ui'

type Translate = (key: string, params?: TranslateParams) => string

const PROVIDER_OPTIONS: Array<{ value: ProviderChoice; labelKey: string }> = [
  { value: 'auto', labelKey: 'form.provider.auto' },
  { value: 'steam', labelKey: 'form.provider.steam' },
  { value: 'gog', labelKey: 'form.provider.gog' },
  { value: 'hltb', labelKey: 'form.provider.hltb' },
  { value: 'rawg', labelKey: 'form.provider.rawg' }
]

const PROVIDER_BADGE: Record<string, string> = {
  steam: 'Steam',
  gog: 'GOG',
  hltb: 'HowLongToBeat',
  rawg: 'RAWG'
}

function toDraft(game: GameFormRequest['game'], prefill?: Partial<GameDraft>): GameDraft {
  if (!game) return emptyDraft(prefill)
  const { id, addedAt, updatedAt, totalMinutes, sessionCount, avgSatisfaction, avgEffort, lastPlayedAt, completedAt, ...rest } = game
  void id
  void addedAt
  void updatedAt
  void totalMinutes
  void sessionCount
  void avgSatisfaction
  void avgEffort
  void lastPlayedAt
  void completedAt
  return { ...rest, ...prefill }
}

const minutesToHours = (minutes?: number): string =>
  typeof minutes === 'number' && minutes > 0 ? String(Math.round((minutes / 60) * 10) / 10) : ''

/** Summary line "X% of the main story · Y remaining". */
function referenceDuration(t: Translate, game: GameDraft): string {
  const ratio = completionRatio(game)
  const missing = remainingMinutes(game)
  if (ratio === undefined || missing === undefined) return ''
  return t('form.progress.reference', {
    percent: Math.round(ratio * 100),
    missing: formatDuration(missing)
  })
}

const hoursToMinutes = (hours: string): number | undefined => {
  const value = Number(hours.replace(',', '.'))
  if (!Number.isFinite(value) || value <= 0) return undefined
  return Math.round(value * 60)
}

export function GameFormModal({ request, onClose }: { request: GameFormRequest; onClose: () => void }) {
  const editing = request.game ?? null
  const { settings } = useSettings()
  const { notify } = useToast()
  const { t, formatDateTime } = useI18n()

  const [draft, setDraft] = useState<GameDraft>(() => toDraft(editing, request.prefill))
  const [provider, setProvider] = useState<ProviderChoice>(settings.defaultProvider)
  const [query, setQuery] = useState(editing ? '' : draft.title)
  const [results, setResults] = useState<GameMetadata[]>([])
  const [sources, setSources] = useState<MetadataSourceStatus[]>([])
  const [warning, setWarning] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tagsText, setTagsText] = useState(draft.tags.join(', '))
  const [durationBusy, setDurationBusy] = useState(false)
  const [durationNote, setDurationNote] = useState<string | null>(null)
  const [durationCandidates, setDurationCandidates] = useState<DurationCandidate[]>([])
  const [gogdb, setGogdb] = useState<GogdbInfo | null>(null)
  const [firstNote, setFirstNote] = useState('')
  const [firstLink, setFirstLink] = useState('')
  const [metacriticBusy, setMetacriticBusy] = useState(false)
  const [metacriticNote, setMetacriticNote] = useState<string | null>(null)
  const [metacriticCandidates, setMetacriticCandidates] = useState<MetacriticCandidate[]>([])

  const patch = (changes: Partial<GameDraft>): void => setDraft((current) => ({ ...current, ...changes }))
  const patchWith = (updater: (current: GameDraft) => Partial<GameDraft>): void =>
    setDraft((current) => ({ ...current, ...updater(current) }))

  const applyDurations = (metadata: GameMetadata, silent = false): boolean => {
    const durations = metadata.durations
    if (!durations) return false
    patch({
      hltbId: durations.hltbId,
      durationMain: durations.main,
      durationMainExtra: durations.mainExtra,
      durationCompletionist: durations.completionist,
      durationAllStyles: durations.allStyles,
      durationUpdatedAt: Date.now()
    })
    if (!silent) notify(t('form.durations.imported', { title: metadata.title }), 'ok')
    return true
  }

  /** Looks up durations on HowLongToBeat starting from the title. */
  const lookupDurations = async (title: string, year?: number, silent = false): Promise<void> => {
    if (title.trim().length < 2) return
    setDurationBusy(true)
    setDurationNote(null)
    try {
      const response = await window.backlog.getDurations({ title: title.trim(), year })
      if (!response.ok) {
        if (!silent) notify(errorMessage(t, response), 'error')
        return
      }
      const { best, alternatives } = response.data
      if (best) {
        applyDurations(best.metadata)
        setDurationCandidates(alternatives)
        setDurationNote(
          t('form.durations.match', {
            title: best.metadata.title,
            percent: Math.round(best.score * 100)
          }) + (best.metadata.releaseYear ? ` · ${best.metadata.releaseYear}` : '')
        )
        if (!silent)
          notify(
            t('form.durations.found', {
              duration: formatDuration(best.metadata.durations?.main ?? best.metadata.durations?.allStyles)
            }),
            'ok'
          )
      } else {
        setDurationCandidates(alternatives)
        setDurationNote(t('form.durations.none'))
      }
    } finally {
      setDurationBusy(false)
    }
  }

  const applyMetacritic = (candidate: MetacriticCandidate, silent = false): void => {
    patch({
      metacritic: candidate.score ?? draft.metacritic,
      metacriticUrl: candidate.url,
      metacriticReviewCount: candidate.reviewCount,
      metacriticSentiment: candidate.sentiment,
      mustPlay: candidate.mustPlay ? 1 : 0,
      metacriticSource: 'metacritic',
      metacriticUpdatedAt: Date.now()
    })
    if (!silent) notify(t('form.metacritic.applied', { score: candidate.score ?? '—', title: candidate.title }), 'ok')
  }

  /** Automatic Metascore lookup (Metacritic has no official API: we use its JSON backend). */
  const lookupMetacritic = async (
    title: string,
    year?: number,
    platform?: string,
    silent = false
  ): Promise<void> => {
    if (title.trim().length < 2) return
    setMetacriticBusy(true)
    setMetacriticNote(null)
    try {
      const response = await window.backlog.getMetacritic({
        title: title.trim(),
        year,
        platform,
        apiKey: settings.metacriticApiKey
      })
      if (!response.ok) {
        if (!silent) notify(errorMessage(t, response), 'error')
        return
      }
      const { best, alternatives } = response.data
      if (best) {
        applyMetacritic(best.candidate)
        setMetacriticCandidates(alternatives)
        setMetacriticNote(
          t('form.metacritic.match', {
            title: best.candidate.title,
            year: best.candidate.year ?? '—',
            percent: Math.round(best.score * 100)
          })
        )
        if (!silent) notify(t('form.metacritic.found', { score: best.candidate.score ?? '—' }), 'ok')
      } else {
        setMetacriticCandidates(alternatives)
        setMetacriticNote(t('form.metacritic.none'))
      }
    } finally {
      setMetacriticBusy(false)
    }
  }

  /** GOG details come from GOGDB, which publishes its data as JSON under /data. */
  const loadGogdb = async (productId: string, silent = false): Promise<void> => {
    const response = await window.backlog.getGogdbInfo({ productId })
    if (!response.ok) {
      if (!silent) notify(errorMessage(t, response), 'error')
      return
    }
    const info = response.data
    if (!info) return
    setGogdb(info)
    patchWith((current) => ({
      description: current.description || info.description,
      coverUrl: current.coverUrl || info.boxartUrl,
      developer: current.developer || info.developers[0],
      publisher: current.publisher || info.publishers[0],
      releaseYear: current.releaseYear ?? info.releaseYear,
      usesDosbox: info.usesDosbox ? 1 : current.usesDosbox
    }))
    if (!silent) {
      notify(t('form.gogdb.loaded', { count: info.buildCount, last: info.lastBuildAt ?? '—' }), 'info')
    }
  }

  const runSearch = async (): Promise<void> => {
    if (query.trim().length < 2) {
      notify(t('form.search.tooShort'), 'info')
      return
    }
    setSearching(true)
    setWarning(null)
    try {
      const response = await window.backlog.searchMetadata({
        query: query.trim(),
        provider,
        rawgApiKey: settings.rawgApiKey,
        steamCountry: settings.steamCountry,
        gogCountry: settings.gogCountry,
        gogCurrency: settings.gogCurrency,
        limit: 12
      })
      if (!response.ok) {
        notify(errorMessage(t, response), 'error')
        setResults([])
        setSources([])
        return
      }
      setResults(response.data.results)
      setSources(response.data.sources)
      setWarning(response.data.warning ?? null)
      if (response.data.results.length === 0) notify(t('form.search.empty'), 'info')
    } finally {
      setSearching(false)
    }
  }

  const applyMetadata = (metadata: GameMetadata): void => {
    patchWith((current) => ({
      title: metadata.title || current.title,
      coverUrl: metadata.coverUrl ?? current.coverUrl,
      description: metadata.description ?? metadata.shortDescription ?? current.description,
      genres: metadata.genres.length > 0 ? metadata.genres : current.genres,
      releaseYear: metadata.releaseYear ?? current.releaseYear,
      metacritic: metadata.metacritic ?? current.metacritic,
      developer: metadata.developers[0] ?? current.developer,
      publisher: metadata.publishers[0] ?? current.publisher,
      externalUrl: metadata.externalUrl ?? current.externalUrl,
      platform: metadata.platforms[0] ?? current.platform,
      provider: metadata.provider,
      providerId: metadata.providerId,
      usesDosbox: metadata.usesDosbox ? 1 : current.usesDosbox,
      hltbId: metadata.durations?.hltbId ?? current.hltbId,
      durationMain: metadata.durations?.main ?? current.durationMain,
      durationMainExtra: metadata.durations?.mainExtra ?? current.durationMainExtra,
      durationCompletionist: metadata.durations?.completionist ?? current.durationCompletionist,
      durationAllStyles: metadata.durations?.allStyles ?? current.durationAllStyles,
      durationUpdatedAt: metadata.durations ? Date.now() : current.durationUpdatedAt
    }))
    const label = PROVIDER_BADGE[metadata.provider] ?? metadata.provider
    notify(t('form.metadata.imported', { provider: label }), 'ok')

    // Missing durations: look them up on HowLongToBeat (if enabled in settings).
    if (!metadata.durations && settings.hltbAutoEnrich) {
      void lookupDurations(metadata.title, metadata.releaseYear, true)
    }
    // For GOG games, fetch the full details from GOGDB (description, boxart, builds).
    if (metadata.provider === 'gog' && /^\d+$/.test(metadata.providerId)) {
      void loadGogdb(metadata.providerId, true)
    }
    // Metacritic: fills in the score with the page, review count and Must Play badge.
    if (settings.metacriticAutoEnrich) {
      void lookupMetacritic(metadata.title, metadata.releaseYear, metadata.platforms[0], true)
    }
  }

  const save = async (): Promise<void> => {
    if (!draft.title.trim()) {
      notify(t('form.error.titleRequired'), 'error')
      return
    }
    setSaving(true)
    try {
      const tags = tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
      const payload: GameDraft = { ...draft, title: draft.title.trim(), tags }
      if (editing?.id) {
        await updateGame(editing.id, payload)
        notify(t('form.saved.updated'), 'ok')
      } else {
        const newId = await createGame(payload)
        if (firstNote.trim()) await addNote(newId, firstNote)
        const linkUrl = normalizeUrl(firstLink)
        if (linkUrl) {
          const linkId = await addLink(newId, linkUrl)
          // The preview comes from the page: fetch it without blocking the save.
          void window.backlog.getLinkPreview({ url: linkUrl }).then((result) => {
            if (!result.ok || !result.data) return
            void updateLink(linkId, {
              title: result.data.title,
              description: result.data.description,
              imageUrl: result.data.imageUrl,
              faviconUrl: result.data.faviconUrl,
              host: result.data.host,
              previewFetchedAt: Date.now()
            })
          })
        }
        notify(t('form.saved.added', { title: payload.title }), 'ok')
      }
      onClose()
    } catch (error) {
      notify(errorMessage(t, error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const suggestedEffort = suggestEffortFromMinutes(draft.durationMain ?? draft.durationAllStyles)
  const hasDurations = Boolean(draft.durationMain || draft.durationAllStyles || draft.durationCompletionist)

  return (
    <Modal
      title={editing ? t('form.title.edit') : t('form.title.add')}
      subtitle={editing ? editing.title : t('form.subtitle')}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn primary" onClick={() => void save()} disabled={saving}>
            {saving ? t('common.saving') : editing ? t('common.saveChanges') : t('form.addToBacklog')}
          </button>
        </>
      }
    >
      <section className="form-section">
        <h3 className="section-title">🔎 {t('form.section.search')}</h3>
        <div className="search-row">
          <input
            className="input"
            placeholder={t('form.search.placeholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void runSearch()
            }}
          />
          <select
            className="select"
            value={provider}
            onChange={(event) => setProvider(event.target.value as ProviderChoice)}
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={() => void runSearch()} disabled={searching}>
            {searching ? t('common.searching') : t('common.search')}
          </button>
        </div>

        {sources.length > 0 ? (
          <div className="source-chips">
            {sources.map((source) => (
              <span
                key={source.provider}
                className={`badge badge-source ${source.provider}`}
                title={source.error ?? t('form.search.results', { count: source.count })}
              >
                {PROVIDER_BADGE[source.provider] ?? source.provider}: {source.error ? t('form.search.error') : source.count}
              </span>
            ))}
          </div>
        ) : null}
        {warning ? <p className="notice">{warning}</p> : null}
        {!settings.rawgApiKey && provider !== 'steam' && provider !== 'gog' ? (
          <p className="muted small">{t('form.rawgTip')}</p>
        ) : null}

        {results.length > 0 ? (
          <div className="search-results">
            {results.map((metadata) => (
              <button
                key={`${metadata.provider}-${metadata.providerId}`}
                type="button"
                className="search-result"
                onClick={() => applyMetadata(metadata)}
              >
                <Cover game={{ title: metadata.title, coverUrl: metadata.coverUrl }} size="sm" />
                <span className="search-result-body">
                  <strong>{metadata.title}</strong>
                  <span className="muted small">
                    {[
                      metadata.releaseYear,
                      metadata.platforms.slice(0, 4).join(', '),
                      metadata.genres.slice(0, 2).join(', '),
                      metadata.metacritic ? `Meta ${metadata.metacritic}` : null
                    ]
                      .filter(Boolean)
                      .join(' · ') || t('form.search.noDetails')}
                  </span>
                </span>
                {metadata.durations?.main ? (
                  <span className="search-result-hours">⏳ {formatDuration(metadata.durations.main)}</span>
                ) : null}
                {metadata.platforms.some((platform) => platform === 'Super Nintendo' || platform === 'DOS') ? (
                  <span className="badge badge-retro">👾</span>
                ) : null}
                <span className={`badge badge-source ${metadata.provider}`}>
                  {PROVIDER_BADGE[metadata.provider] ?? metadata.provider}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="form-section">
        <h3 className="section-title">⏳ {t('form.section.duration')}</h3>
        <div className="duration-panel">
          <div>
            <DurationBars game={draft} />
            {durationNote ? <p className="muted small">{durationNote}</p> : null}
            {durationCandidates.length > 0 ? (
              <ul className="suggestion-list">
                {durationCandidates.map((candidate) => (
                  <li key={`${candidate.metadata.providerId}-${candidate.metadata.title}`} className="suggestion-row">
                    <span>
                      <strong>{candidate.metadata.title}</strong>{' '}
                      <span className="muted small">
                        {candidate.metadata.releaseYear ?? '—'} ·{' '}
                        {formatDuration(candidate.metadata.durations?.main ?? candidate.metadata.durations?.allStyles)} ·{' '}
                        {t('form.durations.matchShort', { percent: Math.round(candidate.score * 100) })}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => {
                        applyDurations(candidate.metadata, true)
                        setDurationNote(t('form.durations.taken', { title: candidate.metadata.title }))
                        setDurationCandidates([])
                      }}
                    >
                      {t('form.durations.use')}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="duration-actions">
            <button
              type="button"
              className="btn"
              disabled={durationBusy || draft.title.trim().length < 2}
              onClick={() => void lookupDurations(draft.title, draft.releaseYear, false)}
            >
              {durationBusy ? t('common.searching') : `🔍 ${t('form.durations.lookup')}`}
            </button>
            {suggestedEffort && suggestedEffort !== draft.effortEstimate ? (
              <button type="button" className="btn ghost" onClick={() => patch({ effortEstimate: suggestedEffort })}>
                {t('form.durations.suggestedEffort', { value: suggestedEffort })}
              </button>
            ) : null}
            {draft.hltbId ? (
              <span className="muted small">
                {t('form.durations.source', { id: draft.hltbId })}
                {draft.durationUpdatedAt
                  ? t('form.durations.updated', { date: formatDateTime(draft.durationUpdatedAt) })
                  : ''}
              </span>
            ) : null}
          </div>
        </div>

        <div className="form-grid">
          <Field label={t('form.duration.main')}>
            <input
              className="input"
              type="number"
              min={0}
              step={0.5}
              value={minutesToHours(draft.durationMain)}
              onChange={(event) => patch({ durationMain: hoursToMinutes(event.target.value) })}
            />
          </Field>
          <Field label={t('form.duration.mainExtra')}>
            <input
              className="input"
              type="number"
              min={0}
              step={0.5}
              value={minutesToHours(draft.durationMainExtra)}
              onChange={(event) => patch({ durationMainExtra: hoursToMinutes(event.target.value) })}
            />
          </Field>
          <Field label={t('form.duration.completionist')}>
            <input
              className="input"
              type="number"
              min={0}
              step={0.5}
              value={minutesToHours(draft.durationCompletionist)}
              onChange={(event) => patch({ durationCompletionist: hoursToMinutes(event.target.value) })}
            />
          </Field>
          <Field label={t('form.duration.allStyles')}>
            <input
              className="input"
              type="number"
              min={0}
              step={0.5}
              value={minutesToHours(draft.durationAllStyles)}
              onChange={(event) => patch({ durationAllStyles: hoursToMinutes(event.target.value) })}
            />
          </Field>
        </div>
        {!hasDurations ? <p className="muted small">{t('form.duration.why')}</p> : null}
      </section>

      <section className="form-section">
        <h3 className="section-title">▶️ {t('form.section.progress')}</h3>
        <div className="form-grid">
          <Field label={t('form.progress.state.label')} hint={t('form.progress.state.hint')}>
            <Segmented
              options={[
                { value: 'nuovo', label: t('form.progress.notStarted') },
                { value: 'iniziato', label: t('form.progress.started') }
              ]}
              value={draft.startedAt ? 'iniziato' : 'nuovo'}
              onChange={(value) =>
                patch(
                  value === 'iniziato'
                    ? {
                        startedAt: draft.startedAt ?? Date.now(),
                        status:
                          draft.status === 'backlog' || draft.status === 'wishlist' ? 'playing' : draft.status
                      }
                    : { startedAt: undefined }
                )
              }
            />
          </Field>

          <Field
            label={t('form.progress.playedBefore.label')}
            hint={t('form.progress.playedBefore.hint')}
          >
            <input
              className="input"
              type="number"
              min={0}
              step={0.5}
              value={minutesToHours(draft.playedBeforeMinutes)}
              onChange={(event) => {
                const minutes = hoursToMinutes(event.target.value)
                patch({
                  playedBeforeMinutes: minutes,
                  startedAt: draft.startedAt ?? (minutes ? Date.now() : undefined)
                })
              }}
            />
          </Field>
        </div>
        <p className="muted small">
          {t('form.progress.playedSoFar')} <strong>{formatDuration(playedMinutes(draft))}</strong>
          {draft.playedBeforeMinutes
            ? ` ${t('form.progress.declared', { duration: formatDuration(draft.playedBeforeMinutes) })}`
            : ''}
          {referenceDuration(t, draft)}
        </p>
      </section>

      <section className="form-section">
        <h3 className="section-title">🏅 {t('form.section.metacritic')}</h3>
        <div className="duration-panel">
          <div>
            <div className="metacritic-row">
              <span className={`metascore metascore-${metacriticTone(draft.metacritic)}`}>
                {draft.metacritic ?? '—'}
              </span>
              <span className="muted small">
                {t(toneKey(draft.metacritic))}
                {draft.metacriticReviewCount
                  ? t('form.metacritic.reviews', { count: draft.metacriticReviewCount })
                  : ''}
                {draft.metacriticSentiment ? ` · ${draft.metacriticSentiment}` : ''}
              </span>
              {draft.mustPlay === 1 ? <span className="badge badge-mustplay">★ Must Play</span> : null}
            </div>
            {metacriticNote ? <p className="muted small">{metacriticNote}</p> : null}
            {metacriticCandidates.length > 0 ? (
              <ul className="suggestion-list">
                {metacriticCandidates.map((candidate) => (
                  <li key={candidate.id} className="suggestion-row">
                    <span>
                      <span className={`metascore metascore-${metacriticTone(candidate.score)} small`}>
                        {candidate.score ?? '—'}
                      </span>{' '}
                      <strong>{candidate.title}</strong>{' '}
                      <span className="muted small">
                        {candidate.year ?? '—'} ·{' '}
                        {candidate.platforms.slice(0, 3).join(', ') || t('form.metacritic.platforms')}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => {
                        applyMetacritic(candidate, true)
                        setMetacriticCandidates([])
                        setMetacriticNote(t('form.metacritic.taken', { title: candidate.title }))
                      }}
                    >
                      {t('form.metacritic.use')}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="duration-actions">
            <button
              type="button"
              className="btn"
              disabled={metacriticBusy || draft.title.trim().length < 2}
              onClick={() => void lookupMetacritic(draft.title, draft.releaseYear, draft.platform, false)}
            >
              {metacriticBusy ? t('common.searching') : `🔍 ${t('form.metacritic.lookup')}`}
            </button>
            {draft.metacriticUrl ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  void window.backlog.openExternal(draft.metacriticUrl as string).then((result) => {
                    if (!result.ok) notify(errorMessage(t, result), 'error')
                  })
                }
              >
                {t('form.metacritic.open')}
              </button>
            ) : null}
            {draft.metacriticSource ? (
              <span className="muted small">{t('form.metacritic.source', { source: draft.metacriticSource })}</span>
            ) : null}
          </div>
        </div>
      </section>

      {gogdb ? (
        <section className="form-section">
          <h3 className="section-title">🗄️ GOGDB · {t('form.section.gogdb')}</h3>
          <div className="gogdb-panel">
            <div className="gogdb-meta">
              <span className="badge badge-neutral">{gogdb.title}</span>
              <span>{t('form.gogdb.builds', { count: gogdb.buildCount })}</span>
              {gogdb.lastBuildAt ? <span>{t('form.gogdb.last', { date: gogdb.lastBuildAt })}</span> : null}
              {gogdb.buildSystems.length > 0 ? <span>{gogdb.buildSystems.join(', ')}</span> : null}
              {gogdb.usesDosbox ? <span className="badge dosbox-flag">DOSBox</span> : null}
              {gogdb.series ? <span>{t('form.gogdb.series', { name: gogdb.series })}</span> : null}
            </div>
            {gogdb.tags.length > 0 ? (
              <div className="tag-row">
                {gogdb.tags.slice(0, 8).map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="form-section">
        <h3 className="section-title">📋 {t('form.section.data')}</h3>
        <div className="form-grid">
          <Field label={t('form.data.title')} wide>
            <input
              className="input"
              value={draft.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder={t('form.data.titlePlaceholder')}
            />
          </Field>

          <Field label={t('label.status')}>
            <select
              className="select"
              value={draft.status}
              onChange={(event) => patch({ status: event.target.value as GameStatus })}
            >
              {GAME_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {t(status.labelKey)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('label.platform')} hint={t('form.data.platformHint')}>
            <select className="select" value={draft.platform} onChange={(event) => patch({ platform: event.target.value })}>
              {[...new Set([draft.platform, ...PLATFORM_OPTIONS])].filter(Boolean).map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('form.data.releaseYear')}>
            <input
              className="input"
              type="number"
              value={draft.releaseYear ?? ''}
              onChange={(event) => patch({ releaseYear: event.target.value ? Number(event.target.value) : undefined })}
            />
          </Field>

          <Field label={t('form.data.metascore')}>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              value={draft.metacritic ?? ''}
              onChange={(event) =>
                patch({
                  metacritic: event.target.value ? Number(event.target.value) : undefined,
                  metacriticSource: event.target.value ? 'manual' : undefined
                })
              }
            />
          </Field>

          <Field label={t('form.data.developer')}>
            <input
              className="input"
              value={draft.developer ?? ''}
              onChange={(event) => patch({ developer: event.target.value })}
            />
          </Field>

          <Field label={t('form.data.publisher')}>
            <input
              className="input"
              value={draft.publisher ?? ''}
              onChange={(event) => patch({ publisher: event.target.value })}
            />
          </Field>

          <Field label={t('form.data.coverUrl')} wide>
            <input
              className="input"
              value={draft.coverUrl ?? ''}
              onChange={(event) => patch({ coverUrl: event.target.value })}
              placeholder="https://…"
            />
          </Field>

          <Field label={t('form.data.externalUrl')} wide>
            <input
              className="input"
              value={draft.externalUrl ?? ''}
              onChange={(event) => patch({ externalUrl: event.target.value })}
              placeholder={t('form.data.externalUrlPlaceholder')}
            />
          </Field>
        </div>

        <Field label={t('label.genres')} wide>
          <div className="chip-group">
            {GENRE_OPTIONS.map((genre) => {
              const active = draft.genres.includes(genre)
              return (
                <button
                  key={genre}
                  type="button"
                  className={`chip${active ? ' active' : ''}`}
                  onClick={() =>
                    patch({
                      genres: active ? draft.genres.filter((entry) => entry !== genre) : [...draft.genres, genre]
                    })
                  }
                >
                  {genre}
                </button>
              )
            })}
          </div>
        </Field>

        <div className="form-grid">
          <Field label={t('form.data.tags')} hint={t('form.data.tagsHint')} wide>
            <input className="input" value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
          </Field>
        </div>

        <div className="rating-grid">
          <div className="rating-block">
            <span className="field-label">{t('form.rating.effort')}</span>
            <RatingDots value={draft.effortEstimate} tone="effort" onChange={(value) => patch({ effortEstimate: value })} />
            <span className="muted small">{t(effortKey(draft.effortEstimate))}</span>
          </div>
          <div className="rating-block">
            <span className="field-label">{t('form.rating.pleasure')}</span>
            <RatingDots value={draft.pleasure} tone="pleasure" onChange={(value) => patch({ pleasure: value })} />
            <span className="muted small">{t(pleasureKey(draft.pleasure))}</span>
          </div>
          <div className="rating-block">
            <span className="field-label">{t('label.priority')}</span>
            <RatingDots value={draft.priority} tone="priority" onChange={(value) => patch({ priority: value })} />
            <span className="muted small">{t('form.rating.priorityHint')}</span>
          </div>
          <div className="rating-block">
            <span className="field-label">{t('form.rating.favorite')}</span>
            <Segmented
              options={[
                { value: 'no', label: t('common.no') },
                { value: 'si', label: `★ ${t('common.yes')}` }
              ]}
              value={draft.favorite === 1 ? 'si' : 'no'}
              onChange={(value) => patch({ favorite: value === 'si' ? 1 : 0 })}
            />
            <span className="muted small">
              {draft.usesDosbox === 1 ? t('form.rating.dosbox') : t('form.rating.favoriteHint')}
            </span>
          </div>
        </div>

        <div className="form-grid">
          <Field label={t('form.data.description')} wide>
            <textarea
              className="textarea"
              rows={4}
              value={draft.description ?? ''}
              onChange={(event) => patch({ description: event.target.value })}
            />
          </Field>
          {editing ? (
            <Field label={t('form.notes.label')} wide hint={t('form.notes.hint')}>
              <p className="muted small">{t('form.notes.body')}</p>
            </Field>
          ) : (
            <>
              <Field label={t('form.firstNote.label')} wide hint={t('form.firstNote.hint')}>
                <textarea
                  className="textarea"
                  rows={2}
                  value={firstNote}
                  onChange={(event) => setFirstNote(event.target.value)}
                  placeholder={t('form.firstNote.placeholder')}
                />
              </Field>
              <Field label={t('form.firstLink.label')} wide hint={t('form.firstLink.hint')}>
                <input
                  className="input"
                  value={firstLink}
                  onChange={(event) => setFirstLink(event.target.value)}
                  placeholder="https://…"
                />
              </Field>
            </>
          )}
        </div>

        {draft.platform ? (
          <p className="muted small">
            {t('form.data.selectedPlatform', { platform: draft.platform })} <RetroChip platform={draft.platform} />
          </p>
        ) : null}
      </section>
    </Modal>
  )
}
