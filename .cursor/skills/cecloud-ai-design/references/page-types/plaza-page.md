# Plaza page — application square (应用广场)

Specification for **CeCloud-style application / capability hubs**: page-level gradient title, top search and **capsule filter tabs**, **three-column card grid**, **Arco Card** tiles, and **`.aa-sider-menu`** side navigation.

Apply together with the root **`SKILL.md`** (principles + marketing palette) and **[shell-and-tokens.md](../shell-and-tokens.md)** (shell, Arco tokens, typography baseline).

## Page pattern

- **No full-bleed hero** on this pattern: lead with **gradient headline**, **`.app-filter-nav__top`** (title area + search), **two rows of capsule tabs**, then the **card grid**.
- Optional elsewhere: other plazas may use a large hero; keep tokens from `SKILL.md` if you add one.

## Plaza shell — full-column gray-blue canvas

**Goal:** The **entire main column** reads as one **灰蓝** surface—including the **padding gutter** next to the sidebar and above/below the scroll content—not a white “frame” around a flat gray block in the middle.

**Do**

1. **Shell fill (behind `padding`)** — paint the **layout row** and **`main`** that wrap the plaza route with the same base:

   | Token (doc) | Hex | Role |
   |---------------|-----|------|
   | `--plaza-shelf` | **`#e8f0fb`** | Default background for the **whole** content column (including areas revealed by `padding`). |

2. **Scroll body — soft vertical tint** — on the **scrollable inner wrapper** (e.g. the div with `flex-1` + `p-6`), add a **very light** top-to-bottom gradient so the center is not a **dead flat gray** slab:

   ```css
   background: linear-gradient(
     180deg,
     #f2f7fd 0%,
     #e8f0fb 38%,
     #e4edf8 100%
   );
   ```

   Keep contrast **low**; this is atmosphere, not a hero band.

3. **Route-level page root** — the plaza **page component** should use **`background: transparent`** (or omit background) so the **layout** gradient/shelf shows through. **Do not** stack an opaque **`#f8f9fb`** on top of the shelf unless you intentionally want a flatter, grayer interior.

4. **Scope** — apply the shelf + gradient only to **plaza hub** routes (e.g. **`/skills-hub`**, **`/skills`** marketplace). **Do not** attach the same rule to **admin / management** siblings on the same app shell (e.g. **`/skills-management`**) if those screens should keep the default **`slate-50`** (or product default) chrome.

**Don’t**

- **Don’t** use a **neutral gray** (`#f8f9fb` alone) for both shell and inner opaque layer on plaza—it reads as “中间一块纯灰”. Prefer the **slightly blue-tinted** shelf **`#e8f0fb`** family + optional **transparent** inner root + **subtle** gradient on the scroll wrapper only.

**Optional utilities (Nexus reference)**

- Content band class **`.skills-plaza-canvas`**: `max-width: 1440px`, `margin-inline: auto`, horizontal padding; expose **`--cc-surface-tint: #e8f0fb`** (or map to **`--plaza-shelf`**) for child components that need to match the shell.

**Relationship to `SKILL.md`**

- **`#f8f9fb`** remains the generic **“page / airy card”** token for many screens.
- **Plaza** may override the **main column** with **`#e8f0fb` + gradient** as above so the **whole** plaza (including gutters) feels **灰蓝** and cohesive.

## Main list canvas — `.app-list-card`

- **`padding-top: 12px–20px`** (tighter top when pairing with compact **`.app-filter-nav__top`**), **`padding-left: 8px`**
- **`min-width: 1060px`**, **`max-width: 1440px`**, **`min-height: 1000px`**
- **`margin: 0 auto`** (center the content band)

## Card — `.arco-card` (root)

- **Background**: **`#fff`** (equivalent to **`var(--color-fill-4)`** in theme)
- **`border-radius: 4px`**
- **`position: relative`**
- **`transition: box-shadow 0.2s linear`** (hover / elevation can animate `box-shadow`; resting shadow may be none or very soft—match Arco default if unspecified)
- **`.arco-card-size-default`**: **`font-size: 12px`** for dense in-card UI (metadata, small labels)

