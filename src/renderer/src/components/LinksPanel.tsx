import { useState } from 'react'
import { addLink, deleteLink, updateLink } from '../db/repo'
import { LINK_LABELS, isLinkEdited, linkHost, normalizeUrl, type GameLink } from '../db/types'
import { errorMessage, useI18n, type TranslateParams } from '../i18n'
import { useApp } from '../state/app'
import { useLinksForGame } from '../state/data'
import { useToast } from '../state/toast'
import { EmptyState } from './ui'

/**
 * The LINK_LABELS presets are values stored in the database: here the i18n key
 * is only used to display them in the active language.
 */
const LINK_LABEL_KEYS: Record<string, string> = {
  Guida: 'links.label.guide',
  Wiki: 'links.label.wiki',
  Video: 'links.label.video',
  Trucchi: 'links.label.cheats',
  Mod: 'links.label.mod',
  Forum: 'links.label.forum',
  Store: 'links.label.store'
}

/**
 * Le etichette predefinite sono salvate nella forma canonica (la chiave di
 * LINK_LABELS): a schermo si mostrano nella lingua attiva, come già fa la lista.
 */
function labelText(value: string, t: (key: string, params?: TranslateParams) => string): string {
  return LINK_LABEL_KEYS[value] ? t(LINK_LABEL_KEYS[value]) : value
}

/** Preview thumbnail, falling back to the favicon and then to the generic icon. */
function LinkThumb({ link }: { link: GameLink }) {
  const [stage, setStage] = useState<'image' | 'favicon' | 'none'>(link.imageUrl ? 'image' : link.faviconUrl ? 'favicon' : 'none')

  if (stage === 'image' && link.imageUrl) {
    return (
      <img
        className="link-thumb"
        src={link.imageUrl}
        alt=""
        loading="lazy"
        onError={() => setStage(link.faviconUrl ? 'favicon' : 'none')}
      />
    )
  }
  if (stage === 'favicon' && link.faviconUrl) {
    return (
      <span className="link-thumb link-thumb-icon">
        <img src={link.faviconUrl} alt="" loading="lazy" onError={() => setStage('none')} />
      </span>
    )
  }
  return <span className="link-thumb link-thumb-icon">🔗</span>
}

/**
 * A game's useful links: guide, wiki, video, mod…
 * Each link has a page preview (title, description, image) and the
 * creation and last-edit timestamps.
 */
