# ⚔️ Backlog Wars

**Version: 1.0.0-beta.1** · [changelog](CHANGELOG.md) · [release notes](docs/releases/v1.0.0-beta.1.md)

> ## 🧪 Experimental project — built end to end with DeepSeek Harness
>
> This app is an **experiment**: the whole codebase, the tests, the documentation and the release pipeline were written
> by an AI agent running inside **[DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/en/guide/quickstart)**,
> with the **`deepseek-flash`** model (DeepSeek-V4.1-Flash, provider `deepseek-official`, reasoning effort *high*).
> A human only provided the requirements and reviewed the result.
>
> **Cost of the first beta version** (session totals reported by the harness; every feature included):
>
> | Metric | Value |
> | --- | --- |
> | Turns / steps | 13 turns · 430+ agent steps |
> | Input tokens (cache hit) | 149.2 M |
> | Input tokens (cache miss) | 0.18 M |
> | Output tokens | 0.55 M |
> | **Total processed** | **≈ 149.9 M tokens** |
> | **Estimated cost** | **≈ $0.80 off-peak · ≈ $1.61 peak** |
>
> Prices are DeepSeek's published rates for `deepseek-flash`
> ([api-docs.deepseek.com](https://api-docs.deepseek.com/quick_start/pricing/)): $0.003 / $0.006 per million cache-hit
> input tokens, $0.15 / $0.30 per million cache-miss input tokens and $0.60 / $1.20 per million output tokens
> (off-peak / peak). The cost is an **estimate**, not an invoice.
>
> Expect rough edges: this is a beta written by an agent, and some integrations rely on unofficial public endpoints.

Desktop app (Electron + React + TypeScript) to keep your **video game backlog** under control: it looks up game data
online (retro gaming included), knows how long games are, decides **what to play** (random draw, weighted draw or
tournament) and logs **time**, **effort** and **satisfaction** for every session, with statistics that show how much
each game "pays back" and how long is left to finish it.

Everything is stored **locally** with [Dexie.js](https://dexie.org) on IndexedDB: no account, no server.

**Languages:** the interface ships in **English (default)** and **Italian**, switchable from the sidebar or from
Settings. Code comments are still mostly in Italian.

> ⚠️ **Beta**: the app is complete and usable every day, but APIs and the data schema may still change before the
> stable 1.0.0 (schema migrations are automatic and backups can be exported as JSON).

---

## ✨ Features

### Library
- Games with status (`In backlog`, `Playing`, `Completed`, `Dropped`, `Wishlist`), platform, genres, tags, notes, useful
  links, favourites and priority.
- Per game: **effort** (1-5), **pleasure** (1-5), **priority** (1-5), **HowLongToBeat durations**, cover, description,
  release year, Metacritic and external link.
- Search, filters (text, status, platform, **platform group**, genre, favourites, **Metascore 75+**, **no score**) and
  many sort orders (title, **Metascore**, effort, demonstrated pleasure, priority, time played, **estimated duration**,
  **time left**, last session).
- Badges for **retro** and **DOSBox** games, plus the **Metascore badge on the cover**: colour-coded score, review
  count and ★ Must Play (or "no Metascore yet").
- **Playtime against the estimate**: every card shows the time you played next to the HowLongToBeat length, with a
  progress bar and the percentage, so "how far in am I?" is one glance instead of two numbers.
- **🏅 Update missing Metascores** button: looks up scores for the games that don't have one yet, one at a time.

### Already started and hours already played
- Mark a game as **already started** (with a start date) and declare **how many hours you already played** before using
  the app or on another platform.
- Declared hours are **added to tracked sessions**: played time, completion percentage and **time left** take both into
  account (e.g. *35h declared out of ≈58h main story → ≈23h left*).
- The game page always shows the split **Sessions / Declared / Total**, and marking a game as started moves it to
  *Playing* if it was in the backlog.
- Cards show a **▶ started** badge for games resumed long ago with no sessions logged yet, and the time sort uses the
  effective total.

### Durations (HowLongToBeat)
- Main story, main + extras, 100% completion and all-styles average.
- Bars compare durations with **time already played** and compute **time left** (`Played 6h of ≈23h (26%) · ≈17h left`).
- If the title is ambiguous the app proposes alternatives with a **similarity score**: you pick the right one.
- **Suggested effort** is derived from duration (under 4 hours → 1, over 50 → 5), one click away.
- Optional automatic enrichment when you add a game from another source (Settings).

### Online metadata (multi-source)
In **Automatic** mode the app queries every source in parallel and **merges the results**: one row with cover, genres,
platforms and durations.

| Source | Key needed | What it gives |
| --- | --- | --- |
| **Steam Store** | no | PC games, covers, genres, Metacritic |
| **GOG** | no | GOG/DRM-free catalogue, great for retro PC (DOS) |
| **HowLongToBeat** | no | durations + historical platforms + release year (consoles and retro) |
| **RAWG** | free key | rich descriptions, genres, modern and retro platforms |
| **Metacritic** | no | Metascore, review counts, sentiment, ★ Must Play, per-platform scores |
| **GOGDB** | no | description, boxart, published builds, changelog and DOSBox flag for GOG products |

- GOGDB has no search API and asks not to be scraped: the app reads its **public JSON** under
  `/data/products/<id>/product.json`, with a one-hour local cache.
- GOG search is phrase-based: the app tries progressive queries and **re-ranks results by title similarity**
  (`the witcher 3` still finds *The Witcher 3: Wild Hunt*) while dropping noise such as *Port Royale 2*.

### Retro gaming
- **45 canonical platforms** from PC to modern consoles, plus NES, Super Nintendo, Mega Drive, Master System, Saturn,
  Dreamcast, Game Gear, Game Boy (Color/Advance), DS, 3DS, PSP, PS Vita, PlayStation, PS2, PS3, Xbox, Xbox 360, Wii,
  Wii U, GameCube, N64, Neo Geo, PC Engine, WonderSwan, Atari 2600, Amiga, Commodore 64, ZX Spectrum, MSX, DOS and
  Arcade/MAME.
- Every platform carries a **group** (PC, console, handheld, retro, mobile, VR), a **retro flag** and an **emulator
  suggestion** (Super Nintendo → *Snes9x (RetroArch)*, PS2 → *PCSX2*, DOS → *DOSBox-X*), shown on the game page.
- Provider platform names are normalised onto the internal vocabulary: `Super Nintendo Entertainment System`, `SNES`
  and `Super Famicom` all become *Super Nintendo*.
- Group filter (e.g. **👾 Retro** only) in Library, *What do I play?* and Tournament, plus a dedicated statistic for
  **time spent on vintage platforms**.

### What do I play?
Three ways to decide, all filterable:
1. **Pure random** — uniform roulette over the eligible pool.
2. **Smart draw** — weighted draw over five factors with adjustable weights:
   - compatibility with the **energy you have right now** (game effort vs your energy),
   - **demonstrated pleasure** (real session satisfaction gradually replaces the declared rating),
   - **priority** (with a bonus for favourites),
   - **novelty** (how long since the last session),
   - **duration vs the time you actually have** (time left compared with the hours available now).
   Every eligible game keeps a minimum chance: randomness stays in charge.
3. **Tournament** — 4/8/16 game single-elimination bracket: pick the winners and the champion goes straight to a session.

Draw filters: statuses, platform, **platform group**, genre, max effort, min pleasure, **max duration**, **time
available now**, "never played only", "favourites only" and excluding games played in the last N days. The app always
shows **why** a game is in the running (score and each factor's contribution).

### Sessions, notes and links
- Log per session: date, **time played** (with quick presets), **perceived effort**, **satisfaction**, progress, notes
  and an optional status change (e.g. `Completed`, `Dropped`). Aggregates recompute automatically.
- **Notes** are a list: add, edit and delete as many as you want. Each note keeps its **creation date** and **last
  modified date** (Ctrl+Enter to save, Esc to cancel).
- **Useful links** (guides, wikis, videos, mods, forums, stores) with a **page preview** read from Open Graph
  (title, description, image, favicon) and the official oEmbed for YouTube. Every link shows its domain, when it was
  added and when it was last updated.

### Statistics
- KPIs: total time, average satisfaction and effort, average session, last 30 days, current streak.
- **Backlog estimates**: hours of main story only, hours for 100% completion, **time left** on games in progress, time
  spent on retro platforms, how many games have a known duration, **how many are already started**.
- Total time includes declared hours, broken down as *"of which 35h declared by hand"*; the weekly chart stays on tracked
  sessions, which have a date.
- Charts: time per week, satisfaction per effort level, time and payback per game, distribution by platform group,
  platform and genre, average Metascore.

### Data
- JSON export/import (merge or replace) covering **games, sessions, draws, notes, links and settings**, demo data
  (retro games, notes and links included) and a full wipe.
- Settings: RAWG key, Metacritic key (optional), default source, Steam country, GOG country/currency, automatic
  duration and Metascore enrichment, **language**, default draw values and weights.

---

## 🚀 Quick start

```bash
npm install          # install dependencies (downloads the Electron binary too)
npm run dev          # start the app in development mode (renderer hot reload)
```

Other commands:

```bash
npm run build        # build main, preload and renderer into out/
npm start            # run the production build
npm run typecheck    # type checking (main/preload/tests + renderer)
npm test             # unit tests (vitest)
npm run verify       # typecheck + test + build
npm run smoke        # build + end-to-end self-test inside real Electron (isolated profile)
npm run icon         # regenerate the app icon
npm run dist:linux   # AppImage package
npm run dist:deb     # .deb package (custom packager, no fpm/Ruby needed)
npm run release:beta # verify + AppImage + deb
```

> If `npm install` does not run install scripts (npm `allowScripts` policy), the Electron binary is not downloaded: run
> `npm install-scripts approve electron esbuild` and then `npm rebuild electron`.

### Keys and services
- **Steam, GOG, HowLongToBeat and Metacritic need no key**: they work out of the box.
- **RAWG** is optional: sign up at [rawg.io/apidocs](https://rawg.io/apidocs), grab the free key and paste it in
  **Settings → Metadata search**.
- **GOGDB** is read-only on its public `/data` JSON (as its maintainers ask), cached for one hour.
- **Metacritic** is queried through the JSON backend the website itself uses, with the public key embedded in its
  frontend and a 24-hour cache; if that key ever changes you can set a new one in Settings.

---

## 📦 Release

```bash
npm run release:beta   # verify (tokens + typecheck + 216 tests + build) + AppImage + deb into release/
npm run dist:linux     # AppImage only
npm run dist:deb       # .deb only (uses scripts/build-deb.mjs)
```

Artifacts land in `release/` as `backlog-wars-<version>-<arch>.<ext>`; release notes live in `docs/releases/`.

### Versioning and commits

Work is committed as it happens; a version number is assigned only when a set of changes is released. History is
**never rewritten**: commits that have been pushed are not amended, rebased or force-pushed, so every tag keeps
pointing at the exact tree that produced the published artifacts.

| Change | Version |
| --- | --- |
| Fixes, internal work, documentation | patch — `1.0.0` finalising the beta, then `1.0.1`; in beta: next `-beta.N` |
| New backwards-compatible features | minor — `1.1.0` |
| Breaking changes to storage or the public interface | major — `2.0.0` |

The order is always: commit, then bump, then tag, then build.

```bash
git commit -m "fix: align library card footers"   # one commit per change, no --amend on pushed work
npm run verify                                    # lint:tokens + typecheck + 216 tests + build must be green
# write the new CHANGELOG.md section and docs/releases/<version>.md, commit them
npm version prerelease --preid=beta               # 1.0.0-beta.1 -> 1.0.0-beta.2 (commits + tags)
npm version patch                                 # or: finalises the beta to 1.0.0 / 1.0.1 after it
npm run release:beta                              # build the artifacts with the new version
git push origin main --tags
```

`npm version` refuses to run on a dirty tree: that is the guard keeping the bump, the notes and the artifacts in sync.
Useful bumps: `prerelease --preid=beta` increments the beta suffix (`-beta.2` → `-beta.3`), `preminor --preid=beta`
opens the next minor as a beta (`1.1.0-beta.0`), and `patch` on `1.0.0-beta.2` ships it as `1.0.0`.

### Publishing

```bash
git push origin main --tags             # SSH remote (git@github.com:<owner>/backlog-wars.git)
```

Then create the release from the repository's *Releases* page, or with the `gh` CLI:

```bash
gh release create v1.0.0-beta.2 release/*.AppImage release/*.deb release/SHA256SUMS.txt \
  --title "Backlog Wars 1.0.0-beta.2" --notes-file docs/releases/v1.0.0-beta.2.md --prerelease
```

Without the `gh` CLI, create the release from the *Releases* page and attach the three files from
`release/`. If your remote is HTTPS, GitHub asks for a **personal access token** (not the account password) as the
password; switching the remote to SSH avoids it:

```bash
git remote set-url origin git@github.com:<owner>/backlog-wars.git
```

> The `.deb` is assembled by `scripts/build-deb.mjs` (`ar` + `tar`, no fpm/Ruby): the fpm binary that electron-builder
> downloads does not start on distributions missing `libcrypt.so.1`, such as Fedora 44. On Debian/Ubuntu you can still
> use `npx electron-builder --linux deb` if you prefer the native path.

---

## 🧱 Architecture

```
src/
├── main/                 # Electron main process
│   ├── index.ts          # window, single instance, --smoke and --shoot modes
│   ├── ipc.ts            # IPC channels (metadata, durations, GOGDB, link previews, file dialogs, external links)
│   ├── windowState.ts    # window size/position persistence
│   └── providers/        # metadata sources (all with pure, tested parsers)
│       ├── http.ts       # GET/POST with timeout, caches and friendly coded errors
│       ├── parse.ts      # parsers for RAWG, Steam, HowLongToBeat, GOG, GOGDB, Metacritic, link previews
│       ├── rawg.ts       # RAWG (API key)
│       ├── steam.ts      # Steam Store (no key)
│       ├── gog.ts        # GOG catalogue + local re-ranking
│       ├── hltb.ts       # HowLongToBeat: token, search and durations
│       ├── metacritic.ts # Metacritic: Metascore and per-platform scores
│       ├── gogdb.ts      # GOGDB: product.json with cache
│       ├── linkPreview.ts# link previews (Open Graph, YouTube oEmbed)
│       └── index.ts      # multi-source search and result merging
├── preload/index.ts      # contextBridge → window.backlog (no Node in the renderer)
├── shared/               # types, platform/genre vocabulary, formatting, title matching
└── renderer/src/
    ├── i18n/             # English/Italian dictionaries split by area + useI18n() hook
    ├── db/               # Dexie: schema (v4), repository, demo data
    ├── logic/            # pure, testable functions
    │   ├── library.ts    # library filters and sorting (Metascore included)
    │   ├── picker.ts     # scores (effort, pleasure, priority, novelty, duration), draws, tournament
    │   ├── duration.ts   # time left, fit with available time, suggested effort
    │   ├── stats.ts      # dashboard, backlog estimates, retro gaming
    │   └── smoke.ts      # end-to-end self-test
    ├── state/            # React providers (settings, toasts, navigation, live queries)
    ├── components/       # reusable UI (cards, modals, meters, duration bars, notes, links)
    ├── views/            # Library, Detail, What do I play?, Tournament, Sessions, Statistics, Settings
    └── styles/           # design tokens, base layer and components (docs/design-tokens.md)
```

**Security**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; the renderer never touches Node and
everything goes through the preload bridge. HTTP calls to providers happen only in the main process. A CSP restricts
scripts, styles and images.

**Design system**: the whole look lives in `src/renderer/src/styles/`, split into design tokens, a base layer and the
component layer, and enforced by `npm run lint:tokens` (no unknown token, no raw colour/spacing/radius outside the
token file). `docs/design-tokens.md` documents the scales, the rules and how to add a token or a theme.

**Persistence**: IndexedDB through Dexie (tables `games`, `sessions`, `picks`, `notes`, `links`, `settings`) inside the
Electron user data folder (`Settings → About` shows the exact path). The schema is at **version 4**: v2 moved notes into
a dedicated table with timestamps, v3 added useful links and v4 translated the genre vocabulary to English;
migrations are automatic and keep existing data.

---

## ✅ Verification

- `npm run lint:tokens` — design-token guard: every `var()` is declared and no component hardcodes a colour,
a spacing step, a font size or a radius.
- `npm test` — **216 unit tests**: useful links (URL normalisation, hosts, Open Graph/Twitter parsing, CRUD, cascade,
  backup), selection engine (including duration fit), library filters and sorting (Metascore and effective time), notes
  (CRUD, timestamps, cascade, backup) and **v1 → v2 → v3 migrations**, declared progress (hours played elsewhere, time
  left, statistics), tournament, statistics, duration logic, title matching, RAWG/Steam/HowLongToBeat/GOG/GOGDB/Metacritic
  parsers and Dexie persistence.
- `npm run smoke` — starts Electron with a hidden window on an **isolated profile** and runs a real self-test: database
  open, game creation, sessions, aggregate recomputation, duration logic, notes and links CRUD, declared hours, filters,
  tournament, dashboard, cleanup, IPC channels and — when the network is available — **live queries to Steam, GOG,
  HowLongToBeat, GOGDB and Metacritic**, link previews and multi-source merging with a retro title.
- Both Linux packages (AppImage and deb) are opened and executed from their payload with the same self-test.

```
SMOKE_REPORT {"ok":true,"steps":[
  {"name":"dexie.open","ok":true,"detail":"schema v4"},
  {"name":"note.crud","ok":true,"detail":"create, edit and timestamps ok"},
  {"name":"link.crud","ok":true,"detail":"create, preview and timestamps ok"},
  {"name":"progress.declared-hours","ok":true,"detail":"declared hours consistent with time left"},
  {"name":"network.gog","ok":true,"detail":"first: Heroes of Might and Magic® 3: Complete (id 1207658787)"},
  {"name":"network.hltb","ok":true,"detail":"Portal 2: main story 8h 35m (match 1)"},
  {"name":"network.gogdb","ok":true,"detail":"Heroes of Might and Magic® 3: Complete · 5 builds · last 2024-10-16"},
  {"name":"network.link-preview","ok":true,"detail":"Portal 2 on Steam · store.steampowered.com"},
  {"name":"network.metacritic","ok":true,"detail":"Portal 2: Metascore 95 · 3 platforms · mustPlay true"}],
 "counts":{"games":0,"sessions":0,"picks":0}}
```

---

## 💡 How effort, pleasure and duration are used

| Factor | Where it comes from | How it weighs |
| --- | --- | --- |
| **Effort** | rated in the library (1-5), perceived per session, suggested from HLTB duration | the draw rewards games close to the energy you declare; exceeding it is penalised, staying below barely is |
| **Pleasure** | declared (1-5) + **real satisfaction** from sessions | after 3 sessions the real rating replaces the declared one |
| **Duration** | HowLongToBeat (main story or all-styles average) | rewards games that fit the time you actually have, counting **time left** and not just total length |
| **Time already played** | tracked sessions + hours declared by hand | reduces time left, so a long but nearly finished game comes back into play |
| **Priority** | set by hand | pushes the games you care about, with a bonus for favourites |
| **Novelty** | date of the last session | brings back what has been sitting idle |

The **payback (pleasure/effort)** statistic ranks the games that give the most satisfaction per unit of effort, while
backlog estimates tell you **how many hours** separate you from the end (or from 100%).

---

## 🛠️ Development tools

### Automatic screenshots
The app supports a preview mode that fills a temporary database with demo data, opens a view and saves a screenshot:

```bash
npx electron . --user-data-dir=/tmp/bw --shoot=/tmp/bw/library.png --shoot-view=library
# views: library | picker | tournament | sessions | stats | settings | detail | detail-gog | detail-metacritic | detail-played | add-game | session-form
npx electron . --user-data-dir=/tmp/bw --shoot=/tmp/bw/bracket.png \
  --shoot-view=tournament --shoot-click="Generate bracket" --shoot-delay=2000
# several actions in sequence with "|": scroll, click and capture
npx electron . --user-data-dir=/tmp/bw --shoot=/tmp/bw/links.png \
  --shoot-view=detail --shoot-click="useful links|Preview" --shoot-delay=3000
```

The `--user-data-dir` flag matters: it keeps the preview separate from the real database (and from the single-instance
lock of a running app). The same applies to `npm run smoke`, which uses `node_modules/.cache/smoke-profile`.

### Icon
`npm run icon` regenerates `build/icon.png` (512×512) with no external dependencies.

---

## 📄 License

MIT — see [LICENSE](LICENSE). © 2026 AG Code.
