# List page — management table (列表页)

Specification for **CeCloud-style list / management views** (example: **智能体**): page title, **toolbar** (search + refresh + primary create), **Arco Table** body with **status** and **row actions**, **pagination**.

Use with **[shell-and-tokens.md](../shell-and-tokens.md)** and the root **`SKILL.md`**. **Side navigation** and **name-column avatar** align with **[plaza-page.md](plaza-page.md)** when the shell is shared.

**Search field** (height **32px**, inner radius **4px**, etc.) matches **plaza-page** — treat as **global**; do not fork list-only values unless product requires it.

Sections **§1–§10** below are aligned with **Arco + Tailwind** rules from the **智能体** list page Styles export (including **`.search-table_wrapper__…`** and pagination).

**Arco naming**: **`.arco-table-td`** = **one body cell**（某一列、某一行的数据格，不是整行）；**`.arco-table-th`** = **表头格**；**`.arco-table-tr`** = **一行**。

---

## 1. Main title (主标题)

Tailwind-style utilities on the title node (equivalent CSS):

| Property | Value | Utility / note |
|----------|--------|----------------|
| `color` | **`var(--color-text-1)`** | e.g. **`text-[var(--color-text-1)]`** |
| `font-size` | **`20px`** | **`text-[20px]`** |
| `font-weight` | **`500`** | **`.font-medium`** |
| `line-height` | **`2rem`** (**32px**) | **`.leading-8`** |
| `margin-bottom` | **`1.25rem`** (**20px**) | **`.mb-5`** |

**Nexus / Skills 管理列表**：主标题使用 **shell 正文字体栈**（见 **shell-and-tokens.md** `body`），**不要**套用广场/营销用的 **`skills-display` 衬线**（如 Songti），以免与 **智能体** 等管理列表标题气质不一致。

---

## 2. Toolbar row (标题下首行)

Row that holds **search (left)** and **buttons (right)**:

| Property | Value | Utility |
|----------|--------|---------|
| `display` | **`flex`** | **`.flex`** |
| `align-items` | **`center`** | **`.items-center`** |
| `justify-content` | **`space-between`** | **`.justify-between`** |
| `flex-shrink` | **`0`** | **`.flex-shrink-0`** |
| `margin-bottom` | **`1rem`** (**16px**) | **`.mb-4`** |

---

## 3. Refresh button (弱视觉 — outline icon-only)

**`arco-btn` + `arco-btn-outline` + `arco-btn-size-default` + `arco-btn-icon-only`**

| Property | Value |
|----------|--------|
| `width` / `height` | **`32px`** × **`32px`** |
| `padding` | **`0`** |
| `border-radius` | **`4px`** |
| `border` | **`1px solid`** **`var(--color-border-1)`** / **`#cbd5e1`** |
| `background-color` | **`#fff`** (see also `background-color: initial` on outline—effective face **white**) |
| `color` | **`var(--color-text-2)`** / **`var(--color-text-3)`** / **`#334155`** (icon + affordance; pick **one** token tier per theme) |
| Icon size | **`font-size: 16px`** on icon-only default |
| Label `font-size` (if any) | Arco default size uses **`12px`** on **`height: 32px`** row (**`padding: 0 16px`** for text buttons; icon-only uses **`padding: 0`**) |
| `font-weight` | **`600`** on **`.arco-btn`** |
| `line-height` | **`1.5715`** |
| `transition` | **`all 0.1s linear`** |

**`element.style` overlay** (when applied): **`border-color: var(--color-border-1)`**, **`background-color: rgb(255,255,255)`**, **`color: var(--color-text-2)`**.

---

## 4. Create button (强视觉 — primary)

**`arco-btn-primary` + `arco-btn-size-default`**

| Property | Value |
|----------|--------|
| `background-color` | **`rgb(var(--primary-6))`** |
| `color` | **`#fff`** / **`var(--color-white)`** |
| `border` | **`1px solid transparent`** |
| `height` | **`32px`** |
| `border-radius` | **`4px`** |
| `font-size` | **`12px`** (default size block; ignore stray **`14px`** duplicate if cascade resolves to **12px**) |
| `padding` | **`0 16px`** (text + split; icon-only variant uses **`0`**) |
| Wrapper | **`display: flex`**, **`align-items: center`** for split / addon layout |

Shared **`.arco-btn`**: **`font-weight: 600`**, **`line-height: 1.5715`**, **`transition: all 0.1s linear`**, **`white-space: nowrap`**.

---

## 5. List / table layout wrappers

