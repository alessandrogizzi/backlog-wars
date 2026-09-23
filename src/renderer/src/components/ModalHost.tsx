import { useI18n } from '../i18n'
import { useApp } from '../state/app'
import { GameFormModal } from './GameFormModal'
import { SessionFormModal } from './SessionFormModal'
import { Modal } from './ui'

export function ModalHost() {
  const { t } = useI18n()
  const { gameForm, sessionForm, confirmRequest, closeGameForm, closeSessionForm, answerConfirm } = useApp()

  return (
    <>
      {gameForm ? <GameFormModal request={gameForm} onClose={closeGameForm} /> : null}
      {sessionForm ? <SessionFormModal request={sessionForm} onClose={closeSessionForm} /> : null}
      {confirmRequest ? (
        <Modal
          title={confirmRequest.title}
          size="sm"
          onClose={() => answerConfirm(false)}
          footer={
            <>
              <button type="button" className="btn ghost" onClick={() => answerConfirm(false)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className={`btn ${confirmRequest.danger ? 'danger-solid' : 'primary'}`}
                onClick={() => answerConfirm(true)}
              >
                {confirmRequest.confirmLabel ?? t('common.confirm')}
              </button>
            </>
          }
        >
          <p className="confirm-message">{confirmRequest.message}</p>
        </Modal>
      ) : null}
    </>
  )
}
