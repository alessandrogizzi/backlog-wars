import { useMemo, useState } from 'react'
import { GAME_STATUSES, PLATFORM_GROUPS, platformGroupOf, statusLabelKey } from '@shared/catalog'
import type { GameStatus, PlatformGroup } from '@shared/catalog'
import { seedDemoData } from '../db/seed'
import { deleteGame, toggleFavorite, updateGame } from '../db/repo'
import type { Game } from '../db/types'
import {
  LIBRARY_SORT_OPTIONS,
  filterAndSortGames,
  gamesMissingMetacritic,
  type LibraryFilters,
  type LibrarySortKey,
  type MetacriticFilter
} from '../logic/library'
import { useI18n } from '../i18n'
import { GameCard } from '../components/GameCard'
import { EmptyState, Loading } from '../components/ui'
import { formatDuration, referenceMinutes, remainingMinutes } from '../logic/duration'
import { observedPleasure } from '../logic/picker'
import { useApp } from '../state/app'
import { useGames, useLinkCounts } from '../state/data'
import { useSettings } from '../state/settings'
import { useToast } from '../state/toast'

export function LibraryView() {
  const games = useGames()
  const linkCounts = useLinkCounts()
  const { go, openGameForm, openSessionForm, confirm } = useApp()
  const { settings } = useSettings()
  const { notify } = useToast()
  const { t } = useI18n()

  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<GameStatus[]>([])
  const [platform, setPlatform] = useState('all')
  const [genre, setGenre] = useState('all')
  const [sort, setSort] = useState<LibrarySortKey>('updated')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [groups, setGroups] = useState<PlatformGroup[]>([])
  const [metacriticFilter, setMetacriticFilter] = useState<MetacriticFilter>('all')
  const [busy, setBusy] = useState(false)

  const platforms = useMemo(
    () => [...new Set((games ?? []).map((game) => game.platform).filter(Boolean))].sort(),
    [games]
  )
  const genres = useMemo(
    () => [...new Set((games ?? []).flatMap((game) => game.genres))].sort(),
    [games]
  )

  const filters: LibraryFilters = useMemo(
    () => ({ search, statuses, platform, genre, groups, onlyFavorites, metacritic: metacriticFilter, sort }),
    [search, statuses, platform, genre, groups, onlyFavorites, metacriticFilter, sort]
  )

  const filtered = useMemo(() => filterAndSortGames(games ?? [], filters), [games, filters])

  const missingMetacritic = useMemo(() => gamesMissingMetacritic(games ?? []), [games])

  const handleDelete = async (game: Game): Promise<void> => {
    const accepted = await confirm({
      title: t('library.delete.title'),
      message: t('library.delete.message', { title: game.title, count: game.sessionCount }),
      confirmLabel: t('common.delete'),
      danger: true
    })
    if (!accepted || !game.id) return
    await deleteGame(game.id)
    notify(t('library.deleted', { title: game.title }), 'ok')
  }

  /** Looks up missing scores on Metacritic, one game at a time. */
  const enrichMetacritic = async (): Promise<void> => {
    if (missingMetacritic.length === 0) {
      notify(t('library.metacritic.complete'), 'info')
      return
    }
    const accepted = await confirm({
      title: t('library.metacritic.confirmTitle'),
      message: t('library.metacritic.confirmMessage', { count: missingMetacritic.length }),
      confirmLabel: t('common.search')
    })
    if (!accepted) return

    setBusy(true)
    let updated = 0
    let skipped = 0
    try {
      for (const game of missingMetacritic) {
        const response = await window.backlog.getMetacritic({
          title: game.title,
          year: game.releaseYear,
          platform: game.platform,
          apiKey: settings.metacriticApiKey
        })
        const best = response.ok ? response.data.best : null
        if (!best || !best.candidate.score) {
          skipped += 1
          continue
        }
        await updateGame(game.id!, {
          metacritic: best.candidate.score,
          metacriticUrl: best.candidate.url,
          metacriticReviewCount: best.candidate.reviewCount,
          metacriticSentiment: best.candidate.sentiment,
          mustPlay: best.candidate.mustPlay ? 1 : 0,
          metacriticSource: 'metacritic',
          metacriticUpdatedAt: Date.now()
        })
        updated += 1
      }
      notify(
        skipped > 0
          ? t('library.metacritic.updatedSkipped', { updated, total: missingMetacritic.length, skipped })
          : t('library.metacritic.updated', { updated, total: missingMetacritic.length }),
        updated > 0 ? 'ok' : 'info'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleSeed = async (): Promise<void> => {
    setBusy(true)
    try {
      const created = await seedDemoData()
      notify(created > 0 ? t('library.seed.added', { count: created }) : t('library.seed.present'), 'ok')
    } finally {
      setBusy(false)
    }
  }

  if (!games) return <Loading label={t('library.loading')} />

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <h1>{t('nav.library')}</h1>
          <p className="view-sub">
            {t('library.stats.count', { shown: filtered.length, total: games.length })}
            {statuses.length > 0 ? ` · ${statuses.map((status) => t(statusLabelKey(status))).join(', ')}` : ''}
            {groups.includes('retro') ? ` · ${t('library.stats.retroOnly')}` : ''}
            {metacriticFilter === 'good' ? ` · ${t('library.metascoreGood')}` : ''}
            {metacriticFilter === 'missing' ? ` · ${t('library.stats.noMetascore')}` : ''}
          </p>
        </div>
        <div className="view-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => void enrichMetacritic()}
            disabled={busy || missingMetacritic.length === 0}
            title={
              missingMetacritic.length === 0
                ? t('library.metacritic.allHave')
                : t('library.metacritic.searchFor', { count: missingMetacritic.length })
            }
          >
            🏅 {t('library.actions.updateMetascores')}
            {missingMetacritic.length > 0 ? ` (${missingMetacritic.length})` : ''}
          </button>
          <button type="button" className="btn ghost" onClick={() => openSessionForm()}>
            ⏱ {t('library.actions.logSession')}
          </button>
          <button type="button" className="btn primary" onClick={() => openGameForm()}>
            {t('app.addGame')}
          </button>
        </div>
      </header>

      {games.length === 0 ? (
        <EmptyState
          icon="🕹️"
          title={t('library.empty.title')}
          message={t('library.empty.message')}
          action={
            <div className="empty-actions">
              <button type="button" className="btn primary" onClick={() => openGameForm()}>
                + {t('library.empty.addFirst')}
              </button>
              <button type="button" className="btn ghost" onClick={() => void handleSeed()} disabled={busy}>
                {busy ? t('common.loading') : t('library.empty.loadDemo')}
              </button>
            </div>
          }
        />
      ) : (
        <>
          <section className="filters card">
            <div className="filters-row">
              <input
                className="input"
                placeholder={t('library.filters.searchPlaceholder')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select className="select" value={platform} onChange={(event) => setPlatform(event.target.value)}>
                <option value="all">{t('library.filters.allPlatforms')}</option>
                {platforms.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
              <select className="select" value={genre} onChange={(event) => setGenre(event.target.value)}>
                <option value="all">{t('library.filters.allGenres')}</option>
                {genres.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
              <select className="select" value={sort} onChange={(event) => setSort(event.target.value as LibrarySortKey)}>
                {LIBRARY_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t('library.sort.label', { value: t(option.labelKey) })}
                  </option>
                ))}
              </select>
            </div>
            <div className="filters-row wrap">
              <div className="chip-group">
                {GAME_STATUSES.map((status) => {
                  const active = statuses.includes(status.id)
                  return (
                    <button
                      key={status.id}
                      type="button"
                      className={`chip${active ? ' active' : ''}`}
                      onClick={() =>
                        setStatuses(active ? statuses.filter((entry) => entry !== status.id) : [...statuses, status.id])
                      }
                    >
                      {t(status.labelKey)}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                className={`chip${onlyFavorites ? ' active' : ''}`}
                onClick={() => setOnlyFavorites((current) => !current)}
              >
                ★ {t('library.filters.favoritesOnly')}
              </button>
              <button
                type="button"
                className={`chip${metacriticFilter === 'good' ? ' active' : ''}`}
                onClick={() => setMetacriticFilter((current) => (current === 'good' ? 'all' : 'good'))}
                title={t('library.metascoreGoodHint')}
              >
                🏅 {t('library.metascoreGood')}
              </button>
              <button
                type="button"
                className={`chip${metacriticFilter === 'missing' ? ' active' : ''}`}
                onClick={() => setMetacriticFilter((current) => (current === 'missing' ? 'all' : 'missing'))}
                title={t('library.noMetascoreHint')}
              >
                ❓ {t('library.noMetascore')}
              </button>
              {PLATFORM_GROUPS.map((group) => {
                const active = groups.includes(group.id)
                return (
                  <button
                    key={group.id}
                    type="button"
                    className={`chip${active ? ' active' : ''}`}
                    onClick={() =>
                      setGroups(active ? groups.filter((entry) => entry !== group.id) : [...groups, group.id as PlatformGroup])
                    }
                  >
                    {group.icon} {t(group.labelKey)}
                  </button>
                )
              })}
              {search ||
              statuses.length > 0 ||
              platform !== 'all' ||
              genre !== 'all' ||
              groups.length > 0 ||
              onlyFavorites ||
              metacriticFilter !== 'all' ? (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    setSearch('')
                    setStatuses([])
                    setPlatform('all')
                    setGenre('all')
                    setGroups([])
                    setOnlyFavorites(false)
                    setMetacriticFilter('all')
                  }}
                >
                  {t('common.clearFilters')}
                </button>
              ) : null}
            </div>
          </section>

          {filtered.length === 0 ? (
            <EmptyState icon="🔍" title={t('library.noResults.title')} message={t('library.noResults.message')} />
          ) : (
            <div className="game-grid">
              {filtered.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  linkCount={linkCounts?.get(game.id!) ?? 0}
                  onOpen={(entry) => go({ name: 'detail', gameId: entry.id! })}
                  onPlay={(entry) => openSessionForm({ game: entry })}
                  onEdit={(entry) => openGameForm({ game: entry })}
                  onDelete={(entry) => void handleDelete(entry)}
                  onToggleFavorite={(entry) => void toggleFavorite(entry.id!)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
