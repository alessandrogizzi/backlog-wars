import { useEffect, useState } from 'react'
import { ModalHost } from './components/ModalHost'
import { LANGUAGES, useI18n } from './i18n'
import { NAV_ITEMS, useApp } from './state/app'
import { useGames } from './state/data'
import { useSettings } from './state/settings'
import { GameDetailView } from './views/GameDetailView'
import { LibraryView } from './views/LibraryView'
import { PickerView } from './views/PickerView'
import { SessionsView } from './views/SessionsView'
import { SettingsView } from './views/SettingsView'
import { StatsView } from './views/StatsView'
import { TournamentView } from './views/TournamentView'

export default function App() {
  const { view, go, openGameForm } = useApp()
  const { t, language, setLanguage } = useI18n()
  const games = useGames()
  const { settings, save } = useSettings()
  const collapsed = settings.sidebarCollapsed
  const toggleSidebar = () => void save({ sidebarCollapsed: !collapsed })
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    let active = true
    void window.backlog
      .getAppInfo()
      .then((result) => {
        if (active && result.ok) setVersion(result.data.version)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const activeNav = view.name === 'detail' ? 'library' : view.name

  const renderView = () => {
    switch (view.name) {
      case 'library':
        return <LibraryView />
      case 'detail':
        return <GameDetailView gameId={view.gameId} />
      case 'picker':
        return <PickerView />
      case 'tournament':
        return <TournamentView />
      case 'sessions':
        return <SessionsView />
      case 'stats':
        return <StatsView />
      case 'settings':
        return <SettingsView />
      default:
        return <LibraryView />
    }
  }

  return (
    <div className={`app-shell${collapsed ? ' is-collapsed' : ''}`} data-testid="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">⚔️</span>
          <div className="brand-text">
            <span className="brand-title">BACKLOG WARS</span>
            <span className="brand-sub">{t('app.tagline')}</span>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            aria-label={t(collapsed ? 'app.sidebar.expand' : 'app.sidebar.collapse')}
            title={t(collapsed ? 'app.sidebar.expand' : 'app.sidebar.collapse')}
            data-testid="sidebar-toggle"
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid="nav-item"
              className={`nav-item${activeNav === item.id ? ' active' : ''}`}
              onClick={() => go({ name: item.id })}
              aria-label={t(item.labelKey)}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">
                <span className="nav-label">{t(item.labelKey)}</span>
                <span className="nav-hint">{t(item.hintKey)}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="btn primary block sidebar-add"
            onClick={() => openGameForm()}
            aria-label={t('app.addGame')}
            title={collapsed ? t('app.addGame') : undefined}
          >
            <span className="sidebar-add-icon" aria-hidden="true">
              ＋
            </span>
            <span className="sidebar-add-label">{t('app.addGame')}</span>
          </button>

          <div className="language-switch" title={t('app.language')}>
            {LANGUAGES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`chip${language === entry.id ? ' active' : ''}`}
                onClick={() => void setLanguage(entry.id)}
                aria-label={t(entry.labelKey)}
                data-testid={`language-${entry.id}`}
              >
                {entry.flag} <span className="lang-code">{entry.id.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <span className="muted small sidebar-meta">
            v{version} · {t('app.gamesInLibrary', { count: games?.length ?? 0 })}
          </span>
        </div>
      </aside>

      <main className="main">
        <div className="content">{renderView()}</div>
      </main>

      <ModalHost />
    </div>
  )
}
