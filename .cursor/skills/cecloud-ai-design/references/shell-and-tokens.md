# App shell and theme tokens (CeCloud / Arco + Tailwind)

Use for **layout chrome**, **semantic backgrounds and text**, and **Arco variable parity** in app UI (any page type).

## Document root and shell

### Minimum width (desktop shell)

When the shell uses **`body.min-w-1440`** (or equivalent wrapper):

```css
body.min-w-1440 {
  min-width: 1440px;
  overflow-x: auto;
}
```

Below ~1440px viewport width, preserve layout width and allow **horizontal scroll** instead of compressing the top chrome.

### Full-height root

```css
#root,
body,
html {
  height: 100%;
  margin: 0;
  padding: 0;
}
```

Keep **no default root gutter** unless a layout wrapper adds it.

## Layout CSS variables

| Variable | Value | Usage |
|----------|-------|--------|
| `--top-header-height` | `50px` | Top bar / header band |
| `--sider-menu-width` | `200px` | Side navigation width |
| `--content-padding` | `20px` | Main content inset from shell |

## Semantic colors (Arco — `body` theme)

| Token | Value |
|-------|--------|
| `--color-white` | `#fff` |
| `--color-black` | `#000` |
| `--color-border` | `rgb(var(--gray-3))` |
| `--color-bg-popup` | `var(--color-bg-5)` |
| `--color-bg-1` | `#fff` |
| `--color-bg-2` | `#f8fafd` |
| `--color-bg-3` | `#f5f9ff` |
| `--color-bg-4` | `#f0f6fe` |
| `--color-bg-5` | `#f5f9ff` |
| `--color-bg-white` | `#fff` |
| `--color-text-1` | `#0f172a` |
| `--color-text-2` | `#1e293b` |
| `--color-text-3` | `#334155` |
| `--color-text-4` | `#6e7b8d` |
| `--color-fill-1` | `#cbd5e1` |
| `--color-fill-2` | `#e2e8f0` |
| `--color-fill-3` | `#e7ecf0` |
| `--color-fill-4` | `#fff` |
| `--color-border-1` | `#cbd5e1` |
| `--color-border-2` | `#e2e8f0` |
| `--color-border-3` | `#fff` |
| `--color-border-4` | `var(--color-neutral-6)` |

**Neutrals** `--color-neutral-1` … `--color-neutral-10` use `rgb(var(--gray-N))` from Arco’s gray ramp.

## Typography (`html` / `body`)

**`html`**

- `font-size`: **`16px`** (rem root)
- `font-family`: `Source Han Sans, Inter, -apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, noto sans, Microsoft YaHei, Helvetica Neue, Helvetica, Arial, sans-serif`

**`body`**

- `font-family`: `-apple-system, BlinkMacSystemFont, PingFang SC, Source Han Sans SC, Helvetica Neue, Helvetica, Roboto, Arial, Hiragino Sans GB, Segoe UI, Microsoft YaHei, sans-serif`
- `line-height`: **`1.5`** on shared `body, html` rules

**Dense UI**: Arco often applies **`font-size: 12px`** on `body` for dropdown/menu context; **`.arco-card-size-default`** also uses **`12px`** for compact in-card UI. Treat **`html` 16px** as **rem baseline**; use **12–14px** for table, menu, and compact card metadata unless a module specifies otherwise.

## Charts

`body` defines **`--color-data-1` … `--color-data-20`** (and parallel **`--data-*`**) for dashboard series—use for charts, not for primary marketing chrome.

## Tailwind alignment

Preflight uses **`box-sizing: border-box`** and default border color **`#e5e7eb`**. Ring tokens may use **`#e1effe80`**—keep rings in the same blue family as the product primary when adding utilities.

## Relationship to `SKILL.md` marketing palette

`SKILL.md` carries the **product** accent story (e.g. **`#2773ff`**). This file’s **`--color-bg-*` / `--color-text-*`** are the **implemented app theme**—use **these tokens for app surfaces and type hierarchy**; use **`SKILL.md`** for hero/marketing accents where they are not merged into the theme.