- **Column stack**: **`display: flex`**, **`flex-direction: column`** (`.flex-col`).
- **Scroll flex child**: **`flex: 1 1`**, **`min-height: 0`** (`.flex-1` + `.min-h-0`) so the table scrolls inside the shell.
- **Motion**: **`transition-property: all`**, duration **~150ms** (`.transition-all`) and/or **`.duration-300`** where used.

---

## 6. Table header (`thead`)

**`.arco-table thead .arco-table-tr`**

- Source shows **`height: 40px`** and **`height: 36px`** on the same selector pattern — **implement `36px`** if your bundle matches the **later** rule; otherwise match **Arco Table** token for your version (**40px** is common).

**`th` / `tr` reset**: **`margin: 0`**, **`padding: 0`** on the reset block you captured.

---

## 7. Table body cells (`.arco-table-td`)

**Project wrapper** **`.search-table_wrapper__… .arco-table .arco-table-td`** and **`.arco-table-th-item`**:

| Property | Value |
|----------|--------|
| `padding-left` / `padding-right` | **`16px`** each |

**Default `.arco-table-td`** (body): stylesheet contains **stacked** rules — **`font-size: 14px`** + **`padding: 12px`** in one block, and **`font-size: 12px`** + **`padding: 10px 12px`** in another. **Horizontal** padding is tightened to **`16px`** left/right by **`.search-table_wrapper__…`** on **`.arco-table-td`** and **`.arco-table-th-item`**. Pick **one** body policy per product (**12px** dense vs **14px** readable); the **later** rule in the built CSS usually wins when specificity is equal.

| Property | Value |
|----------|--------|
| `color` | **`#1e293b`** / **`var(--color-text-2)`** |
| `line-height` | **`1.5715`** |
| `text-align` | **`left`** |
| `background-color` | **`#fff`** / **`var(--color-bg-1)`** |
| `border-bottom` | **`1px solid`** **`#e2e8f0`** / **`var(--color-border-2)`** |
| `box-sizing` | **`border-box`** |

**Striped rows**: **`.arco-table-stripe .arco-table-tr:nth-child(2n) .arco-table-td`** → **`background-color: #f5f9ff`**.

**Row hover** (`.arco-table-hover`): **non-empty** rows → **`.arco-table-td`** hover overlay uses **`background-color: rgb(var(--primary-1))`** (including fixed-left/right `:before` rules in Arco).

---

## 8. Row actions — `.arco-link`

| Property | Value |
|----------|--------|
| `color` | **`rgb(var(--link-6))`** |
| `font-size` | **`12px`** (stylesheet also shows **`14px`** on another **`.arco-link`** block — pick **one** per row density) |
| `font-weight` | **`600`** (default Arco link weight); a duplicate block shows **`400`** — use **400** only if design explicitly wants lighter table links |
| `line-height` | **`1.5715`** |
| `padding` | **`1px 0`** |
| `display` | **`inline-block`**；与图标并排时用 **`inline-flex`** + **`align-items: center`**。**Skills 管理列表「操作」列不使用图标，见 §8.1** |
| `border-radius` | **`var(--border-radius-small)`** |
| `text-decoration` | **`none`** |
| `transition` | **`all 0.1s linear`** |

### 8.1 Nexus — Skills 管理列表「操作」列（纯文字）

适用于 **skills 管理** 表格行内的 **导出、更新 / 发布、删除、下架** 等链接式操作：

- **只展示中文文案**，**不要**在操作项前或操作项内放置图标（与「发布状态」等 Tag 上的图标区分，避免操作列拥挤）。
- **链接色**对齐根 **`SKILL.md` 主色**：**`#2773ff`**；**hover** 文案 **`#2f5fbf`**、浅底 **`#f0f6fe`**（与广场主按钮 hover **`#1f66f0`** 区分：行内操作用浅底 + 次级蓝字，不必实心主按钮）。**禁用**用 **`#cbd5e1`**。
- 字号、字重仍对齐 **§8**（约 **12px**、**font-weight 600**）；布局用 **`inline` / `inline-flex`** 即可，**无需**为图标预留 **`gap`**。
- **Skill 详情**顶栏若复用同一组操作（导出、更新 / 发布、下架、删除），与列表保持同一套信息密度时，**同样不设图标**。
- **「导入 Skills」** 等列表页主操作：按 **§4 Create button（强视觉）** — **`32px` 高**、**`4px` 圆角**（**勿用**整段 **`rounded-full` 胶囊**，那是营销/Hero 主按钮形态，与列表工具条不一致）、**`12px` 字**、**`font-weight: 600`**、**水平 `padding: 0 16px`**、**`border: 1px solid transparent`**；填色 **`#2773ff`**、白字，**hover `#1f66f0`**（色值与根 **`SKILL.md` Primary** 一致）。

