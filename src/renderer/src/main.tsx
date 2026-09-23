import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { db } from './db/db'
import { seedDemoData } from './db/seed'
import { runSelfTest } from './logic/smoke'
import { I18nProvider } from './i18n'
import { AppProvider, type View } from './state/app'
import { SettingsProvider } from './state/settings'
import { ToastProvider } from './state/toast'
import './styles.css'

/** Rendering errors recorded for the self-test in --smoke mode. */
let mountError: string | null = null

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    mountError = `${error.message} (${info.componentStack?.split('\n')[1]?.trim() ?? 'unknown component'})`
    console.error('Errore di rendering:', error)
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="loading">
          Something went wrong while rendering. Restart the app: your data is safe in the local database.
        </div>
      )
    }
    return this.props.children
  }
}

const container = document.getElementById('root')

if (!container) {
  throw new Error('#root element not found in index.html')
}

const root = createRoot(container)

function renderApp(initialView?: View, initialModal?: 'game' | 'session'): void {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <SettingsProvider>
          <I18nProvider>
            <ToastProvider>
              <AppProvider initialView={initialView} initialModal={initialModal}>
                <App />
              </AppProvider>
            </ToastProvider>
          </I18nProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}

async function bootstrap(): Promise<void> {
  // In screenshot mode the database is temporary: we populate it to see the app full.
  const shoot = window.backlog?.shootView
  if (!shoot) {
    renderApp()
    return
  }

  let initialView: View | undefined
  let initialModal: 'game' | 'session' | undefined
  try {
    await seedDemoData()
    if (
      shoot === 'detail' ||
      shoot === 'detail-gog' ||
      shoot === 'detail-metacritic' ||
      shoot === 'detail-played'
    ) {
      // For the previews I pick a representative game: retro with sessions,
      // a GOG game for the GOGDB panel, or one with a Metascore for the Metacritic card.
      const wanted =
        shoot === 'detail-gog'
          ? 'Heroes of Might and Magic III'
          : shoot === 'detail-metacritic'
            ? 'Disco Elysium'
            : shoot === 'detail-played'
              ? 'Elden Ring'
              : 'Chrono Trigger'
      const preferred = await db.games.where('title').equals(wanted).first()
      const fallback = await db.games.orderBy('title').first()
      const chosen = preferred ?? fallback
      if (chosen?.id) initialView = { name: 'detail', gameId: chosen.id }
    }
    if (shoot === 'add-game') initialModal = 'game'
    if (shoot === 'session-form') initialModal = 'session'
  } catch (error) {
    console.error('Demo data could not be loaded:', error)
  }
  renderApp(initialView, initialModal)
}

void bootstrap()

/* ----------------------- Self-test end-to-end (--smoke) ------------------ */
if (window.backlog?.isSmoke) {
  void (async () => {
    const report = await runSelfTest(window.backlog)
    report.steps.unshift({
      name: 'react.mount',
      ok: mountError === null,
      detail: mountError ?? 'no rendering errors'
    })

    // Give React a moment to paint the shell before checking the DOM.
    await new Promise((resolve) => setTimeout(resolve, 500))
    const shell = document.querySelector('[data-testid="app-shell"]')
    const navItems = document.querySelectorAll('[data-testid="nav-item"]').length
    report.steps.push({
      name: 'dom.shell',
      ok: Boolean(shell) && navItems > 0,
      detail: shell ? `${navItems} navigation items` : 'shell not rendered'
    })
    report.ok = report.steps.filter((step) => !step.optional).every((step) => step.ok)
    await window.backlog.reportSmoke(report)
  })()
}
