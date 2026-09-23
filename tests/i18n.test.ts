/// <reference types="vite/client" />
/**
 * i18n dictionary guards: parity between English and Italian, no key
 * duplicated across areas, consistent placeholders and no key used but missing.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..')
const MESSAGES = join(ROOT, 'src', 'renderer', 'src', 'i18n', 'messages')
const RENDERER = join(ROOT, 'src', 'renderer', 'src')

const modules = import.meta.glob('../src/renderer/src/i18n/messages/*/*.ts', { eager: true }) as Record<
  string,
  { default: Record<string, string> }
>

function areaOf(path: string): { language: string; area: string } {
  const [language, area] = path.split('/').slice(-2)
  return { language, area: area.replace(/\.ts$/, '') }
}

const dictionaries: Record<string, Record<string, string>> = { en: {}, it: {} }
const keysByFile = new Map<string, string[]>()

for (const [path, module] of Object.entries(modules)) {
  const { language, area } = areaOf(path)
  const entries = module.default ?? {}
  keysByFile.set(`${language}/${area}`, Object.keys(entries))
  for (const [key, value] of Object.entries(entries)) {
    if (language === 'en') dictionaries.en[key] = value
    dictionaries[language][key] = value
  }
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'i18n' || entry === 'node_modules') continue
      walk(full, files)
    } else if (/\.tsx?$/.test(entry) && entry !== 'smoke.ts') {
      // The self-test is not UI: its step names look like keys but are not.
      files.push(full)
    }
  }
  return files
}

/**
 * Keys referenced in the renderer sources: both inside `t('...')` and as
 * strings in maps/arrays (labelKey), which are then passed to t().
 */
function usedKeys(): Map<string, string[]> {
  const used = new Map<string, string[]>()
  for (const file of walk(RENDERER)) {
    const content = readFileSync(file, 'utf8')
    for (const match of content.matchAll(/'([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)'/g)) {
      const key = match[1]
      used.set(key, [...(used.get(key) ?? []), relative(ROOT, file)])
    }
  }
  return used
}

const placeholders = (value: string): string[] => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

describe('dizionari i18n', () => {
  it('copre tutte le aree previste', () => {
    const areas = readdirSync(join(MESSAGES, 'en')).map((file) => file.replace(/\.ts$/, ''))
    expect(areas.sort()).toEqual(
      ['core', 'detail', 'form', 'library', 'links', 'log', 'notes', 'play', 'settings', 'stats', 'ui'].sort()
    )
    for (const area of areas) {
      expect(readdirSync(join(MESSAGES, 'it'))).toContain(`${area}.ts`)
    }
  })

  it('inglese e italiano hanno esattamente le stesse chiavi', () => {
    const en = Object.keys(dictionaries.en).sort()
    const it = Object.keys(dictionaries.it).sort()
    expect(it.filter((key) => !en.includes(key))).toEqual([])
    expect(en.filter((key) => !it.includes(key))).toEqual([])
    expect(en.length).toBeGreaterThan(300)
  })

  it('nessuna chiave duplicata fra aree diverse', () => {
    for (const language of ['en', 'it']) {
      const seen = new Map<string, string>()
      const duplicates: string[] = []
      for (const [name, keys] of keysByFile) {
        if (!name.startsWith(`${language}/`)) continue
        for (const key of keys) {
          const previous = seen.get(key)
          if (previous) duplicates.push(`${key} (${previous} + ${name})`)
          seen.set(key, name)
        }
      }
      expect(duplicates).toEqual([])
    }
  })

  it('nessun valore vuoto e segnaposto coerenti fra le due lingue', () => {
    for (const [key, value] of Object.entries(dictionaries.en)) {
      expect(value.trim(), `chiave inglese vuota: ${key}`).not.toBe('')
      const italian = dictionaries.it[key]
      expect(italian?.trim(), `chiave italiana vuota: ${key}`).toBeTruthy()
      expect(placeholders(italian ?? ''), `segnaposto diversi in ${key}`).toEqual(placeholders(value))
    }
  })

  it('ogni chiave citata nei componenti esiste nel dizionario inglese', () => {
    const missing: string[] = []
    for (const [key, files] of usedKeys()) {
      // Some dotted strings are not i18n keys (versions, URLs, CSS…): they are ignored.
      if (!/^(app|nav|common|status|effort|pleasure|group|tone|label|error|library|detail|play|log|stats|settings|form|notes|links|ui)\./.test(key)) continue
      if (!dictionaries.en[key]) missing.push(`${key} (${files[0]})`)
    }
    expect(missing).toEqual([])
  })

  it('non ci sono chiavi definite e mai usate nelle aree delle viste', () => {
    const used = new Set(usedKeys().keys())
    const unused: string[] = []
    for (const [name, keys] of keysByFile) {
      if (!name.startsWith('en/')) continue
      const area = name.slice(3)
      for (const key of keys) {
        // core keys are also used indirectly (status.*, group.*, label.*, error.*…)
        if (area === 'core') continue
        if (!used.has(key)) unused.push(key)
      }
    }
    expect(unused).toEqual([])
  })
})