---

## 9. Pagination — total text (总条数)

**`.arco-pagination-total-text`** (and table **`.arco-pagination-size-default`** context):

| Property | Value |
|----------|--------|
| `color` | **`#1e293b`** / **`var(--color-text-2)`** / **`var(--color-text-1)`** (sources overlap — use **`text-2`** for secondary chrome) |
| `font-size` | **`12px`** |
| `line-height` | **`24px`** |
| `height` | **`100%`** |
| `display` | **`inline-block`**; parent may use **`display: flex`**, **`align-items: center`** |

---

## 10. Pagination — page numbers（翻页器 / 具体页码）

**`.arco-pagination-list`**: **`display: inline-block`**, **`list-style: none`**, **`margin` / `padding: 0`**.

**`.arco-pagination-item`** (default):

| Property | Value |
|----------|--------|
| `min-width` / `height` | **`24px`** |
| `line-height` | **`24px`** |
| `font-size` | **`12px`** |
| `font-weight` | **`600`** |
| `color` | **`#334155`** / **`var(--color-text-3)`** |
| `background-color` | **`transparent`** / **`initial`** |
| `border` | **`0 solid transparent`** |
| `border-radius` | **`4px`** |
| `text-align` | **`center`** |
| `cursor` | **`pointer`** |
| `margin-right` | **`4px`** on **`.arco-pagination-item:not(:last-child)`**; list items **`margin-left: 0`** per **`ul.arco-pagination-list`** rule |

**`.arco-pagination-item-active`**:

| Property | Value |
|----------|--------|
| `color` | **`rgb(var(--primary-6))`** |
| `background-color` | **`rgb(var(--primary-1))`** or **`rgb(var(--primary-2))`** (sources show both — **`primary-2`** is slightly stronger fill) |
| `border-color` | **`transparent`** |
| `transition` | **`color 0.2s linear, background-color 0.2s linear`** |

---

## 11. List items (名称 / 类型 / 状态 / 描述 / 时间)

Unchanged from the **visual product spec** (screenshot-derived); numeric **table chrome** is in **§6–§8** above.

- **名称**: **48×8** purple tile (or primary blue) + **bold** title — see **plaza-page** lead icon.
- **类型**: small primary-tint icon + **`var(--color-text-2)`** label.
- **描述**: **`var(--color-text-3)`** / **`--color-text-4`**, ellipsis as needed.
- **创建人 / 更新时间**: **`var(--color-text-2)`**; ISO-like datetime string.

### 11.1 Status — Arco Tag（列表 / 详情内联状态）

Use **`.arco-tag`** sizing and **checked** fills (Tailwind port is fine; keep **12px / 20px height / 2px radius**).

**Base `.arco-tag`**

| Property | Value |
|----------|--------|
| `display` | **`inline-flex`**, **`align-items: center`** |
| `height` | **`20px`** |
| `padding` | **`0 4px`** |
| `border` | **`1px solid transparent`** |
| `border-radius` | **`2px`** |
| `font-size` | **`12px`** |
| `font-weight` | **`400`** |
| `line-height` | **`18px`** |
| `color` | **`#1e293b`** / **`var(--color-text-2)`** (default; overridden when checked) |

**Published — `.arco-tag-checked.arco-tag-green`**

| Property | Value |
|----------|--------|
| `background-color` | **`rgb(var(--green-1))`** → **`#e8ffea`** (Tailwind port) |
| `border` | **`1px solid transparent`** |
| `color` | **`rgb(var(--green-6))`** → **`#009a29`** (Tailwind port) |

**Other states (草稿 / 审核中 / 审核失败 …) — `.arco-tag-checked.arco-tag-gray`**

| Property | Value |
|----------|--------|
| `background-color` | **`rgb(var(--gray-2))`** → **`#f2f3f5`** |
| `border` | **`1px solid transparent`** |
| `color` | **`rgb(var(--gray-6))`** → **`#86909c`** |

Optional icon + label: **`gap: 4px`**, icon box **~12px** glyph inside the same **20px** tag height.

---

## 12. Toolbar layout (vertical stack)

**Title** (**§1**) → **toolbar row** (**§2**: search + refresh + create) → **table block** (**§5–§7**) → **pagination** (**§9–§10**).
