import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { GameStatus } from '@shared/catalog'
import type { Game, GameDraft, PlaySession } from '../db/types'

/** Main navigation entries (the game detail page opens from the library). */
export type NavViewName = 'library' | 'picker' | 'tournament' | 'sessions' | 'stats' | 'settings'

export type View = { name: NavViewName } | { name: 'detail'; gameId: number }

export interface GameFormRequest {
  game?: Game | null
  prefill?: Partial<GameDraft>
}

export interface SessionFormRequest {
  game?: Game | null
  statusAfter?: GameStatus
  /** If the session comes from a draw, the id of the pick to confirm. */
  pickId?: number
  /** If present, the session is edited instead of created. */
  session?: PlaySession | null
}

export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

interface PendingConfirm extends ConfirmRequest {
  resolve: (accepted: boolean) => void
}

interface AppContextValue {
  view: View
  go: (view: View) => void
  gameForm: GameFormRequest | null
  sessionForm: SessionFormRequest | null
  confirmRequest: PendingConfirm | null
  openGameForm: (request?: GameFormRequest) => void
  closeGameForm: () => void
  openSessionForm: (request?: SessionFormRequest) => void
  closeSessionForm: () => void
  confirm: (request: ConfirmRequest) => Promise<boolean>
  answerConfirm: (accepted: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const SHOOTABLE_VIEWS: NavViewName[] = ['library', 'picker', 'tournament', 'sessions', 'stats', 'settings']

function initialViewFromApi(): View {
  const requested = window.backlog?.shootView
  if (requested && (SHOOTABLE_VIEWS as string[]).includes(requested)) {
    return { name: requested as NavViewName }
  }
  return { name: 'library' }
}

export function AppProvider({
  children,
  initialView,
  initialModal
}: {
  children: ReactNode
  initialView?: View
  initialModal?: 'game' | 'session'
}) {
  const [view, setView] = useState<View>(() => initialView ?? initialViewFromApi())
  const [gameForm, setGameForm] = useState<GameFormRequest | null>(null)
  const [sessionForm, setSessionForm] = useState<SessionFormRequest | null>(null)
  const [confirmRequest, setConfirmRequest] = useState<PendingConfirm | null>(null)

  useEffect(() => {
    if (initialModal === 'game') setGameForm({})
    if (initialModal === 'session') setSessionForm({})
  }, [initialModal])

  const go = useCallback((next: View) => setView(next), [])
  const openGameForm = useCallback((request: GameFormRequest = {}) => setGameForm(request), [])
  const closeGameForm = useCallback(() => setGameForm(null), [])
  const openSessionForm = useCallback((request: SessionFormRequest = {}) => setSessionForm(request), [])
  const closeSessionForm = useCallback(() => setSessionForm(null), [])

  const confirm = useCallback(
    (request: ConfirmRequest) =>
      new Promise<boolean>((resolve) => {
        setConfirmRequest({ ...request, resolve })
      }),
    []
  )

  const answerConfirm = useCallback(
    (accepted: boolean) => {
      setConfirmRequest((current) => {
        current?.resolve(accepted)
        return null
      })
    },
    []
  )

  const value = useMemo<AppContextValue>(
    () => ({
      view,
      go,
      gameForm,
      sessionForm,
      confirmRequest,
      openGameForm,
      closeGameForm,
      openSessionForm,
      closeSessionForm,
      confirm,
      answerConfirm
    }),
    [view, go, gameForm, sessionForm, confirmRequest, openGameForm, closeGameForm, openSessionForm, closeSessionForm, confirm, answerConfirm]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}

export interface NavItem {
  id: NavViewName
  labelKey: string
  icon: string
  hintKey: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'library', labelKey: 'nav.library', icon: '🎮', hintKey: 'nav.library.hint' },
  { id: 'picker', labelKey: 'nav.picker', icon: '🎲', hintKey: 'nav.picker.hint' },
  { id: 'tournament', labelKey: 'nav.tournament', icon: '🏆', hintKey: 'nav.tournament.hint' },
  { id: 'sessions', labelKey: 'nav.sessions', icon: '⏱️', hintKey: 'nav.sessions.hint' },
  { id: 'stats', labelKey: 'nav.stats', icon: '📊', hintKey: 'nav.stats.hint' },
  { id: 'settings', labelKey: 'nav.settings', icon: '⚙️', hintKey: 'nav.settings.hint' }
]