## Card body — `.arco-card-body`

- **Padding**: **`20px`** (`.arco-card-size-default .arco-card-body`)
- **Text**: **`color: var(--color-text-2)`** / **`#1e293b`**
- In a **grid cell**, an inner wrapper may use **`padding: 0`** and **`width: 100%`** so the **20px** padding comes from the card body rule above—keep grid alignment flush to the card padding box.

## Card grid (Tailwind)

- **`.grid`** + **`.grid-cols-3`**: `grid-template-columns: repeat(3, minmax(0, 1fr))`
- **`.gap-4`**: **`gap: 1rem`** (16px with default Tailwind spacing scale)
- **`.mt-0`**: **`margin-top: 0`**

## Top filter row — `.app-filter-nav__top`

- **`display: flex`**, **`flex-wrap: nowrap`**, **`justify-content: space-between`**

## Page headline — `.gradient-text`

- **`background-image: linear-gradient(to right, #3CC6FF, #3857FF)`**
- **`-webkit-background-clip: text`**, **`background-clip: text`**
- **`-webkit-text-fill-color: transparent`**, **`color: transparent`**
- Wrap with **`.inline-block`** on the title container if needed for clipping.
- Set **`font-size`** and **`font-weight`** to match the reference hierarchy (large display title—typically bold, significantly above body).

## Search — Arco Input

- **`.arco-input-inner-wrapper`**: **`border-radius: 4px`**
- **Default height**: **`32px`** (`.arco-input-inner-wrapper-default`)

## Filter tabs — `.app-filter-nav` capsule (Arco Tabs)

**Why the white pill breaks in code:** Arco’s **default capsule** styles paint the **active** tab as **`rgb(var(--primary-2))`** or **`rgb(var(--primary-6))`** with **`!important`** on shorter selectors such as **`.arco-tabs-header-nav-capsule .arco-tabs-header-title-active`**. CeCloud’s **white pill** only appears when **CeCloud-specific** rules win—those are **scoped under `.app-filter-nav`** with **longer selectors** and **`#fff !important`**.

**Requirements**

1. Wrap the filter **`Tabs`** in a parent that has class **`app-filter-nav`** (same DOM path as reference).
2. Ship **global overrides** (or theme CSS **after** Arco) that include the **full** selectors below—do not rely on the short **`.arco-tabs-header-title-active`** rule alone.

**Active tab — white pill (authoritative)**

Use this **exact** compound selector (or equivalent specificity **≥** this chain):

```text
.app-filter-nav .arco-tabs.arco-tabs-capsule .arco-tabs-header-nav-capsule .arco-tabs-header-title.arco-tabs-header-title-active
```

| Property | Value |
|----------|--------|
| `border-radius` | **`100px`** |
| `background-color` | **`#fff`** with **`!important`** |

**Tab titles under `.app-filter-nav` (all titles in the row)**

```text
.app-filter-nav .arco-tabs.arco-tabs-capsule .arco-tabs-header-nav-capsule .arco-tabs-header-title
```

| Property | Value |
|----------|--------|
| `border` | **`none`** |
| `padding` | **`0 16px`** |
| `line-height` | **`32px`** |
| `font-size` | **`14px`** |
| `margin-right` | **`12px`** |

These **override** Arco’s capsule defaults for this row, e.g. **`font-size: 12px`**, **`line-height: 30px`** on **`.arco-tabs-header-nav-capsule.arco-tabs-header-size-default .arco-tabs-header-title`**, and the **segmented** look with **`border: 1px solid var(--color-border-2)`**, **`margin-right: 1px`**, **`border-radius: 0`** on **`.arco-tabs.arco-tabs-capsule .arco-tabs-header-title`** (non-`app-filter-nav`).

