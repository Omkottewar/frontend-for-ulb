# UI Style Guide — Quick Reference
### ULB Audit Management System · BNM Chhattisgarh
**Stack:** React 19 + Vite + Tailwind CSS 4 (`@tailwindcss/vite`, no `tailwind.config.js`) · React Router 7 · No external UI/icon/chart libraries · All icons are inline SVG · All state is local (`useState`) · Data: localStorage + IndexedDB

**Design archetype:** Flat enterprise admin dashboard. No gradients, no animations (except `transition-colors`), no decorative elements. Government-grade utility tool.

---

## 1. Colors

| Token | Value | Use |
|---|---|---|
| Navy (primary) | `#1a2744` | Sidebar bg, primary buttons, focus rings, active nav |
| Navy hover | `#243460` | Primary button hover |
| App background | `#f0f2f5` | Shell bg, auth page bg |
| Amber-400 | Tailwind `amber-400` | Logo mark, avatar bg |

**Structure:** Navy sidebar + white content area. No third structural color.

**Status badge palette** — always `bg-{color}-100 text-{color}-{shade}`, `text-xs font-medium px-2.5 py-1 rounded-full`:

| Status | bg | text |
|---|---|---|
| High Risk / High Priority / Rejected | `bg-red-100` | `text-red-500` or `text-red-600` |
| Medium Risk / Medium Priority / Pending / Pre-Audit / Draft | `bg-orange-100` | `text-orange-500` |
| Low Risk / Low Priority / Done / Visited / Submitted / Reimbursed | `bg-green-100` | `text-green-600` |
| In Progress / Approved / Under Review | `bg-blue-100` | `text-blue-600` |
| Post-Audit | `bg-pink-100` | `text-pink-500` |
| Indexed / Travel (worklog) | `bg-cyan-100` | `text-cyan-600` |
| To Do / Closed / Other | `bg-gray-100` | `text-gray-500` |
| File Upload (worklog) | `bg-blue-100` | `text-blue-600` |
| Query Resolution | `bg-purple-100` | `text-purple-600` |
| Meeting | `bg-amber-100` | `text-amber-600` |

**Borders:** `border-gray-200` (cards, inputs) · `border-gray-100` (table header sep) · `border-gray-50` (table rows) · `border-white/10` (sidebar dividers)

**Shadows:** Only on overlays — `shadow-md` (auth card) · `shadow-lg` (dropdown) · `shadow-xl` (slide-in panels). No shadow on dashboard cards.

---

## 2. Typography

| Role | Classes |
|---|---|
| Page heading | `text-2xl font-bold text-gray-800` |
| Page subtitle | `text-sm text-gray-400 mt-1` |
| Auth brand heading | `text-3xl font-bold text-[#1a2744] tracking-tight` |
| Slide-in panel heading | `text-base font-semibold text-gray-800` |
| Card section heading | `text-sm font-semibold text-gray-700 mb-2` |
| Form label | `text-sm font-medium text-gray-700 mb-1` |
| Table header cell | `text-xs font-semibold text-gray-400 uppercase tracking-wide` |
| Table body cell | `text-sm text-gray-700` |
| Badge | `text-xs font-medium` |
| Meta / timestamp | `text-xs text-gray-400` |
| Body text | `text-sm text-gray-600` or `text-sm text-gray-500` |

**Rules:** One `text-2xl font-bold` per page max. No `text-lg` or `text-base` in table cells or content. System font stack (no custom fonts loaded).

---

## 3. Spacing

- Main content padding: `p-8`
- Page header bottom margin: `mb-6`
- Filter bar bottom margin: `mb-4`
- Card padding (standard): `p-5` or `px-5 py-4`
- Card padding (form page): `p-6`
- KPI stat card padding: `p-4`
- Table cell: `px-5 py-3.5` (data rows) · `px-5 py-3` (headers)
- Slide-in header/body: `px-6 py-5` · Footer: `px-6 py-4`
- Form fields: `mb-4` between, or `space-y-4` in slide-ins
- Label margin: `mb-1` (most) · `mb-1.5` (NewFilePage)

**Border radius:** `rounded-xl` (cards, auth card, filter bars) · `rounded-lg` (inputs, buttons, dropdowns) · `rounded-full` (badges, avatars) · `rounded-md` (file list items)

---

## 4. Component Patterns

### Buttons

**Primary:**
```
bg-[#1a2744] hover:bg-[#243460] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors
disabled:opacity-60
```

**Outline primary** (Edit, Check In):
```
text-xs font-medium text-[#1a2744] border border-[#1a2744]/30 px-3 py-1 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors
```

**Outline secondary** (Cancel):
```
text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors
```

**Ghost link** (table ID, "+ Add more"):
```
text-[#1a2744] hover:underline
```

**Danger remove** (× button):
```
text-gray-300 hover:text-red-400 transition-colors
```

