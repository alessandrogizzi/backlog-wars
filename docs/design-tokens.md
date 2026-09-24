# Design tokens

The whole look of the renderer lives in one place: `src/renderer/src/styles/`. Before this change every colour,
padding and radius was a literal inside a 2 250-line `styles.css`; now the values are tokens and the components only
point at them.

```
src/renderer/src/styles.css          entry point, imports the three layers in order
src/renderer/src/styles/tokens.css   the values (primitives + semantic tokens + themes)
src/renderer/src/styles/base.css     reset, document defaults, focus, scrollbars, utilities
src/renderer/src/styles/components.css layout, components, views
scripts/check-design-tokens.mjs      guard: unknown tokens and raw values fail the build
```

## The three layers

| Layer | What it holds | How to name it | Who reads it |
| --- | --- | --- | --- |
| **1. Primitives** | raw values: `--ink-800`, `--violet-500`, `--red-400` | the name describes the value | only the semantic layer |
| **2. Semantic** | roles: `--color-surface`, `--color-text-muted`, `--space-6`, `--radius-lg`, `--shadow-md`, `--duration-fast` | the name describes the use | `base.css`, `components.css` |
| **3. Themes** | a block that overrides the semantic layer | `[data-theme='…']` | nothing else |

Two rules follow from the table:

- a component **never** uses a primitive directly (`background: var(--violet-500)` is a bug);
- a component **never** hardcodes a value (`padding: 9px` is a bug): if the right token is missing, add the token to
  `tokens.css` first.

Keeping the two layers apart is what makes a second theme cheap: dark is just the semantic layer as shipped, and a
light theme is a block that reassigns the same names. No component rule has to change.

## The scales

**Spacing** — `--space-N` is exactly `N × 2px`, so the scale is predictable and easy to reason about:

| Token | Value | Token | Value | Token | Value |
| --- | --- | --- | --- | --- | --- |
| `--space-1` | 2px | `--space-8` | 16px | `--space-20` | 40px |
| `--space-2` | 4px | `--space-10` | 20px | `--space-24` | 48px |
| `--space-3` | 6px | `--space-12` | 24px | `--space-30` | 60px |
| `--space-4` | 8px | `--space-14` | 28px | `--space-32` | 64px |
| `--space-6` | 12px | `--space-16` | 32px | | |

The **approved rhythm** — the steps new layouts should prefer — is `--space-2/4/6/8/12/16`. The odd values that the old
stylesheet used (9px, 11px, 13px…) were snapped onto the grid, ties rounding up, so control paddings now land on even
steps.

**Typography** — `--font-size-1` … `--font-size-15` (10px → 40px), `--font-weight-regular/semibold/bold/extrabold`,
`--line-height-none/tight/snug/normal/relaxed`, `--tracking-tight/…/brand`. The old half-pixel sizes (10.5, 11.5, 13.5)
were folded onto the nearest step.

**Radii** — `--radius-xs` (4px) `sm` (6) `md` (8) `lg` (10) `xl` (14) `2xl` (20) `pill` (999) `circle` (50%).

**Elevation** — `--shadow-sm/md/lg/xl` for depth, `--glow-accent`, `--glow-accent-ring`, `--glow-gold`,
`--glow-gold-text`, `--filter-brand-glow` for the neon accents, `--focus-ring`, `--focus-ring-soft`.

**Motion** — `--duration-instant/fast/base/slow/slower/pulse` and
`--ease-standard/out/in-out/spring`, plus `--transition-control`, the standard control transition. Every animation in
the app is disabled by the `prefers-reduced-motion` block in `base.css`.

**Colour** — semantic names only: `--color-canvas`, `--color-surface(-raised/-active/-sunken/-veil)`,
`--color-border(-soft/-accent/…)`, `--color-text(-secondary/-muted)`, `--color-accent`, `--color-highlight`,
`--color-rose`, `--color-gold`, `--color-danger`, `--color-success`, `--color-info`, plus alpha tints
(`--color-accent-faint`, `--color-gold-fill`, `--color-track`, …). Translucent variants are built with `color-mix()`
instead of repeated `rgba()` triples, so they follow the theme automatically.

**Layout and stacking** — `--layout-sidebar-width`, `--layout-content-max`, `--layout-modal-sm/md/lg`,
`--control-height-sm/md/lg`, `--border-width`, `--z-base/sticky/overlay/modal/toast`.

## Graphic improvements in this pass

The token migration was also the moment to fix the inconsistencies it exposed:

- **One rhythm**: every card grid uses a 16px gutter (`--space-8`), views use a 16px gap, cards use a 20px inner
  padding and the modal header/body/footer share a 20px gutter. The main column is 24/32/60 instead of 26/30/60.
- **Controls line up**: buttons and fields share `--control-height-md`, so a form row is pixel-aligned instead of
  drifting by a pixel or two.
- **The Metascore badge on a cover is always readable**: it sits on a near-opaque, blur-backed plate
  (`--color-scrim-strong`) whose border and digits take the score band colour, instead of a translucent fill that a
  bright cover used to swallow.
- **Keyboard focus is visible**: `base.css` gives every interactive element an accent ring on `:focus-visible`, and the
  component layer does the same for clickable cards, chips, segments, rows and rating dots. Pointer interaction is
  unchanged.
- **Reduced motion is honoured**: `prefers-reduced-motion: reduce` turns transitions and looping animations off.
- **Depth is consistent**: recessed rows inside cards all use the same `--color-surface-veil` instead of five
  near-identical transparencies.
- **Data does not jitter**: scores, stats, durations and session numbers use tabular figures.
- **A card shows progress, not two numbers**: the `.playtime` meter puts the time played against the HowLongToBeat
  estimate with a bar and a percentage, replacing the Metascore preview that duplicated the badge on the cover.
- **Native widgets match**: `color-scheme: dark` on `:root` keeps scrollbars and form controls dark.

## Adding a token

Suppose the app needs a warning surface. In `tokens.css`:

```css
/* 1. primitive, only if the value is genuinely new */
--amber-600: #d97706;

/* 2. semantic token: the name says the role, not the value */
--color-surface-warning: var(--amber-600);
--color-border-warning: color-mix(in srgb, var(--amber-600) 50%, transparent);
```

3. use only the semantic token in the component (`background: var(--color-surface-warning)`);
4. run `npm run lint:tokens` (it runs inside `npm run verify`).

## Adding a theme

Override the semantic layer and toggle the attribute on `<html>`:

```css
[data-theme='light'] {
  --color-canvas: var(--ink-100);
  --color-surface: var(--ink-200);
  --color-text: var(--ink-950);
  --color-border: var(--ink-400);
  color-scheme: light;
}
```

Nothing else has to change: gradients, tints and glows are all derived from the semantic tokens.

## What the guard refuses

`npm run lint:tokens` fails on:

- a `var(--token)` that is not declared in `tokens.css` (typo or removed token);
- a raw `#hex`, `rgba()`, `padding/margin/gap` in px, a `font-size` in px/em/rem or a `border-radius` in px inside
  `base.css` or `components.css`.

It also *reports* (without failing) tokens nothing uses any more and custom properties declared outside `tokens.css`.
Media-query breakpoints are exempt: custom properties cannot be used inside a media query condition.
