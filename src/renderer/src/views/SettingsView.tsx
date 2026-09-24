import { useEffect, useState } from 'react'
import type { AppInfo, AppSettings, PickWeights, ProviderChoice } from '@shared/types'
import { todayIso } from '@shared/format'
import { clearAllData, exportBundle, importBundle } from '../db/repo'
import { seedDemoData } from '../db/seed'
import { Field, Loading, Slider } from '../components/ui'
import { LANGUAGES, errorMessage, useI18n } from '../i18n'
import { useApp } from '../state/app'
import { useSettings } from '../state/settings'
import { useToast } from '../state/toast'

export function SettingsView() {
  const { t } = useI18n()
  const { settings, ready } = useSettings()
  if (!ready) return <Loading label={t('settings.loading')} />
  return <SettingsForm key="ready" settings={settings} />
}

function SettingsForm({ settings }: { settings: AppSettings }) {
  const { save } = useSettings()
  const { t, language, setLanguage } = useI18n()
  const { confirm } = useApp()
  const { notify } = useToast()

  const [rawgKey, setRawgKey] = useState(settings.rawgApiKey)
  const [showKey, setShowKey] = useState(false)
  const [provider, setProvider] = useState<ProviderChoice>(settings.defaultProvider)
  const [country, setCountry] = useState(settings.steamCountry)
  const [gogCountry, setGogCountry] = useState(settings.gogCountry)
  const [gogCurrency, setGogCurrency] = useState(settings.gogCurrency)
  const [hltbAutoEnrich, setHltbAutoEnrich] = useState(settings.hltbAutoEnrich)
  const [metacriticAutoEnrich, setMetacriticAutoEnrich] = useState(settings.metacriticAutoEnrich)
  const [metacriticKey, setMetacriticKey] = useState(settings.metacriticApiKey)
  const [timeAvailable, setTimeAvailable] = useState(settings.timeAvailableHours)
  const [maxHours, setMaxHours] = useState(settings.defaultMaxHours)
  const [weights, setWeights] = useState<PickWeights>(settings.weights)
  const [effortTarget, setEffortTarget] = useState(settings.defaultEffortTarget)
  const [maxEffort, setMaxEffort] = useState(settings.defaultMaxEffort)
  const [minPleasure, setMinPleasure] = useState(settings.defaultMinPleasure)
  const [avoidRecent, setAvoidRecent] = useState(settings.avoidRecentDays)
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    void window.backlog.getAppInfo().then((result) => {
      if (active && result.ok) setInfo(result.data)
    })
    return () => {
      active = false
    }
  }, [])

  const persist = async (): Promise<void> => {
    await save({
      rawgApiKey: rawgKey.trim(),
      defaultProvider: provider,
      steamCountry: country.trim().toUpperCase() || 'IT',
      gogCountry: gogCountry.trim().toUpperCase() || 'IT',
      gogCurrency: gogCurrency.trim().toUpperCase() || 'EUR',
      hltbAutoEnrich,
      metacriticAutoEnrich,
      metacriticApiKey: metacriticKey.trim(),
      timeAvailableHours: timeAvailable,
      defaultMaxHours: maxHours,
      weights,
      defaultEffortTarget: effortTarget,
      defaultMaxEffort: maxEffort,
      defaultMinPleasure: minPleasure,
      avoidRecentDays: avoidRecent
    })
    notify(t('settings.saved'), 'ok')
  }

  const exportData = async (): Promise<void> => {
    setBusy(true)
    try {
      const bundle = await exportBundle()
      const result = await window.backlog.saveJsonFile({
        defaultName: `backlog-wars-${todayIso()}.json`,
        json: JSON.stringify(bundle, null, 2)
      })
      if (!result.ok) {
        notify(errorMessage(t, result), 'error')
        return
      }
      if (result.data.saved) notify(t('settings.backup.saved', { path: result.data.path }), 'ok')
    } finally {
      setBusy(false)
    }
  }

  const importData = async (mode: 'merge' | 'replace'): Promise<void> => {
    if (mode === 'replace') {
      const accepted = await confirm({
        title: t('settings.confirm.replace.title'),
        message: t('settings.confirm.replace.message'),
        confirmLabel: t('settings.confirm.replace.confirm'),
        danger: true
      })
      if (!accepted) return
    }
    setBusy(true)
    try {
      const file = await window.backlog.openJsonFile()
      if (!file.ok) {
        notify(errorMessage(t, file), 'error')
        return
      }
      if (!file.data.opened || !file.data.json) return
      const report = await importBundle(file.data.json, mode)
      notify(
        t('settings.import.done', {
          games: report.games,
          sessions: report.sessions,
          skipped: report.skipped ? t('settings.import.skipped', { count: report.skipped }) : ''
        }),
        'ok'
      )
    } catch (error) {
      notify(errorMessage(t, error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const seed = async (): Promise<void> => {
    setBusy(true)
    try {
      const created = await seedDemoData()
      notify(created > 0 ? t('settings.seed.added', { count: created }) : t('settings.seed.present'), 'ok')
    } finally {
      setBusy(false)
    }
  }

  const wipe = async (): Promise<void> => {
    const accepted = await confirm({
      title: t('settings.confirm.wipe.title'),
      message: t('settings.confirm.wipe.message'),
      confirmLabel: t('settings.confirm.wipe.confirm'),
      danger: true
    })
    if (!accepted) return
    await clearAllData()
    notify(t('settings.wiped'), 'ok')
  }

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <h1>{t('nav.settings')}</h1>
          <p className="view-sub">{t('settings.subtitle')}</p>
        </div>
        <div className="view-actions">
          <button type="button" className="btn primary" onClick={() => void persist()}>
            {t('settings.save')}
          </button>
        </div>
      </header>

      <section className="card">
        <h2 className="section-title">🌍 {t('app.language')}</h2>
        <div className="chip-group">
          {LANGUAGES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`chip${language === entry.id ? ' active' : ''}`}
              onClick={() => void setLanguage(entry.id)}
            >
              {entry.flag} {t(entry.labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">🔎 {t('settings.metadata.title')}</h2>
        <div className="form-grid">
          <Field label={t('settings.rawg.label')} hint={t('settings.rawg.hint')} wide>
            <div className="inline-row">
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                value={rawgKey}
                placeholder={t('settings.rawg.placeholder')}
                onChange={(event) => setRawgKey(event.target.value)}
              />
              <button type="button" className="btn ghost" onClick={() => setShowKey((current) => !current)}>
                {showKey ? t('settings.rawg.hide') : t('settings.rawg.show')}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  void window.backlog.openExternal('https://rawg.io/apidocs').then((result) => {
                    if (!result.ok) notify(errorMessage(t, result), 'error')
                  })
                }
              >
                {t('settings.rawg.get')}
              </button>
            </div>
          </Field>

          <Field label={t('settings.provider.label')}>
            <select
              className="select"
              value={provider}
              onChange={(event) => setProvider(event.target.value as ProviderChoice)}
            >
              <option value="auto">{t('settings.provider.auto')}</option>
              <option value="steam">{t('settings.provider.steam')}</option>
              <option value="gog">{t('settings.provider.gog')}</option>
              <option value="hltb">{t('settings.provider.hltb')}</option>
              <option value="rawg">{t('settings.provider.rawg')}</option>
            </select>
          </Field>

          <Field label={t('settings.steamCountry.label')} hint={t('settings.country.hint')}>
            <input className="input" value={country} maxLength={2} onChange={(event) => setCountry(event.target.value)} />
          </Field>

          <Field label={t('settings.gogCountry.label')} hint={t('settings.country.hint')}>
            <input
              className="input"
              value={gogCountry}
              maxLength={2}
              onChange={(event) => setGogCountry(event.target.value)}
            />
          </Field>

          <Field label={t('settings.gogCurrency.label')} hint={t('settings.gogCurrency.hint')}>
            <input
              className="input"
              value={gogCurrency}
              maxLength={3}
              onChange={(event) => setGogCurrency(event.target.value)}
            />
          </Field>
        </div>

        <div className="stack">
          <Field label={t('settings.metacritic.label')} hint={t('settings.metacritic.hint')} wide>
            <input
              className="input"
              value={metacriticKey}
              placeholder={t('settings.metacritic.placeholder')}
              onChange={(event) => setMetacriticKey(event.target.value)}
            />
          </Field>

          <div className="chip-group">
            <button
              type="button"
              className={`chip${hltbAutoEnrich ? ' active' : ''}`}
              onClick={() => setHltbAutoEnrich((current) => !current)}
            >
              ⏳ {t('settings.hltbAuto')}
            </button>
            <button
              type="button"
              className={`chip${metacriticAutoEnrich ? ' active' : ''}`}
              onClick={() => setMetacriticAutoEnrich((current) => !current)}
            >
              🏅 {t('settings.metacriticAuto')}
            </button>
          </div>

          <p className="muted small">
            {t('settings.sources.gogdb')} <code>/data</code>
            {t('settings.sources.gogdbCache')} {t('settings.sources.metacritic')}
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">🎲 {t('settings.draw.title')}</h2>
        <Slider
          label={t('settings.effortTarget')}
          value={effortTarget}
          onChange={setEffortTarget}
          display={`${effortTarget}/5`}
        />
        <Slider
          label={t('settings.maxEffort')}
          value={maxEffort}
          onChange={setMaxEffort}
          display={`${maxEffort}/5`}
        />
        <Slider
          label={t('settings.minPleasure')}
          value={minPleasure}
          onChange={setMinPleasure}
          display={`${minPleasure}/5`}
        />
        <Slider
          label={t('settings.avoidRecent')}
          value={avoidRecent}
          min={0}
          max={30}
          onChange={setAvoidRecent}
          display={avoidRecent === 0 ? t('common.no') : t('settings.days', { count: avoidRecent })}
        />
        <Slider
          label={t('settings.timeAvailable')}
          value={timeAvailable}
          min={0}
          max={8}
          step={0.5}
          onChange={setTimeAvailable}
          display={timeAvailable === 0 ? t('settings.timeAvailable.none') : t('settings.hours', { count: timeAvailable })}
        />
        <Slider
          label={t('settings.maxHours')}
          value={maxHours}
          min={0}
          max={120}
          step={5}
          onChange={setMaxHours}
          display={maxHours === 0 ? t('settings.maxHours.none') : t('settings.hours', { count: maxHours })}
        />

        <h3 className="section-title">{t('settings.weights.title')}</h3>
        <Slider
          label={t('settings.weights.effort')}
          value={weights.effort}
          min={0}
          max={100}
          step={5}
          onChange={(value) => setWeights((current) => ({ ...current, effort: value }))}
          display={`${weights.effort}%`}
        />
        <Slider
          label={t('settings.weights.pleasure')}
          value={weights.pleasure}
          min={0}
          max={100}
          step={5}
          onChange={(value) => setWeights((current) => ({ ...current, pleasure: value }))}
          display={`${weights.pleasure}%`}
        />
        <Slider
          label={t('label.priority')}
          value={weights.priority}
          min={0}
          max={100}
          step={5}
          onChange={(value) => setWeights((current) => ({ ...current, priority: value }))}
          display={`${weights.priority}%`}
        />
        <Slider
          label={t('settings.weights.novelty')}
          value={weights.novelty}
          min={0}
          max={100}
          step={5}
          onChange={(value) => setWeights((current) => ({ ...current, novelty: value }))}
          display={`${weights.novelty}%`}
        />
        <Slider
          label={t('settings.weights.duration')}
          value={weights.duration}
          min={0}
          max={100}
          step={5}
          onChange={(value) => setWeights((current) => ({ ...current, duration: value }))}
          display={`${weights.duration}%`}
        />
      </section>

      <section className="card">
        <h2 className="section-title">💾 {t('settings.backup.title')}</h2>
        <p className="muted small">{t('settings.backup.note')}</p>
        <div className="view-actions">
          <button type="button" className="btn primary" onClick={() => void exportData()} disabled={busy}>
            ⬇️ {t('settings.backup.export')}
          </button>
          <button type="button" className="btn ghost" onClick={() => void importData('merge')} disabled={busy}>
            ⬆️ {t('settings.backup.importMerge')}
          </button>
          <button type="button" className="btn ghost" onClick={() => void importData('replace')} disabled={busy}>
            ♻️ {t('settings.backup.importReplace')}
          </button>
          <button type="button" className="btn ghost" onClick={() => void seed()} disabled={busy}>
            🧪 {t('settings.backup.seed')}
          </button>
          <button type="button" className="btn ghost danger" onClick={() => void wipe()} disabled={busy}>
            🗑️ {t('settings.backup.wipe')}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">ℹ️ {t('settings.info.title')}</h2>
        <ul className="simple-list">
          <li>
            <span>{t('settings.info.app')}</span>
            <span className="muted small">
              Backlog Wars {info?.version ?? ''} · Electron {info?.electron ?? '—'} · Chromium {info?.chrome ?? '—'}
            </span>
          </li>
          <li>
            <span>{t('settings.info.node')}</span>
            <span className="muted small">
              {info?.node ?? '—'} · {info?.platform ?? ''}/{info?.arch ?? ''}
            </span>
          </li>
          <li>
            <span>{t('settings.info.userData')}</span>
            <span className="muted small">{info?.userDataPath ?? '—'}</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
