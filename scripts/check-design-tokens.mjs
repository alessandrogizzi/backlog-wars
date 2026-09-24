#!/usr/bin/env node
/**
 * Design-token guard.
 *
 * The renderer stylesheet is split into tokens.css, base.css and
 * components.css. This script keeps the split honest:
 *
 *   1. every `var(--token)` used in a style file must be declared in
 *      tokens.css (no typo silently falling back to an unset value);
 *   2. the component and base layers must not hardcode a colour, a spacing
 *      step, a font size or a radius — those come from tokens only;
 *   3. (informational) tokens that nothing uses any more.
 *
 * Run with `npm run lint:tokens`; it is part of `npm run verify`.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const STYLE_DIR = fileURLToPath(new URL('../src/renderer/src/styles/', import.meta.url))
const TOKENS_FILE = 'tokens.css'

const files = readdirSync(STYLE_DIR)
  .filter((name) => name.endsWith('.css'))
  .sort()

if (!files.includes(TOKENS_FILE)) {
  console.error(`✖ design tokens: ${TOKENS_FILE} not found in ${STYLE_DIR}`)
  process.exit(1)
}

const sources = new Map(files.map((name) => [name, readFileSync(STYLE_DIR + name, 'utf8')]))

/* ------------------------------------------------------------ definitions */

const declared = new Set()
for (const [, css] of sources) {
  for (const match of css.matchAll(/(^|\s)(--[a-z0-9-]+)\s*:/gm)) declared.add(match[2])
}

/* ------------------------------------------------------------- references */

const unknown = []
for (const [name, css] of sources) {
  css.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*[),]/g)) {
      if (!declared.has(match[1])) {
        unknown.push(`${name}:${index + 1} ${match[1]}`)
      }
    }
  })
}

/* ------------------------------------------------------------ raw values */

const RAW_RULES = [
  { label: 'colour', pattern: /#[0-9a-fA-F]{3,8}\b/ },
  { label: 'colour', pattern: /\brgba?\(/ },
  { label: 'spacing', pattern: /(?:padding|margin|gap|row-gap|column-gap)[a-z-]*:\s*[^;]*\d+px/ },
  { label: 'font size', pattern: /font-size:\s*[\d.]+(?:px|rem|em)/ },
  { label: 'radius', pattern: /border-radius:\s*[^;]*\d+px/ }
]

// Media-query breakpoints cannot read custom properties, they are allowed.
const ALLOWED = [/^\s*@media/]

const raw = []
const localTokens = []
for (const [name, css] of sources) {
  if (name === TOKENS_FILE) continue
  css.split('\n').forEach((line, index) => {
    if (ALLOWED.some((pattern) => pattern.test(line))) return
    const rule = RAW_RULES.find((entry) => entry.pattern.test(line))
    if (rule) raw.push(`${name}:${index + 1} (${rule.label}) ${line.trim()}`)
    const definition = /(^|\s)(--[a-z0-9-]+)\s*:/.exec(line)
    if (definition) localTokens.push(`${name}:${index + 1} ${definition[2]}`)
  })
}

/* --------------------------------------------------------------- unused */

const used = new Set()
for (const [, css] of sources) {
  for (const match of css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*[),]/g)) used.add(match[1])
}
const unused = [...declared].filter((token) => !used.has(token)).sort()

// Ladders (space-1…32, font-size-1…15) are meant to have spare steps: they are
// only reported when a token outside a scale has stopped being referenced.
const SCALE_FAMILIES = [
  '--space-',
  '--font-size-',
  '--font-weight-',
  '--line-height-',
  '--tracking-',
  '--radius-',
  '--shadow-',
  '--duration-',
  '--ease-',
  '--z-',
  '--glow-'
]
const unusedOutsideScales = unused.filter((token) => !SCALE_FAMILIES.some((family) => token.startsWith(family)))

/* --------------------------------------------------------------- report */

const problems = unknown.length + raw.length
const summary = `${declared.size} tokens declared, ${used.size} used, ${unknown.length} unknown, ${raw.length} raw values`

if (unusedOutsideScales.length > 0) {
  console.log(`ℹ design tokens: unused (${unusedOutsideScales.length}): ${unusedOutsideScales.join(', ')}`)
}

if (localTokens.length > 0) {
  console.log(`ℹ design tokens: declared outside ${TOKENS_FILE}: ${localTokens.join(', ')}`)
}

if (problems > 0) {
  console.error(`✖ design tokens: ${summary}`)
  for (const entry of unknown) console.error(`  unknown token  ${entry}`)
  for (const entry of raw) console.error(`  raw value      ${entry}`)
  process.exit(1)
}

console.log(`✔ design tokens: ${summary}`)
