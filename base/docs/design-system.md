# Design system — tokens, SCSS, AntD theme

## Sources of truth

| File | Holds |
|------|-------|
| `src/styles/_tokens.scss` | Every colour, font, spacing, radius, shadow and layout value as a CSS custom property (`--color-primary`, `--spacing-4`, …). The **only** place raw literals are allowed. |
| `src/styles/theme.ts` | AntD `ThemeConfig`. Seeds (`colorPrimary`, `borderRadius`, …) mirror `_tokens.scss` because AntD derives its palette from real values, not CSS variables. |
| `src/styles/_breakpoints.scss` | `$breakpoints` map (`sm 480`, `md 768`, `lg 1024`, `xl 1440`), `breakpoint()`, z-index scale (`$z-content`, `$z-sticky`, `$z-nav`). |
| `src/styles/_mixins.scss` | `up()`, `below()`, `content-width`, `visually-hidden`, `focus-ring`, `touch-target`, `truncate`. |
| `src/styles/_core.scss` | Forwards breakpoints + mixins. **Injected into every stylesheet** by the bundler (`@use "core" as *`). |
| `src/styles/globals.scss` | Tokens + minimal reset + base typography. Imported once by the entry in `src/app/`. |

**Changing the brand colour or radius means editing both `_tokens.scss` and `theme.ts`.**

## Writing styles

- **CSS Modules only** for components: `<Name>.module.scss` next to `<Name>.tsx`, imported as `styles`. Class names are camelCase (`styles.emptyTitle`), and the root class is `.root`. Global classes are limited to `globals.scss`.
- **Colours** → `var(--color-*)`. No hex/rgb in components: a literal duplicates a token and won't follow a theme change.
- **Spacing, sizes, radius** → `var(--spacing-*)`, `var(--radius-*)`, `rem`. `px` only for 1–2px hairlines.
- **Responsive** → mobile-first with `@include up('md') { … }`. Mixins and `$z-*` are available without `@use`; never `@use` core partials in a module.
- **Only tokens that exist.** Check `_tokens.scss` before using one: an invented `var(--x)` silently renders as nothing. If a value will be reused and has no token, add the token.
- **AntD overrides** go through `theme.ts` (`components.<Name>`) first. If SCSS is unavoidable, scope it under the module's class with `:global(.ant-…)`, never globally, and avoid `!important`.
- No `style={{ }}` unless the value is genuinely dynamic (a computed width, a live transform).
- Colour maths uses `@use "sass:color"` inside the module.

## Accessibility baseline

- Text contrast ≥ 4.5:1 against its surface; check new token pairs.
- Interactive custom elements get `focus-ring` on `:focus-visible` and `touch-target` on mobile.
- No horizontal scroll at 375px.