**Dashed add** (+ Add Entry placeholder):
```
border-2 border-dashed border-gray-200 rounded-xl py-3 px-5 text-sm text-[#1a2744] font-medium hover:border-[#1a2744]/30 transition-colors w-full
```

### Inputs / Selects / Textareas

**Standard inputClass** (slide-ins, auth forms):
```
w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50
focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition placeholder-gray-400
```

**Alternate inputClass** (content cards, bg-white):
```
w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white
focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition
```

**Readonly:** add `bg-gray-50 text-gray-400 cursor-not-allowed`
**Textarea:** same inputClass + `resize-none` (slide-ins) or `resize-y` (form pages)
**Focus ring on all form elements:** `focus:ring-2 focus:ring-[#1a2744]` — no exceptions.

### Cards
```
bg-white rounded-xl border border-gray-200          ← base
bg-white rounded-xl border border-gray-200 p-5      ← with padding
bg-white rounded-xl border border-gray-200 overflow-hidden   ← for tables inside
```

**KPI stat card structure:**
```
p-4 → text-xs text-gray-400 mb-2 (label) → text-xl font-bold {color} (value) → text-xs text-gray-400 mt-1 (sub)
```

### Tables
```
Container: bg-white rounded-xl border border-gray-200 overflow-hidden flex-1
Table: w-full text-sm
Header row: border-b border-gray-100
Header cell: text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3
Data row: border-b border-gray-50 hover:bg-gray-50 transition-colors
Data cell: px-5 py-3.5 text-gray-700
Empty state: <td colSpan={N} class="text-center text-gray-400 text-sm py-16">
```
- Tracking IDs: `font-medium text-[#1a2744] hover:underline cursor-pointer`

### Badges
```
text-xs font-medium px-2.5 py-1 rounded-full {bg-color-100} {text-color-shade}
```
Never interactive. Always pastel bg + saturated text.

### Tabs

**Pill switcher** (Today/History, All/Pending/Done):
```
Container: flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit
Active:   bg-[#1a2744] text-white rounded-lg px-4 py-1.5 text-sm font-medium
Inactive: text-gray-500 hover:text-gray-700 rounded-lg px-4 py-1.5 text-sm font-medium
```

**Underline tabs** (Detail page sections):
```
Container: flex gap-1 border-b border-gray-200 mb-5
Active:   border-b-2 border-[#1a2744] text-[#1a2744] -mb-px px-4 py-2 text-sm font-medium
Inactive: border-b-2 border-transparent text-gray-400 hover:text-gray-600 -mb-px px-4 py-2 text-sm font-medium
```

### Slide-in Panels (Drawers)
```
Overlay:  fixed inset-0 z-50 flex
Backdrop: flex-1 bg-black/30  (click to close)
Panel:    w-96 bg-white h-full shadow-xl flex flex-col
  Header: px-6 py-5 border-b border-gray-100 — title (text-base font-semibold) + × close button
  Body:   flex-1 px-6 py-5 space-y-4 overflow-y-auto
  Footer: px-6 py-4 border-t border-gray-100 — full-width primary button
```
Close button: `text-gray-400 hover:text-gray-600` with `w-5 h-5` SVG X icon.
Wider variants: `w-120` (EntryPanel), `w-130` (HistoryDetailPanel) — Tailwind 4 width tokens.
No open/close animation — appears instantly.

### Drag-and-Drop Upload Zone
```
Default:   border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:border-gray-300 transition-colors duration-150
Drag-over: border-[#1a2744] bg-blue-50
```

### Filter Bar
```
bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 mb-4 flex-wrap
```
Contains: search input wrapper (`flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2`) + select dropdowns.

### Error Block
```
text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2
```
Page-level only (between last field and submit). No per-field inline errors.

### Back Link
```
flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors
```
Uses plain `←` text arrow. Placed above the h1.

### Icons
All inline SVG: `xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}`
Sizes: `w-3.5 h-3.5` (chevron) · `w-4 h-4` (table) · `w-5 h-5` (panel close) · `w-6 h-6` (placeholder)
All paths: `strokeLinecap="round" strokeLinejoin="round"`

---

## 5. Sidebar & Navigation

```
w-64 bg-[#1a2744] flex flex-col shrink-0
├── Logo: px-5 py-5 border-b border-white/10
│     Logo mark: w-7 h-7 rounded-md bg-amber-400 — bold "U" text
│     App name: text-white font-semibold text-sm
│     Subtitle: text-white/50 text-xs
├── Nav: flex-1 px-3 py-4 space-y-1 overflow-y-auto
│     Item base: w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
│     Active:    bg-white/15 text-white
│     Inactive:  text-white/60 hover:bg-white/10 hover:text-white
│     Accordion children: mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5
│       Child base: w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150
│       Active child:   bg-white/15 text-white font-medium
│       Inactive child: text-white/50 hover:bg-white/10 hover:text-white
└── User: px-4 py-4 border-t border-white/10 flex items-center justify-between
      Avatar: w-8 h-8 rounded-full bg-amber-400 text-[#1a2744] font-bold text-sm (initials)
      Name: text-white text-sm font-medium
      Role: text-white/50 text-xs
      Log out: text-white/40 hover:text-white text-xs
```

