import { app, BrowserWindow, shell } from 'electron'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SmokeReport } from '@shared/types'
import { registerIpcHandlers } from './ipc'
import { loadWindowState, trackWindowState, type WindowState } from './windowState'

const isSmoke = process.argv.includes('--smoke')
const SMOKE_TIMEOUT_MS = 120_000

/** Screenshot mode: `--shoot=/path/to/file.png --shoot-view=library`. */
const shootArgument = process.argv.find((argument) => argument.startsWith('--shoot='))
const shootPath = shootArgument ? shootArgument.slice('--shoot='.length) : null
const shootViewArgument = process.argv.find((argument) => argument.startsWith('--shoot-view='))
const shootView = shootViewArgument ? shootViewArgument.slice('--shoot-view='.length) : 'library'
/** Text of the button to press before the shot (useful for previews). */
const shootClickArgument = process.argv.find((argument) => argument.startsWith('--shoot-click='))
const shootClick = shootClickArgument ? shootClickArgument.slice('--shoot-click='.length) : null
/** Delay after the click, to let animations and loading finish. */
const shootDelayArgument = process.argv.find((argument) => argument.startsWith('--shoot-delay='))
const shootDelay = shootDelayArgument ? Number(shootDelayArgument.slice('--shoot-delay='.length)) : 1800

let mainWindow: BrowserWindow | null = null
let smokeFinished = false

/**
 * Clicks a control by its text (button, chip or select option):
 * used by previews to show interactive states without clicking by hand.
 */
async function clickByText(window: BrowserWindow, text: string): Promise<boolean> {
  const script = `(() => {
    const needle = ${JSON.stringify(text.toLowerCase())};
    const button = [...document.querySelectorAll('button')].find((entry) =>
      (entry.textContent || '').toLowerCase().includes(needle)
    );
    if (button) {
      button.click();
      return true;
    }
    const select = [...document.querySelectorAll('select')].find((entry) =>
      [...entry.options].some((option) => (option.textContent || '').toLowerCase().includes(needle))
    );
    if (select) {
      const option = [...select.options].find((entry) =>
        (entry.textContent || '').toLowerCase().includes(needle)
      );
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    // No control found: scroll the given section into view (for previews further down).
    const target = [...document.querySelectorAll('h1, h2, h3, .section-title, .field-label')].find((entry) =>
      (entry.textContent || '').toLowerCase().includes(needle)
    );
    if (target) {
      target.scrollIntoView({ block: 'start' });
      return true;
    }
    return false;
  })()`
  return Boolean(await window.webContents.executeJavaScript(script))
}

async function captureAndExit(window: BrowserWindow): Promise<void> {
  try {
    if (shootClick) {
      // Multiple actions in sequence: --shoot-click="useful links|Preview"
      for (const action of shootClick.split('|').map((entry) => entry.trim()).filter(Boolean)) {
        const done = await clickByText(window, action)
        console.log(`SHOOT_CLICK ${done ? 'ok' : 'non trovato'}: ${action}`)
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(shootDelay) ? shootDelay : 1800))
    }
    const image = await window.webContents.capturePage()
    await writeFile(shootPath!, image.toPNG())
    console.log(`SHOOT_SAVED ${shootPath}`)
  } catch (error) {
    console.error('[shoot] cattura fallita:', error)
    app.exit(1)
    return
  }
  app.exit(0)
}

function finishSmoke(report: SmokeReport): void {
  if (smokeFinished) return
  smokeFinished = true
  console.log(`SMOKE_REPORT ${JSON.stringify(report)}`)
  // Give stdout time to flush before exiting.
  setTimeout(() => app.exit(report.ok ? 0 : 1), 150)
}

function createWindow(): BrowserWindow {
  const state: WindowState =
    isSmoke || shootPath ? { width: 1440, height: 940, maximized: false } : loadWindowState()

  const window = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: 'Backlog Wars',
    backgroundColor: '#0b0f1a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: [
        ...(isSmoke ? ['--backlog-smoke'] : []),
        ...(shootPath ? [`--backlog-shoot-view=${shootView}`] : [])
      ]
    }
  })

  if (state.maximized && !isSmoke && !shootPath) window.maximize()

  window.once('ready-to-show', () => {
    if (isSmoke) return
    window.show()
    if (shootPath) setTimeout(() => void captureAndExit(window), 2200)
  })

  // External links must never open Electron windows.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  window.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`[main] caricamento fallito (${code} ${description}) su ${url}`)
    if (isSmoke) finishSmoke({ ok: false, steps: [], error: `did-fail-load ${code} ${description}` })
  })

  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('[main] renderer terminato:', details.reason)
    if (isSmoke) finishSmoke({ ok: false, steps: [], error: `render-process-gone: ${details.reason}` })
  })

  if (isSmoke) {
    window.webContents.on('console-message', (event) => {
      if (event.level === 'error') console.error(`[renderer:error] ${event.message}`)
    })
  }

  window.on('closed', () => {
    mainWindow = null
  })

  trackWindowState(window)

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    void window.loadURL(devServerUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  void app.whenReady().then(() => {
    registerIpcHandlers({ isSmoke, onSmokeReport: finishSmoke })

    if (isSmoke) {
      setTimeout(() => {
        finishSmoke({ ok: false, steps: [], error: `timeout: il renderer non ha segnalato il self-test entro ${SMOKE_TIMEOUT_MS} ms` })
      }, SMOKE_TIMEOUT_MS)
    }

    mainWindow = createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' || isSmoke || shootPath) app.quit()
  })
}
