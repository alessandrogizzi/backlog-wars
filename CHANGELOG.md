# Changelog

All notable changes to **Backlog Wars**.
Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [1.2.0-beta.0] — 2026-09-25

Two things asked for by hand: a sidebar that gets out of the way, and your own score on every game. Plus a pass on the
game card, where the spacing and the alignment were off.

> 🧪 **Experimental project.** The codebase, the tests, the documentation and the release pipeline are written by an AI
> agent running inside **DeepSeek Harness** with the **`deepseek-flash`** model (DeepSeek-V4.1-Flash, reasoning effort
> *high*). This release consumed **≈119.9 M tokens** (119.7 M cache-hit input, 0.08 M cache-miss input, 0.18 M output)
> for an estimated cost of **≈$0.48 off-peak / ≈$0.96 peak**; the project so far totals **≈453.2 M tokens**
> (**≈$2.41 / ≈$4.83**) at DeepSeek's published rates.

### Added

**Collapsible sidebar**
- The `«` button reduces the sidebar to icons (72px) and gives the content the room; `»` brings it back, and the choice
  is remembered between sessions (stored in the settings row, no schema change).
- Collapsed, "Add game" becomes a `＋` button and the language switch stacks the two flags. The text is hidden with CSS
  but stays in the DOM, every control keeps its `aria-label` and collapsed items gain a tooltip.

**Personal score**
- **Your score, 1-10**: a slider in *Quick ratings*, after effort, pleasure and priority. 0 means not rated yet.
- The score also appears **on the card cover, next to the Metascore**, so their verdict and yours read together: the
  Metascore keeps its dark plate with the band colour, yours is a filled accent pill (`★ 9`), and the tooltip spells it
  out. It only appears when the game is actually rated.
- The field is the hook for a **personal review** later on.

### Changed
- **The "Run started" toggle left Quick ratings**: it duplicated the switch that already lives in the edit form. The
  started state is still reported by the *Run* stat card and set from the form.
- **The game card breathes**: section headings take space below them (they used to touch the content: Metacritic,
  Duration, Notes, links, session log), the box beside the action buttons is aligned with them (same column, 220px
  minimum and growing with the labels), and the actions stay anchored to the footer even when the game has no
  description.
- **The segmented control** now fills its width — no empty space after the last segment — and has hover, press and a
  visible focus ring, with the solid accent kept for the selected state.
- **Preset link labels** (Guide, Cheats, Mod…) are shown translated in the composer and in the inline edit field,
  instead of the canonical value stored in the database.

### Fixed
- Two more pairs of blocks glued together inside cards: the chip row before the link list (and its empty state) and the
  "satisfaction by effort" table before its note.

## [1.1.0-beta.0] — 2026-09-25

The interface gets a design system instead of a 2 250-line stylesheet, and the library cards show the comparison that
matters: the average time a game needs next to the time you played. No storage or API change — open the app and your
data is where you left it.

> 🧪 **Experimental project.** The codebase, the tests, the documentation and the release pipeline are written by an AI
> agent running inside **DeepSeek Harness** with the **`deepseek-flash`** model (DeepSeek-V4.1-Flash, reasoning effort
> *high*). This release consumed **≈85.0 M tokens** (84.5 M cache-hit input, 0.17 M cache-miss input, 0.26 M output) for
> an estimated cost of **≈$0.43 off-peak / ≈$0.87 peak**; the whole project so far totals **≈333.3 M tokens**
> (**≈$1.93 / ≈$3.86**) at DeepSeek's published rates.

### Added

**Design system**
- **Design tokens** as the single source of truth: primitives (colour ramps) plus a semantic layer — `--color-*`,
  `--space-*`, `--radius-*`, `--font-size-*`, `--shadow-*`, `--duration-*`, `--z-*` — where translucent variants are
  built with `color-mix()`, so a theme has one place to change.
- The stylesheet is split into `styles/tokens.css` (values), `styles/base.css` (reset, focus, scrollbars, utilities) and
  `styles/components.css` (layout, components, views).
- **`npm run lint:tokens`**, part of `npm run verify`: it fails on a `var()` that is not declared and on a raw colour,
  spacing step, font size or radius outside the token file.
- **`docs/design-tokens.md`**: the three layers, the scales, the approved rhythm, how to add a token or a theme.

**Library cards**
- **Playtime meter**: the average time the game needs (HowLongToBeat) on the left, the time you played on the right,
  with a bar relating them, a `progressbar` role and a tooltip carrying the full detail.
- The **Metascore badge on the cover** sits on a near-opaque, blur-backed plate with the score band colouring border and
  digits, so it stays readable on a bright cover and on a dark one.

### Changed

- **One control height** for buttons and fields (`--control-height-md`), so a form row is pixel-aligned.
- **Card footers** are three equal columns that fill the width in every language; labels clip with an ellipsis instead
  of wrapping.