**First tab — left cap of capsule group** (Arco base; keep if you use the same DOM):

```text
.arco-tabs.arco-tabs-capsule .arco-tabs-header-nav-capsule .arco-tabs-header-title:first-of-type
```

| Property | Value |
|----------|--------|
| `border-top-left-radius` / `border-bottom-left-radius` | **`4px`** |

**Inactive tabs (under `.app-filter-nav`)**: use the **shared** **`.app-filter-nav … .arco-tabs-header-title`** row above (**transparent** background, **no** segment border); active adds only the **white pill** rule. Default **label** color stays **`var(--color-text-2)`** / **`#1e293b`** from **`.arco-tabs-header-title`**; **active** label may use **`rgb(var(--primary-6))`** / **`font-weight: 500`** from Arco’s **`.arco-tabs-header-title-active`** unless you override for contrast on white.

## Card header row

- **`.arco-space`**: **`display: inline-flex`**
- **`.arco-space-align-start`**: **`align-items: flex-start`**

## Card title — `.arco-typography-h6` / `h6.arco-typography`

- **`font-size: 16px`**, **`line-height: 1.5`**, **`margin: 0`**
- Use **font-weight 500–600** for a clear card title hierarchy unless the design system pins a single value.

## Card description — `.app-card .app-card__content .description`

- **`font-size: 14px`**, **`line-height: 22px`**, **`min-height: 44px`**, **`margin-bottom: 0`**
- Prefer **secondary text color** (**`var(--color-text-3)`** or **`var(--color-text-4)`**) for muted body under the title.

## Card footer (stats / favorite / share)

- **Space between icon and numeric count**: **`margin-left: 4px`** on the count (relative to the icon).

## Card tags — Arco Tag gray checked

- **`.arco-tag-checked.arco-tag-gray`**: **`background-color: rgb(var(--gray-2))`**, **`border: 1px solid transparent`**, **`color: rgb(var(--gray-6))`**

## Card lead icon / avatar tile

**Reference implementation (应用广场)** — **purple** tile:

- **`width: 48px`**, **`height: 48px`**, **`font-size: 24px`**, **`background-color: rgb(137, 133, 255)`**, **`border-radius: 8px`**, light **on-tile** glyph color (**`#fff`**).

**Other plazas**: keep the **48×8 rounded tile** pattern but swap fill to **primary blue** from **`SKILL.md`** (e.g. **`#2773ff`**) or **`--color-primary-light-*`** for brand consistency.

**Arco `Avatar` defaults** (when no inline override): ~**40×40`**, **`font-size: 16px`**, **`background-color: #cbd5e1`** / **`var(--color-fill-1)`**, **`color: #fff`**, square radius **4px**—override when using the 48px tile spec above.

## Side navigation — `.aa-sider-menu`

**Menu group**

- **`.arco-menu-inner .arco-menu-group`**: **`display: flex`**, **`flex-direction: column`**, **`row-gap: 4px`**

**Menu item inner**

- **`.arco-menu-item-inner`**: **`display: flex`**, **`align-items: center`**, **`height: 100%`**
- **`.arco-menu-vertical` …**: **`overflow: hidden`**, **`text-overflow: ellipsis`**, **`white-space: nowrap`**, **`width: 100%`**

**Default item** (`.aa-sider-menu … .arco-menu-item`)

- **`height: 38px`**, **`padding: 8px`**, **`display: flex`**, **`align-items: center`**, **`color: #23293b`**

**Selected + hover** (combined `.aa-sider-menu` rule)

- **`background-color: #fff`**, **`border-radius: 4px`**, **`color: #184ff2`**

**Selected only**

- **`border: 1px solid #ebeef5`**

**Hover only**

- **`border: none`**

When **Arco `arco-menu-light`** selected/hover tokens (`--primary-2`, `--primary-6`, etc.) also apply, **prefer the visual outcome above** for this shell (white selected surface, **`#184ff2`** label).