export function LinksPanel({ gameId }: { gameId: number }) {
  const links = useLinksForGame(gameId)
  const { confirm } = useApp()
  const { t, formatDateTime } = useI18n()
  const { notify } = useToast()

  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [previewingId, setPreviewingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editLabel, setEditLabel] = useState('')

  const refreshPreview = async (id: number, target: string, silent = false): Promise<void> => {
    setPreviewingId(id)
    try {
      const response = await window.backlog.getLinkPreview({ url: target })
      if (!response.ok) {
        if (!silent) notify(errorMessage(t, response), 'error')
        return
      }
      const preview = response.data
      if (!preview) {
        if (!silent) notify(t('links.preview.none'), 'info')
        return
      }
      await updateLink(id, {
        title: preview.title,
        description: preview.description,
        imageUrl: preview.imageUrl,
        faviconUrl: preview.faviconUrl,
        host: preview.host,
        previewFetchedAt: Date.now()
      })
      if (!silent) notify(t('links.preview.updated'), 'ok')
    } finally {
      setPreviewingId(null)
    }
  }

  const add = async (): Promise<void> => {
    const clean = normalizeUrl(url)
    if (!clean) {
      notify(t('links.invalidUrl'), 'error')
      return
    }
    setBusy(true)
    try {
      const id = await addLink(gameId, clean, label)
      setUrl('')
      setLabel('')
      notify(t('links.added'), 'ok')
      void refreshPreview(id, clean, true)
    } catch (error) {
      notify(errorMessage(t, error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (link: GameLink): void => {
    setEditingId(link.id ?? null)
    setEditTitle(link.title ?? '')
    setEditLabel(link.label ?? '')
  }

  const saveEdit = async (link: GameLink): Promise<void> => {
    if (link.id === undefined) return
    await updateLink(link.id, { title: editTitle.trim() || undefined, label: editLabel.trim() || undefined })
    setEditingId(null)
    notify(t('links.updated'), 'ok')
  }

  const remove = async (link: GameLink): Promise<void> => {
    if (link.id === undefined) return
    const accepted = await confirm({
      title: t('links.delete.title'),
      message: t('links.delete.message', { name: link.title ?? link.url }),
      confirmLabel: t('common.delete'),
      danger: true
    })
    if (!accepted) return
    await deleteLink(link.id)
    notify(t('links.deleted'), 'ok')
  }

  const open = (link: GameLink): void => {
    void window.backlog.openExternal(link.url).then((result) => {
      if (!result.ok) notify(errorMessage(t, result), 'error')
    })
  }

  const list = links ?? []

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">🔗 {t('links.title', { count: list.length })}</h2>
        <span className="muted small">{t('links.hint')}</span>
      </div>

      <div className="link-composer">
        <input
          className="input"
          placeholder={t('links.url.placeholder')}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void add()
          }}
        />
        <input
          className="input"
          placeholder={t('links.label.placeholder')}
          value={labelText(label, t)}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void add()
          }}
        />
        <button type="button" className="btn primary" onClick={() => void add()} disabled={busy || !url.trim()}>
          {busy ? t('common.saving') : `+ ${t('links.add')}`}
        </button>
      </div>

      <div className="stack">
        <div className="chip-group">
          {LINK_LABELS.map((entry) => (
            <button
              key={entry}
              type="button"
              className={`chip${label === entry ? ' active' : ''}`}
              onClick={() => setLabel((current) => (current === entry ? '' : entry))}
            >
              {t(LINK_LABEL_KEYS[entry])}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon="🔗"
            title={t('links.empty.title')}
            message={t('links.empty.message')}
          />
        ) : (
          <ul className="link-list">
            {list.map((link) => (
              <li key={link.id} className="link-item">
                <LinkThumb link={link} />

                <div className="link-body">
                  {editingId === link.id ? (
                    <div className="link-edit">
                      <input
                        className="input"
                        value={editTitle}
                        placeholder={t('links.edit.title')}
                        onChange={(event) => setEditTitle(event.target.value)}
                      />
                      <input
                        className="input"
                        value={labelText(editLabel, t)}
                        placeholder={t('links.edit.label')}
                        onChange={(event) => setEditLabel(event.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="link-head">
                        {link.label ? (
                          <span className="badge badge-neutral">
                            {LINK_LABEL_KEYS[link.label] ? t(LINK_LABEL_KEYS[link.label]) : link.label}
                          </span>
                        ) : null}
                        <strong>{link.title ?? link.host ?? link.url}</strong>
                      </div>
                      {link.description ? <p className="link-description">{link.description}</p> : null}
                      <div className="link-meta">
                        <span className="link-host">{link.host ?? linkHost(link.url)}</span>
                        <span className="muted small">
                          {t('links.addedAt', { date: formatDateTime(link.createdAt) })}
                          {isLinkEdited(link) ? t('links.updatedAt', { date: formatDateTime(link.updatedAt) }) : ''}
                          {link.previewFetchedAt ? t('links.previewed') : ''}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="link-actions">
                  {editingId === link.id ? (
                    <>
                      <button type="button" className="btn small primary" onClick={() => void saveEdit(link)}>
                        {t('common.save')}
                      </button>
                      <button type="button" className="btn small ghost" onClick={() => setEditingId(null)}>
                        {t('common.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn small primary" onClick={() => open(link)}>
                        {t('common.open')}
                      </button>
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => link.id !== undefined && void refreshPreview(link.id, link.url)}
                        disabled={previewingId === link.id}
                        title={t('links.preview.title')}
                      >
                        {previewingId === link.id ? '…' : t('links.preview')}
                      </button>
                      <button type="button" className="btn small ghost" onClick={() => startEdit(link)}>
                        {t('common.edit')}
                      </button>
                      <button type="button" className="btn small ghost danger" onClick={() => void remove(link)}>
                        {t('common.delete')}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
