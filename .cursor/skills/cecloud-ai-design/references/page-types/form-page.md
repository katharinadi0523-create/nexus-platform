# Form page — multi-section create / config (表单页)

CeCloud-style **long forms**: **sticky header** (title + divider), **scrollable body** (modules + **`.fromstyle`** Arco Form), **sticky footer** (确定 / 取消). Values below match the **Styles export** for this product; use **[shell-and-tokens.md](../shell-and-tokens.md)** and **`SKILL.md`**. Toolbar **outline / primary** patterns also appear in **[list-page.md](list-page.md)** — this form’s **footer uses `size="large"`** (**36px** height), not the list toolbar’s default **32px**.

---

## Sticky shell (吸顶区域全局)

| Property | Value |
|----------|--------|
| **Padding** | **`p-6`** → **`padding: 1.5rem`** (**24px**) on the sticky wrapper |
| **Layout** | **`display: flex`**, **`flex-direction: column`**, **`width: 100%`** |

---

## Page title (吸顶标题)

| Property | Value |
|----------|--------|
| `color` | **`var(--color-text-1)`** (e.g. **`text-[var(--color-text-1)]`**) |
| `font-size` | **`1.25rem`** (**20px**, **`text-xl`**) with bundled **`line-height: 1.75rem`** |
| `line-height` | Also **`30px`** utility (**`leading-[30px]`**) when applied on the same node — **prefer one** consistent line box per build (**30px** matches compact headers). |
| `font-weight` | **`600`** (**`font-semibold`**) |

---

## Title divider (吸顶与内容分割线)

| Property | Value |
|----------|--------|
| `height` | **`1px`** (**`h-px`**) |
| `width` | **`100%`** |
| `background-color` | **`var(--color-border-2)`** (**`bg-[var(--color-border-2)]`**) |

---

## Module title (模块名称)

| Property | Value |
|----------|--------|
| `color` | **`#000`** (**`text-[#000]`** / **`text-[#000000]`**) |
| `font-size` | **`16px`** |
| `line-height` | **`24px`** |
| `font-weight` | **`600`** |
| `margin-bottom` | **`1rem`** (**16px**, **`mb-4`**) |

---

## Field labels — **`.fromstyle`** + Arco Form

| Selector | Spec |
|----------|------|
| **`.fromstyle .arco-form-label-item > label`** | **`width: 136px`**, **`font-size: 14px`**, **`display: flex`**, **`align-items: center`**, **`justify-content: flex-end`** |
| **`.fromstyle label`** (broader) | **`width: 200px`**, **`font-size: 14px`** — if both apply, **prefer the inner `136px`** rule for **label-item** alignment unless your DOM only hits the **`200px`** rule. |
| **`.arco-form-label-item > label`** | **`color: var(--color-text-2)`** or **`#1e293b`**; duplicate block may set **`font-size: 12px`**, **`white-space: normal`** — **14px** is the **`.fromstyle`** target for this screen. |

---

## Text input — **`.arco-input-inner-wrapper`** (普通填写框)

| Property | Value |
|----------|--------|
| `height` | **`32px`** (`.arco-input-inner-wrapper-default` in group wrapper) |
| `border-radius` | **`4px`** on group ends; inner pieces in a group may use **`0`** between segments |
| `border` | **`1px solid`** **`var(--color-border-1)`** / **`#cbd5e1`** |
| `background-color` | **`#fff`** / **`var(--color-fill-4)`** (sources alternate — **white** is the visible face) |
| `color` | **`#1e293b`** / **`var(--color-text-2)`** |
| `font-size` | **`12px`** |
| `padding-left` / `padding-right` | **`12px`** |
| `display` | **`inline-flex`**, **`align-items: center`**, **`width: 100%`** |
| `transition` | **`color 0.1s linear, border-color 0.1s linear, background-color 0.1s linear`** |
| **`:hover`** | **`border-color: rgb(var(--primary-6))`**; background may stay **`#fff`** or use **`var(--color-fill-4)`** per Arco layer |

---

## Form help / error text — **`.arco-form-message`**, **`.arco-form-message-help`**

| Property | Value |
|----------|--------|
| **`.fromstyle .arco-form-message`** | **`white-space: nowrap`** (when applied) |
| **`.arco-form-message`** | **`line-height: 18px`**, **`margin: 4px 0 16px`** |
| **Help / extra** | **`color: var(--color-text-5)`**; **`.arco-form-message-help`** also **`#7f8c9f`** |
| **Error line** | **`color: rgb(var(--danger-6))`**, **`font-size: 12px`**, **`line-height: 16px`**, **`min-height: 16px`** |

---

## Textarea