**Accordion behavior:** Clicking parent toggles open/close. Clicking a child does NOT close accordion. Accordion closes only when a non-child nav item is clicked.

**RBAC:**
- `ULB Field Officer` — sees: Dashboard, Files, Pre-Audit, Post-Audit
- `Field Operations Staff` — sees all above + Activity Log accordion (Attendance, Work Log, Expenses, Tasks)
- Check: `session?.role === "Field Operations Staff"` · Role from `getSession()` in `src/utils/auth.js`

---

## 6. Page Structure Patterns

**Standard list page:**
```
<div class="flex flex-col h-full">
  {/* Header */}
  <div class="flex items-start justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Page Title</h1>
      <p class="text-sm text-gray-400 mt-1">Subtitle</p>
    </div>
    <button class="[primary button]">+ Action</button>
  </div>
  {/* Filter bar */}
  <div class="bg-white rounded-xl border border-gray-200 px-4 py-3 ...">...</div>
  {/* Table */}
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1">
    <table class="w-full text-sm">...</table>
  </div>
</div>
```

**Activity Log child page** (Attendance, WorkLog, Expenses, Tasks):
- Same header + CTA pattern
- Pill tab switcher below header (Today/History or similar)
- Content below tabs (table, cards, or custom)
- Slide-in panels for create/edit/detail

**Detail page** (FileDetailPage):
- Back link → `text-2xl` heading → underline tabs → 2-col card grid

**Form page** (NewFilePage):
- Back link → `text-2xl` heading → `bg-white rounded-xl border border-gray-200 p-6 max-w-2xl` card → fields → Submit + Cancel

**Auth page:**
- `min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4`
- Brand block above card: `text-3xl font-bold text-[#1a2744] tracking-tight`
- Card: `bg-white rounded-xl shadow-md w-full max-w-md p-8`

---

## 7. Content & Copy Rules

- Button labels: **Title Case** ("New File", "Submit Day", "Raise Expense")
- Form labels: **Title Case** ("File Title", "Contract Type")
- Column headers: **ALL CAPS** ("FILE TITLE", "AMOUNT", "STATUS")
- Error messages: **Sentence case with period** ("Invalid email or password.")
- Placeholders: **lowercase** ("describe the work...", "what needs to be done?")
- Empty states: **Instructional** ("No files yet. Click "+ New File" to create one.")
- Currency: `₹${Number(x).toLocaleString("en-IN")}`
- Dates: `toLocaleDateString("en-IN")` → "3/6/2026"
- Required field: `<span class="text-red-500">*</span>` after label text

---

## 8. Hard Rules (Never Violate)

- **No gradients anywhere.**
- **No external icon library** — inline SVG only.
- **No external UI library** — Tailwind utilities only.
- **No third structural color** — only navy `#1a2744` and white.
- **No new hex values** — use Tailwind palette at `-100`/`-500`/`-600` levels.
- **No shadow on dashboard cards** — shadow is for overlays only.
- **No `text-lg` or `text-base` in table cells or form body content.**
- **No `rounded-2xl` or `rounded-none` on primary UI containers.**
- **No slide/fade/scale/bounce animations** — `transition-colors` only.
- **No new button color variants** — use existing 5 button types.
- **No `border-2` on inputs.**
- **No `bg-blue-500`, `bg-green-500`, or saturated fills on UI elements** — saturated = badge text only.
- **No global state manager** — local `useState`/`useEffect` only.
- **Create/edit forms always go in slide-in panels**, not inline or in modals.
- **One `text-2xl font-bold` heading per page maximum.**
- **Main content padding is always `p-8`.** Never pad individual pages differently.

---

## 9. Key File Paths

| File | Purpose |
|---|---|
| `src/layouts/MainLayout.jsx` | Sidebar, header, nav accordion, RBAC, page router |
| `src/pages/FilesPage.jsx` | List page pattern — table, filters, badges |
| `src/pages/FileDetailPage.jsx` | Detail page — underline tabs, edit mode, version diff |
| `src/pages/NewFilePage.jsx` | Form page — drag-drop, grid layout, inputClass |
| `src/pages/AttendancePage.jsx` | Table + inline row expansion pattern |
| `src/pages/WorkLogPage.jsx` | Slide-in EntryPanel, HistoryDetailPanel, per-entry status |
| `src/pages/ExpensesPage.jsx` | KPI stat cards + table + slide-in pattern |
| `src/pages/TasksPage.jsx` | Card grid + dual tabs + slide-in panel |
| `src/utils/auth.js` | `getSession()`, `registerUser()`, role constants |
| `src/utils/db.js` | IndexedDB wrapper for file attachment blobs |