- **One spacing rhythm**: 16px gutters for card grids, 20px card and modal padding, 24/32/60 for the main column.
- **Keyboard focus is visible** on every interactive element, `prefers-reduced-motion` is honoured, numbers use tabular
  figures and `color-scheme: dark` keeps native widgets dark.
- Tagline: *"il backlog è solo nella tua testa"* / *"the backlog is all in your mind"*.

### Removed

- The **Metascore preview in the card body**: the badge on the cover already carries the score, the ★ Must Play mark and
  the tooltip.
- Every **"time left" figure on a card**, and the one in the duration badge: how much a game still needs is a guess, so
  the card shows measured facts (length, time played) instead. The detail view and the statistics keep the estimates
  they are built on.

### Fixed

- **Seven pairs of blocks inside cards sat at 0px** — the hint on top of the chips, the note on top of the button row, one
  chip row on the next, a heading on what preceded it — in Settings, *What do I play?* and Tournament.
- A **chip row wrapping one line further** in the library filters after the padding snap, and the application window
  growing past the card footer on narrow cards.

## [1.0.0-beta.1] — 2026-09-24

First public beta. The app is complete and usable every day, but this is a beta: APIs and the data schema may still
change before the stable 1.0.0.

> 🧪 **Experimental project.** The entire codebase, the tests, the documentation and the release pipeline were written by
> an AI agent running inside **DeepSeek Harness** with the **`deepseek-flash`** model (DeepSeek-V4.1-Flash, reasoning
> effort *high*). The first beta consumed **≈149.9 M tokens** (149.2 M cache-hit input, 0.18 M cache-miss input,
> 0.55 M output) for an estimated cost of **≈$0.80 off-peak / ≈$1.61 peak** at DeepSeek's published rates.

### Added

**Library and backlog**
- Games with status (backlog, playing, completed, dropped, wishlist), platform, genres, tags, notes, useful links,
  favourites and priority.
- Search, filters (text, status, platform, group, genre, favourites, Metascore 75+, missing score) and many sort orders
  (title, Metascore, effort, demonstrated pleasure, priority, time played, duration, time left, last session).
- **Already started and hours already played**: declare that a game is in progress and how many hours you played outside
  the app; those hours add up to tracked sessions and reduce the time left.
- Cards with cover, status/retro/DOSBox badges, duration badge, colour-coded Metacritic preview and a **▶ started** badge.

**Online metadata**
- **Steam Store**, **GOG**, **HowLongToBeat** and **RAWG** (optional free key), queried in parallel in automatic mode and
  merged into a single result.
- **Metacritic** with automatic lookup: Metascore, review counts, sentiment, ★ Must Play and per-platform scores.
- **GOGDB** (`/data` public JSON, as its maintainers ask) for description, boxart, published builds and the DOSBox flag.
- **HowLongToBeat** durations: main story, main + extras, 100% and all-styles average, with time left.

**Retro gaming**
- 45 canonical platforms with group, retro flag and **emulator suggestion** (Snes9x, DuckStation, PCSX2, DOSBox-X…).
- Provider platform names normalised onto one vocabulary, group filters and a statistic for time spent on vintage hardware.

**What do I play**
- Pure random draw, **smart weighted draw** (available energy, demonstrated pleasure, priority, novelty, duration versus
  available time) and a **tournament** bracket (4/8/16 games).
- Filters on statuses, platform, group, genre, max effort, min pleasure, max duration and available time.

**Sessions, notes and links**
- Play log with time, perceived effort, satisfaction, progress and notes; aggregates recompute automatically.
- **Notes** as an editable list, each with creation and last-modified timestamps.
- **Useful links** (guides, wikis, videos, mods) with **Open Graph previews** (title, description, image, favicon) and
  YouTube oEmbed support.

**Statistics and data**
- KPIs on time, satisfaction, effort, streaks and backlog estimates (main-story hours, 100% hours, time left), retro
  time, average Metascore, weekly/effort/platform charts.
- Local persistence with **Dexie.js** on IndexedDB (schema v4), full JSON backup and demo data.

**Interface languages**
- The UI ships in **English (default)** and **Italian**, switchable from the sidebar or Settings. Provider error messages
  carry codes and are translated in the renderer.

### Technical notes
- Electron + React + TypeScript app; sandboxed renderer with `contextIsolation`, Node access only through the preload bridge.
- 216 unit tests, an end-to-end self-test inside Electron (`npm run smoke`, with live checks on Steam, GOG, HowLongToBeat,
  GOGDB, Metacritic and link previews) and Linux AppImage/deb packages.
- Automatic schema migrations: v1 → v2 (notes moved to a dedicated table), v2 → v3 (useful links),
  v3 → v4 (genre vocabulary in English).

### Known limitations
- HowLongToBeat, Metacritic and GOGDB have no official APIs: the app uses public endpoints with caches and controlled
  fallbacks; if a service changes shape the app degrades with a warning and never loses data.
- Without a RAWG key the automatic search uses Steam, GOG and HowLongToBeat.
- Windows and macOS packages are neither signed nor tested on real hardware.
- Code comments are still mostly in Italian.