| Part | Spec |
|------|------|
| **`.arco-textarea-wrapper`** | **`display: inline-block`**, **`position: relative`**, **`width: 100%`** |
| **`.arco-textarea`** | **`background-color: var(--color-fill-4)`**, **`border: 1px solid var(--color-border-1)`**, **`color: var(--color-text-2)`** |

---

## Cascader (级联选择器 — 含下拉)

**Trigger view** — **`.arco-cascader-size-default.arco-cascader-single .arco-cascader-view`**

| Property | Value |
|----------|--------|
| `height` | **`32px`** |
| `line-height` | **`30px`** |
| `font-size` | **`12px`** |
| `padding` | **`0 11px`** |
| `border-radius` | **`4px`** |
| `border` | **`1px solid`** **`var(--color-border-1)`** / **`#cbd5e1`** |
| `background-color` | **`#fff`** / **`var(--color-fill-4)`** |
| `color` | **`#0f172a`** / **`var(--color-text-1)`** |
| **`:hover`** | **`border-color: rgb(var(--primary-6))`**, **`background-color: #fff`** |
| **`:focus-within` / focused** | **`border-color: #cbd5e1`**, **`color: #0f172a`**, **`background-color: #fff`**, **`box-shadow: 0 0 0 0 rgb(var(--primary-2))`** |

**Dropdown** — **`.arco-cascader-popup`**

| Property | Value |
|----------|--------|
| `background-color` | **`var(--color-bg-popup)`** / **`var(--color-fill-5)`** |
| `border-radius` | **`var(--border-radius-medium)`** |
| `box-shadow` | **`0 4px 10px #0000001a`** |
| `border` | **`1px solid transparent`** |

**List column** — **`.arco-cascader-list-column`**: **`display: inline-block`**, **`height: 100%`**, **`vertical-align: top`**, background matches popup.

**List item** — **`.arco-cascader-list-item`**

| Property | Value |
|----------|--------|
| `height` / `line-height` | **`36px`** |
| `font-size` | **`12px`** |
| `min-width` | **`100px`** |
| `color` | **`#1e293b`** |
| **`.arco-cascader-list-item-active`** | **`background-color: rgb(var(--primary-2))`**, **`color: #1e293b`**, **`font-weight: 500`**, **`transition: all 0.2s linear`** |

**Trigger positioning**: **`.arco-trigger`** uses **`position: absolute`**, **`z-index: 1000`** for the floating layer.

---

## File upload — **`.arco-upload`**, **`.arco-upload-drag`**

| Property | Value |
|----------|--------|
| **`.arco-upload-drag`** | **`width: 100%`** |
| **`.arco-upload`** | **`display: inline-block`**, **`max-width: 100%`** |
| **Drag zone surface** | Often paired with **`bg-white`** / **`#fff`** in layout wrappers |

---

## Card-style choice — **CheckedCard** (选择卡片)

**Card box** (default / unchecked chrome from utilities):

| Property | Value |
|----------|--------|
| `width` / `height` | **`191px`** × **`100px`** |
| `padding` | **`1rem`** (**`p-4`**) |
| `border` | **`1px solid`** **`var(--color-border-2)`** |
| `border-radius` | **`0.25rem`** (**4px**, **`rounded`**) |
| `box-sizing` | **`border-box`** |
| `overflow` | **`hidden`** |

**Checked** — **`.CheckedCard_custom-checkbox-card-checked__…`** (class name is build-hash dependent — keep **CheckedCard** + **`checkbox-card-checked`** pattern):

| Property | Value |
|----------|--------|
| `background-color` | **`#eef6ff`** |
| `border-color` | **`rgb(var(--primary-6))`** |

**Title inside card** — **`.checkbox-title`** when checked:

| Property | Value |
|----------|--------|
| `color` | **`#007dfa`** / **`var(--primary-primary-6, #007dfa)`** |
| `font-size` | **`1rem`** (**`text-base`**) |
| `font-weight` | **`500`** |

**Description** — **`.checkbox-desc`** when checked: **`#1e293b`** / **`var(--text-color-text-2, #1e293b)`**; muted variant uses **`#7f8c9f`**, **`12px`**, **`line-height: 18px`**, **`font-weight: 400`**, **`margin-top: 0.5rem`** (**`mt-2`**).

---

## TreeSelect (树选择器)

**View** — **`.arco-tree-select .arco-tree-select-view`**

| Property | Value |
|----------|--------|
| `border-radius` | **`4px`** |
| `border` | **`1px solid`** **`var(--color-border-1)`** / **`#cbd5e1`** |
| `background-color` | **`#fff`** / **`var(--color-fill-4)`** |
| `color` | **`#0f172a`** / **`var(--color-text-1)`** |

