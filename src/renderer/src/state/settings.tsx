import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, type AppSettings } from '@shared/types'
import { readSettings, writeSettings } from '../db/db'

interface SettingsContextValue {
  settings: AppSettings
  ready: boolean
  save: (patch: Partial<AppSettings>) => Promise<void>
  replace: (settings: AppSettings) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void readSettings()
      .then((stored) => {
        if (active) setSettings(stored)
      })
      .catch((error: unknown) => {
        console.error('Could not read settings:', error)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const save = useCallback(async (patch: Partial<AppSettings>) => {
    const current = await readSettings()
    const next: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...current,
      ...patch,
      weights: { ...DEFAULT_SETTINGS.weights, ...current.weights, ...(patch.weights ?? {}) }
    }
    await writeSettings(next)
    setSettings(next)
  }, [])

  const replace = useCallback(async (incoming: AppSettings) => {
    const merged: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...incoming,
      weights: { ...DEFAULT_SETTINGS.weights, ...(incoming.weights ?? {}) }
    }
    await writeSettings(merged)
    setSettings(merged)
  }, [])

  const value = useMemo(() => ({ settings, ready, save, replace }), [settings, ready, save, replace])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}

export function useReloadSettings(): () => Promise<void> {
  const { replace } = useSettings()
  return useCallback(async () => {
    replace(await readSettings())
  }, [replace])
}
