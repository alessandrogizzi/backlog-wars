import { useState } from 'react'
import { addNote, deleteNote, updateNote } from '../db/repo'
import { isNoteEdited, type GameNote } from '../db/types'
import { errorMessage, useI18n } from '../i18n'
import { useApp } from '../state/app'
import { useNotesForGame } from '../state/data'
import { useToast } from '../state/toast'
import { EmptyState } from './ui'

/**
 * List of a game's notes: adding, editing and deleting.
 * Each note shows its creation date and, if different, its last edit date.
 */
export function NotesPanel({ gameId }: { gameId: number }) {
  const notes = useNotesForGame(gameId)
  const { confirm } = useApp()
  const { t, formatDateTime } = useI18n()
  const { notify } = useToast()

  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const add = async (): Promise<void> => {
    if (!draft.trim()) {
      notify(t('notes.emptyDraft'), 'error')
      return
    }
    setSaving(true)
    try {
      await addNote(gameId, draft)
      setDraft('')
      notify(t('notes.added'), 'ok')
    } catch (error) {
      notify(errorMessage(t, error), 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (note: GameNote): void => {
    setEditingId(note.id ?? null)
    setEditText(note.text)
  }

  const saveEdit = async (note: GameNote): Promise<void> => {
    if (note.id === undefined) return
    if (!editText.trim()) {
      notify(t('notes.emptyEdit'), 'error')
      return
    }
    setBusyId(note.id)
    try {
      await updateNote(note.id, editText)
      setEditingId(null)
      notify(t('notes.updated'), 'ok')
    } catch (error) {
      notify(errorMessage(t, error), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (note: GameNote): Promise<void> => {
    if (note.id === undefined) return
    const accepted = await confirm({
      title: t('notes.delete.title'),
      message: t('notes.delete.message', {
        preview: `${note.text.slice(0, 90)}${note.text.length > 90 ? '…' : ''}`
      }),
      confirmLabel: t('common.delete'),
      danger: true
    })
    if (!accepted) return
    await deleteNote(note.id)
    if (editingId === note.id) setEditingId(null)
    notify(t('notes.deleted'), 'ok')
  }

  const list = notes ?? []

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">📝 {t('notes.title', { count: list.length })}</h2>
        <span className="muted small">{t('notes.hint')}</span>
      </div>

      <div className="note-composer">
        <textarea
          className="textarea"
          rows={2}
          value={draft}
          placeholder={t('notes.placeholder')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) void add()
          }}
        />
        <button type="button" className="btn primary" onClick={() => void add()} disabled={saving || !draft.trim()}>
          {saving ? t('common.saving') : `+ ${t('notes.add')}`}
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="📝"
          title={t('notes.empty.title')}
          message={t('notes.empty.message')}
        />
      ) : (
        <ul className="note-list">
          {list.map((note) => (
            <li key={note.id} className={`note-item${editingId === note.id ? ' editing' : ''}`}>
              {editingId === note.id ? (
                <>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={editText}
                    onChange={(event) => setEditText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) void saveEdit(note)
                      if (event.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <div className="note-footer">
                    <span className="muted small">
                      {t('notes.edit.created', { date: formatDateTime(note.createdAt) })}
                    </span>
                    <span className="note-actions">
                      <button
                        type="button"
                        className="btn small primary"
                        onClick={() => void saveEdit(note)}
                        disabled={busyId === note.id}
                      >
                        {busyId === note.id ? t('common.saving') : t('common.save')}
                      </button>
                      <button type="button" className="btn small ghost" onClick={() => setEditingId(null)}>
                        {t('common.cancel')}
                      </button>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="note-text">{note.text}</p>
                  <div className="note-footer">
                    <span className="note-timestamps">
                      <span title={t('notes.created.title')}>
                        🕒 {t('notes.created', { date: formatDateTime(note.createdAt) })}
                      </span>
                      {isNoteEdited(note) ? (
                        <span className="note-edited" title={t('notes.updatedAt.title')}>
                          ✏️ {t('notes.updatedAt', { date: formatDateTime(note.updatedAt) })}
                        </span>
                      ) : (
                        <span className="muted small">{t('notes.notEdited')}</span>
                      )}
                    </span>
                    <span className="note-actions">
                      <button type="button" className="btn small ghost" onClick={() => startEdit(note)}>
                        {t('common.edit')}
                      </button>
                      <button type="button" className="btn small ghost danger" onClick={() => void remove(note)}>
                        {t('common.delete')}
                      </button>
                    </span>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