**Multiple default** — **`.arco-tree-select-size-default.arco-tree-select-multiple .arco-tree-select-view`**: **`font-size: 12px`**, **`height: auto`**, **`line-height: 0`**, **`padding: 0 3px`** (multiple) or **`0 4px`** (variant).

**Suffix icons** — arrow / clear / etc.: **`color: var(--color-text-3)`** / **`#334155`**, **`font-size: 16px`** on **`.arco-tree-select-arrow-icon`**.

---

## Switch + auxiliary — **`.arco-switch`**

| Property | Value |
|----------|--------|
| `height` | **`16px`** |
| `line-height` | **`16px`** |
| `min-width` | **`28px`** |
| `border-radius` | **`8px`** |
| `border` | **`none`** |
| `padding` | **`0`** |
| **Off** | **`background-color: var(--color-fill-1)`** |
| **On** — **`.arco-switch-checked`** | **`background-color: rgb(var(--primary-6))`** |
| `transition` | **`background-color 0.2s cubic-bezier(0.34, 0.69, 0.1, 1)`** |

**Auxiliary copy** (under switch): **`12px`**, **`var(--color-text-3)`** / **`#7f8c9f`**, **`margin-top: 8px`**, full control column width.

---

## InputNumber (步进器) — **`.arco-input-number`**

| Property | Value |
|----------|--------|
| **Root width** (example) | **`160px`** (**`element.style`** / **`.inputNumber`**) |
| **Mode button** — step buttons | **`width: 32px`** on **`.arco-input-number-mode-button.arco-input-number-size-default`** add-before / add-after |
| **Inner input** | Same **`32px`** row, **`border-radius: 0`** between grouped parts, **centered** text in **`.arco-input-number-mode-button .arco-input`** |
| **`.arco-input`** inside number | **`font-size: 14px`** in one block vs **`12px`** in another — **align with inner wrapper `12px`** unless product picks **14px** for numerals only |

---

## Footer — **确定** (primary, **large**)

| Property | Value |
|----------|--------|
| `background-color` | **`rgb(var(--primary-6))`** and/or **`#007dfa`** (duplicate sources — **unify on theme primary**) |
| `color` | **`#fff`** / **`white`** |
| `border` | **`1px solid transparent`** |
| **Size** | **`arco-btn-size-large`**: **`height: 36px`**, **`font-size: 14px`**, **`padding: 0 19px`**, **`border-radius: 4px`** |
| `min-width` | **`80px`** (**`min-w-[80px]`**) |
| **`.arco-btn`** | **`font-weight: 600`**, **`line-height: 1.5715`**, **`transition: all 0.1s linear`** |

---

## Footer — **取消** (secondary)

Use **`arco-btn`** **outline** / **secondary** (not **primary**): **`height: 36px`**, **`min-width: 80px`**, same **`large`** padding family as **确定**. The pasted block for “取消” duplicated **primary** rules — **ignore**; implement **取消** as **outline** per **list-page** **§3** (border **`var(--color-border-1)`**, text **`var(--color-text-2)`** / **`#334155`**).

---

## Docked action bar (workspace shell — e.g. Nexus dashboard)

When the form sits inside a **shell that adds outer padding** (e.g. `p-6` on `main`’s child) plus a **fixed-width left navigation**, a footer that only uses **`position: sticky; bottom: 0`** on the form **stays inside the padded content box**. Visually you often get **side gutters** (page background showing left/right of the bar) and sometimes a **band of page background below** the bar if the scroll viewport does not coincide with the window bottom.

For a **true viewport bottom dock** and **full horizontal bleed across the main work column** (from the sidebar’s **right edge** to the viewport’s **right edge**):

- Prefer **`position: fixed; bottom: 0; right: 0`** and **`left: <sidebarWidth>`** (match the nav rail, e.g. **`220px`**) on breakpoints where the sidebar is visible; use **`left: 0`** when the rail is hidden on narrow viewports.
- Add enough **`padding-bottom`** on the **scrollable form body** so the last fields are not covered by the fixed bar.
- Keep **button** specs per **§ Footer — 确定 / 取消** above. The **bar surface** is usually **solid white** with a **light top border** or **soft shadow** above the content — do **not** rely on exposed page gray as intentional “spacing” under the bar.

---

## Dropdown (简单 Select)

If not using **Cascader**, reuse **input** chrome: **`32px`** row, **`4px`** radius, **`border-1`**, **`12px`** text — same as **「普通填写框」** above and **list-page** search field.

---

## Icon in form (图标)

Small **square tile** (e.g. knowledge base **图标** picker): may reuse **48×8** tile from **plaza-page** or **primary** fill **`#007dfa`** for consistency with **CheckedCard** title token.
