import { app, screen, type BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  maximized: boolean
}

const DEFAULT_STATE: WindowState = { width: 1380, height: 900, maximized: false }

function stateFile(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

export function loadWindowState(): WindowState {
  try {
    const raw = JSON.parse(readFileSync(stateFile(), 'utf8')) as Partial<WindowState>
    const state: WindowState = {
      width: Math.max(1024, Number(raw.width) || DEFAULT_STATE.width),
      height: Math.max(680, Number(raw.height) || DEFAULT_STATE.height),
      maximized: Boolean(raw.maximized)
    }
    if (typeof raw.x === 'number' && typeof raw.y === 'number') {
      // Check that the window lands on a display that is still connected.
      const visible = screen.getAllDisplays().some((display) => {
        const area = display.workArea
        return (
          raw.x! + 80 > area.x &&
          raw.y! + 40 > area.y &&
          raw.x! < area.x + area.width - 40 &&
          raw.y! < area.y + area.height - 40
        )
      })
      if (visible) {
        state.x = raw.x
        state.y = raw.y
      }
    }
    return state
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function trackWindowState(window: BrowserWindow): void {
  const save = (): void => {
    try {
      const bounds = window.getNormalBounds()
      const state: WindowState = {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        maximized: window.isMaximized()
      }
      writeFileSync(stateFile(), JSON.stringify(state, null, 2), 'utf8')
    } catch {
      /* window state is not critical */
    }
  }
  window.on('close', save)
}
