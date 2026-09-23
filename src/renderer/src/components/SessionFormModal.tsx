import { useState } from 'react'
import { GAME_STATUSES } from '@shared/catalog'
import type { GameStatus } from '@shared/catalog'
import { todayIso } from '@shared/format'
import { logSession, markPickAccepted, updateGame, updateSession } from '../db/repo'
import { errorMessage, useI18n } from '../i18n'
import { useGames } from '../state/data'
import { useToast } from '../state/toast'
import type { SessionFormRequest } from '../state/app'
import { Field, MinutesInput, Modal, RatingDots } from './ui'

export function SessionFormModal({ request, onClose }: { request: SessionFormRequest; onClose: () => void }) {
  const games = useGames()
  const { notify } = useToast()
  const { t } = useI18n()
  const editing = request.session ?? null

  const [gameId, setGameId] = useState<number | null>(editing?.gameId ?? request.game?.id ?? null)
  const [date, setDate] = useState(editing?.date ?? todayIso())
  const [minutes, setMinutes] = useState(editing?.minutes ?? 60)
  const [effort, setEffort] = useState(editing?.effort ?? request.game?.effortEstimate ?? 3)
  const [satisfaction, setSatisfaction] = useState(editing?.satisfaction ?? request.game?.pleasure ?? 4)
  const [progress, setProgress] = useState(editing?.progress ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [statusAfter, setStatusAfter] = useState<GameStatus | ''>(request.statusAfter ?? '')
  const [saving, setSaving] = useState(false)

  const selected = games?.find((game) => game.id === gameId) ?? null

  const save = async (): Promise<void> => {
    if (!gameId) {
      notify(t('log.form.chooseGame'), 'error')
      return
    }
    setSaving(true)
    try {
      if (editing?.id) {
        await updateSession(editing.id, {
          date,
          minutes,
          effort,
          satisfaction,
          progress: progress.trim() || undefined,
          notes: notes.trim() || undefined
        })
        if (statusAfter) await updateGame(editing.gameId, { status: statusAfter })
        notify(t('log.updated'), 'ok')
      } else {
        await logSession({
          gameId,
          date,
          minutes,
          effort,
          satisfaction,
          progress: progress.trim() || undefined,
          notes: notes.trim() || undefined,
          statusAfter: statusAfter || undefined
        })
        if (request.pickId !== undefined) await markPickAccepted(request.pickId)
        notify(t('log.created'), 'ok')
      }
      onClose()
    } catch (error) {
      notify(errorMessage(t, error), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={editing ? t('log.form.editTitle') : t('log.form.newTitle')}
      subtitle={selected ? selected.title : t('log.form.subtitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn primary" onClick={() => void save()} disabled={saving}>
            {saving ? t('common.saving') : editing ? t('log.form.saveEdit') : t('log.form.saveNew')}
          </button>
        </>
      }
    >
      {games && games.length === 0 ? (
        <p className="notice">{t('log.form.noGames')}</p>
      ) : (
        <>
          <div className="form-grid">
            <Field label={`${t('log.table.game')} *`}>
              <select
                className="select"
                value={gameId ?? ''}
                disabled={Boolean(editing)}
                onChange={(event) => setGameId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">{t('log.form.choose')}</option>
                {(games ?? []).map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                    {game.platform ? ` · ${game.platform}` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t('log.table.date')}>
              <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
          </div>

          <Field label={t('log.form.playedTime')} wide>
            <MinutesInput minutes={minutes} onChange={setMinutes} />
          </Field>

          <div className="rating-grid">
            <div className="rating-block">
              <span className="field-label">{t('log.form.effort')}</span>
              <RatingDots value={effort} tone="effort" onChange={setEffort} />
              <span className="muted small">{t('log.form.effortHint')}</span>
            </div>
            <div className="rating-block">
              <span className="field-label">{t('log.table.satisfaction')}</span>
              <RatingDots value={satisfaction} tone="satisfaction" onChange={setSatisfaction} />
              <span className="muted small">{t('log.form.satisfactionHint')}</span>
            </div>
          </div>

          <div className="form-grid">
            <Field label={t('log.form.progress')} wide hint={t('log.form.progressHint')}>
              <input className="input" value={progress} onChange={(event) => setProgress(event.target.value)} />
            </Field>
            <Field label={t('log.table.notes')} wide>
              <textarea className="textarea" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <Field label={t('log.form.statusAfter')} hint={t('log.form.statusAfterHint')}>
              <select
                className="select"
                value={statusAfter}
                onChange={(event) => setStatusAfter(event.target.value as GameStatus | '')}
              >
                <option value="">{t('log.form.statusUnchanged')}</option>
                {GAME_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {t(status.labelKey)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </>
      )}
    </Modal>
  )
}
