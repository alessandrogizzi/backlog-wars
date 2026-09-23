# Changelog

All notable changes to **Backlog Wars**.
Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

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
