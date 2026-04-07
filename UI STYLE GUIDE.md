# UI STYLE GUIDE
### ULB Audit Management System — BNM Chhattisgarh
**Version:** 1.0 | **Stack:** React 19 + Vite + Tailwind CSS 4 | **Inferred from codebase as of March 2026**

---

## 1. Product Design Intent

This is a **government-grade internal operations tool** — not a consumer product. The design intent is:

- **Enterprise utility dashboard**: Every pixel serves a functional purpose. No decorative elements.
- **Low visual noise**: The interface keeps the user focused on data and actions. No gradients, illustrations, animations, or decorative flourishes exist anywhere in the codebase.
- **Compact but readable**: Dense information presentation without sacrificing legibility. Tables, cards, and panels are tight but not cramped.
- **Trust and authority**: The dark navy primary color (`#1a2744`) evokes formality, government use, and reliability. The UI feels official.
- **Flat and clean**: No glassmorphism, no soft-UI, no neumorphism. Pure flat design with light borders and occasional shadow on auth screens.
- **Functional over beautiful**: The design prioritizes scan speed, data density, and task completion. It is not trying to win design awards.

The closest design archetype is: **enterprise SaaS admin dashboard** in the style of Linear, Notion's settings, or government e-office systems — refined but no-frills.

---

## 2. Core Design Principles

1. **Data first, chrome last** — the interface's job is to make data visible and actionable, not to look impressive.
2. **Borders over shadows** — UI layers are separated using `border-gray-200` borders, not drop shadows. Shadows appear only on elevated overlays (auth card, slide-in panels, dropdowns).
3. **Consistent rhythm** — spacing, padding, and font sizes are highly consistent across every component. The rhythm feels uniform because it is.
4. **Color as signal, not decoration** — color is used exclusively to convey status (risk, expense state, task priority, attendance). It never appears decoratively.
5. **State is always visible** — every record has a visual status badge. Every action (Draft, Submitted, Pending, Visited) has a corresponding color-coded pill.
6. **Progressive disclosure** — detail panels (slide-ins) reveal contextual forms without navigating away. History details live behind a click. Inline expansion is used for check-in flows.
7. **Navy + white as the only structural colors** — the sidebar is navy, the content area is white/off-white. No third structural color exists.
8. **Small, consistent transitions** — micro-interactions use `transition-colors` only. Nothing slides, bounces, or scales. The UI feels stable.
9. **Flat hierarchy, bold headings** — every page has one clear `text-2xl font-bold` heading. Everything else is subordinate.
10. **Form controls are homogeneous** — all inputs, selects, and textareas share one `inputClass` string, ensuring uniformity throughout all forms.

---

## 3. Brand and Visual Identity

### Primary Color
| Token | Value | Usage |
|---|---|---|
| Navy (primary) | `#1a2744` | Sidebar background, primary buttons, focus rings, active nav, link color in tables, progress bars |
| Navy hover | `#243460` | Hover state of all primary buttons |

### Accent Color
| Token | Value | Usage |
|---|---|---|
| Amber-400 | Tailwind `amber-400` | Sidebar logo mark background, user avatar background |

### Background Colors
| Token | Value | Usage |
|---|---|---|
| App background | `#f0f2f5` | Main app shell background, auth page background |
| White | `#ffffff` | Cards, tables, sidebar panels, slide-in panels, inputs, header |
| Input background | Tailwind `gray-50` | Default input/select/textarea background |

### Border Colors
| Token | Usage |
|---|---|
| `border-gray-200` | Main card borders, input borders, filter bar borders, nav dividers on white |
| `border-gray-100` | Table header separator, card inner separators |
| `border-gray-50` | Table row separators, subtle section dividers |
| `border-white/10` | Sidebar section dividers (translucent white on navy) |

### Text Colors
| Token | Usage |
|---|---|
| `text-gray-800` | Page headings, primary cell content |
| `text-gray-700` | Body text, form labels, card content |
| `text-gray-600` | Secondary body, cancel button text |
| `text-gray-500` | Tertiary text, nav labels (inactive), back links |
| `text-gray-400` | Meta text, table column headers, placeholders, timestamps |
| `text-gray-300` | Disabled icons, non-interactive icon states |
| `text-white` | Text on navy backgrounds (sidebar, primary buttons) |
| `text-white/60` | Inactive sidebar nav items |
| `text-white/50` | Sidebar subtitles, user role |
| `text-white/40` | Sidebar log out button |
| `text-[#1a2744]` | Active links in tables, outline button text, active tab text |

### Semantic / Status Colors (Badges only)
All status colors follow the pattern: `bg-{color}-100 text-{color}-{shade}` (pastel background, saturated text).

| Status | Background | Text |
|---|---|---|
| High Risk | `bg-red-100` | `text-red-600` |
| Medium Risk | `bg-orange-100` | `text-orange-500` |
| Low Risk | `bg-green-100` | `text-green-600` |
| Pre-Audit | `bg-orange-100` | `text-orange-500` |
| Post-Audit | `bg-pink-100` | `text-pink-500` |
| Indexed | `bg-cyan-100` | `text-cyan-600` |
| Closed | `bg-gray-100` | `text-gray-500` |
| Under Review | `bg-blue-100` | `text-blue-500` |
| Draft | `bg-orange-100` | `text-orange-500` |
| Submitted | `bg-green-100` | `text-green-600` |
| Visited | `bg-green-100` | `text-green-600` |
| Pending (attendance) | `bg-orange-100` | `text-orange-500` |
| Pending (expense) | `bg-orange-100` | `text-orange-500` |
| Approved (expense) | `bg-blue-100` | `text-blue-600` |
| Rejected (expense) | `bg-red-100` | `text-red-500` |
| Reimbursed | `bg-green-100` | `text-green-600` |
| To Do (task) | `bg-gray-100` | `text-gray-500` |
| In Progress | `bg-blue-100` | `text-blue-600` |
| Done | `bg-green-100` | `text-green-600` |
| High Priority | `bg-red-100` | `text-red-500` |
| Medium Priority | `bg-orange-100` | `text-orange-500` |
| Low Priority | `bg-green-100` | `text-green-600` |

### Activity Type Badge Colors (Work Log)
| Activity | Background | Text |
|---|---|---|
| File Upload | `bg-blue-100` | `text-blue-600` |
| Query Resolution | `bg-purple-100` | `text-purple-600` |
| Meeting | `bg-amber-100` | `text-amber-600` |
| Travel | `bg-cyan-100` | `text-cyan-600` |
| Other | `bg-gray-100` | `text-gray-500` |

### Special States
| State | Style |
|---|---|
| Error inline | `text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2` |
| Version diff (old) | `bg-red-50 text-red-500 line-through px-2 py-0.5 rounded` |
| Version diff (new) | `bg-green-50 text-green-600 px-2 py-0.5 rounded` |
| Pending module field | `text-xs text-amber-500 italic` |
| Edit mode reason box | `bg-amber-50 border border-amber-200 rounded-xl`, label `text-amber-700` |
| Edit mode reason input | `focus:ring-amber-300 border-amber-200` |

### Gradients
None. The codebase contains zero gradient usage.

### Shadow Philosophy
Shadows are reserved exclusively for elevated, floating elements:
- Auth card: `shadow-md`
- Dropdown menu: `shadow-lg`
- Slide-in panels: `shadow-xl`
- All dashboard cards and tables: **no shadow** — borders only.

### Border Radius Philosophy
| Context | Radius |
|---|---|
| Cards, panel containers, auth card, filter bars | `rounded-xl` |
| Inputs, selects, textareas, buttons, dropdowns | `rounded-lg` |
| Badges, pills, avatar circles | `rounded-full` |
| Attachment list items, file extension labels | `rounded-md` or `rounded` |

The app is **clean and rounded**, not sharp. No `rounded-none` or `rounded-sm` used in primary UI.

---

## 4. Typography System

### Font Family
No custom font is declared in `index.css` or `index.html`. The app uses the **browser default system font stack** provided by Tailwind CSS (system-ui, -apple-system, sans-serif). No Google Fonts or other web fonts are loaded.

### Heading Sizes
| Role | Classes |
|---|---|
| Page heading (main h1) | `text-2xl font-bold text-gray-800` |
| Auth brand heading | `text-3xl font-bold text-[#1a2744] tracking-tight` |
| Auth form heading | `text-xl font-semibold text-gray-800` |
| Card section heading | `text-sm font-semibold text-gray-700` |
| Slide-in panel heading | `text-base font-semibold text-gray-800` |
| History detail heading | `text-base font-semibold text-gray-800` |

### Body / Content Sizes
| Role | Classes |
|---|---|
| Standard body text | `text-sm text-gray-700` |
| Table cell content | `text-sm text-gray-700` |
| Secondary body | `text-sm text-gray-500` or `text-sm text-gray-400` |
| Page subtitle | `text-sm text-gray-400 mt-1` |
| Form values (detail view) | `text-sm text-gray-800 font-medium` |
| File subtitle in detail | `text-base text-gray-600` |

### Label Sizes
| Role | Classes |
|---|---|
| Form label | `text-sm font-medium text-gray-700 mb-1` |
| Form label (NewFile) | `text-sm font-medium text-gray-700 mb-1.5` |
| Table column header | `text-xs font-semibold text-gray-400 uppercase tracking-wide` |
| Section sub-label | `text-xs font-semibold text-gray-400 uppercase tracking-wide` |

### Caption / Meta Sizes
| Role | Classes |
|---|---|
| Timestamps, file sizes, ULB meta | `text-xs text-gray-400` |
| Badge text | `text-xs font-medium` |
| File extension label | `text-xs font-medium text-gray-400 uppercase` |
| Error message | `text-xs text-red-500` |
| Pending module text | `text-xs text-amber-500 italic` |
| Sidebar subtitle | `text-xs` |
| Sidebar user role | `text-xs text-white/50` |
| Nav item | `text-sm font-medium` |

### Font Weights Used
- `font-bold` — page headings only
- `font-semibold` — card section headings, panel headings, auth brand heading, task title
- `font-medium` — button text, form labels, active nav, badge text, table tracking IDs, key values
- `font-normal` — all body text (implicit Tailwind default)

### Letter Spacing
- `tracking-tight` — auth brand heading only
- `tracking-wide` — table column headers (`uppercase tracking-wide`)
- Default everywhere else

### Typography Hierarchy Rules
1. One `text-2xl font-bold` per page maximum.
2. Subtitles always `text-sm text-gray-400 mt-1` directly below the h1.
3. Card section labels use `text-sm font-semibold text-gray-700 mb-2`.
4. Table headers are always `text-xs uppercase tracking-wide text-gray-400`.
5. Badge text is always `text-xs font-medium`.
6. Body in table cells is `text-sm`, never `text-base` or larger.
7. The `text-base` size is used only in slide-in panel headings and file subtitle lines.

---

## 5. Spacing and Layout System

### Core Layout Structure
```
h-screen flex overflow-hidden
├── Sidebar: w-64, bg-[#1a2744], flex-col, shrink-0
└── Right side: flex-1, flex-col, overflow-hidden
    ├── Header: h-14, bg-white, border-b border-gray-200, shrink-0
    └── Main content: flex-1, overflow-auto, p-8
```

### Page Content Spacing
| Element | Spacing |
|---|---|
| Page header bottom margin | `mb-6` |
| Filter bar bottom margin | `mb-4` |
| Section gap (content blocks) | `gap-4` (grid) or `flex flex-col gap-4` |
| Card inner padding (standard) | `p-5` or `px-5 py-4` |
| Card inner padding (form) | `p-6` |
| Slide-in panel header | `px-6 py-5` |
| Slide-in panel body | `px-6 py-5` |
| Slide-in panel footer | `px-6 py-4` |
| Table cell horizontal | `px-5` |
| Table cell vertical | `py-3.5` (data rows), `py-3` (headers) |
| Main content padding | `p-8` |
| Back link bottom margin | `mb-5` |

### Grid Layouts Used
| Context | Grid |
|---|---|
| FileDetailPage card columns | `grid grid-cols-2 gap-4` |
| NewFilePage top (File# + ULB) | `grid grid-cols-2 gap-4 mb-4` |
| NewFilePage bottom row | `grid grid-cols-3 gap-4 mb-6` |
| ExpensesPage stat cards | `grid grid-cols-4 gap-4 mb-6` |
| TasksPage task grid | `grid grid-cols-1 gap-3 md:grid-cols-2` |
| AttendancePage ULB cards (old) | `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3` |

### Form Field Spacing
| Context | Spacing |
|---|---|
| Auth form fields | `space-y-4` |
| Slide-in panel fields | `space-y-4` |
| NewFilePage fields | `mb-4` between each field |
| Label margin below | `mb-1` (most), `mb-1.5` (NewFilePage) |

### Sidebar Spacing
| Element | Spacing |
|---|---|
| Logo section | `px-5 py-5` |
| Nav container | `px-3 py-4 space-y-1` |
| Nav item | `px-4 py-2.5` |
| Accordion child item | `px-3 py-2` |
| Accordion indent | `ml-3 pl-3 border-l border-white/10` |
| User section | `px-4 py-4` |

### Page Density
**Moderate-compact**. The app is not spacious (no generous `py-8` or `px-12` on content areas), but it is not pixel-compressed either. The `p-8` main area and `px-5 py-3.5` table cells reflect a balanced enterprise density.

---

## 6. Component Design Language

### Buttons

#### Primary Button
```
bg-[#1a2744] hover:bg-[#243460] text-white font-medium rounded-lg transition-colors
```
- Padding: `px-4 py-2.5` (standard), `px-5 py-2.5` (form submit)
- Size: `text-sm`
- Full width on auth: `w-full`
- Disabled: `disabled:opacity-60`
- Loading text: replaces label text ("Saving...")

#### Outline Primary Button (reversible)
```
border border-[#1a2744] text-[#1a2744] hover:bg-[#1a2744] hover:text-white rounded-lg transition-colors
```
- Padding: `px-4 py-1.5` (inline edit controls), `px-3 py-1` (small)
- Size: `text-sm` or `text-xs font-medium`
- Used for: Edit, Check In (bordered variant), small action buttons

#### Outline Secondary Button (cancel/back)
```
border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 rounded-lg transition-colors
```
- Padding: `px-4 py-2.5` or `px-4 py-1.5`
- Size: `text-sm font-medium`
- Used for: Cancel, back actions

#### Ghost Link Button
```
text-[#1a2744] hover:underline
```
- Used in tables for clickable tracking IDs
- Used for "+ Add more files" in file upload

#### Danger/Destructive (icon-only)
```
text-gray-300 hover:text-red-400 transition-colors
```
- Used for remove file (×), remove task from list

#### Small Outline Primary (action in table row)
```
text-xs font-medium text-[#1a2744] border border-[#1a2744]/30 px-3 py-1 rounded-lg hover:bg-[#1a2744] hover:text-white transition-colors
```
- Used for: Edit button on work log entries, Check In in attendance table

#### Dashed Add Button
```
border-2 border-dashed border-gray-200 rounded-xl py-3 px-5 text-sm text-[#1a2744] font-medium hover:border-[#1a2744]/30 transition-colors w-full justify-center
```
- Used for: + Add Entry placeholder button

**Anti-patterns:**
- Do not use red/danger primary buttons — destructive actions use ghost danger style only.
- Do not create `text-base` or larger buttons.
- Do not invent new button colors outside the navy/gray palette.

---

### Inputs, Selects, Textareas

**Standard `inputClass`** (used across auth, slide-ins, NewFilePage):
```
w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50
focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition
placeholder-gray-400
```

**Alternate (detail edit rows, bg-white):**
```
w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white
focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition
```

**Filter/search bar select:**
```
border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none
focus:ring-2 focus:ring-[#1a2744] bg-white min-w-[130px]
```

**Search bar (inline):**
- Wrapping div: `flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[180px]`
- Input: `text-sm text-gray-700 outline-none w-full placeholder-gray-400`
- No focus ring on the input itself — the wrapping div provides the visual container

**Readonly input:**
```
bg-gray-50 text-gray-400 cursor-not-allowed
```

**Textarea:**
- Same inputClass as inputs
- `resize-none` (slide-ins), `resize-y` (NewFilePage work description)
- `rows={2}` or `rows={3}` depending on context

**States:**
- Focus: `focus:ring-2 focus:ring-[#1a2744] focus:border-transparent` (navy ring, border removed)
- Readonly: lighter background (`bg-gray-50`) and `text-gray-400 cursor-not-allowed`
- No visible error state on individual inputs (only page-level error message shown)

---

### Cards

**Standard card:**
```
bg-white rounded-xl border border-gray-200
```

**Card with padding:**
```
bg-white rounded-xl border border-gray-200 p-5
```

**Card with overflow (tables inside):**
```
bg-white rounded-xl border border-gray-200 overflow-hidden
```

**Card with flex layout:**
```
bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between
```

**KPI/Stat card:**
```
bg-white rounded-xl border border-gray-200 p-4
```
Structure: label `text-xs text-gray-400 mb-2` → value `text-xl font-bold {color}` → sub-label `text-xs text-gray-400 mt-1`

**No shadows on dashboard cards.** Cards are distinguished from the `#f0f2f5` background purely by their white fill and `border-gray-200`.

---

### Tables

**Container:**
```
bg-white rounded-xl border border-gray-200 overflow-hidden flex-1
```

**Table element:** `w-full text-sm`

**Header row:**
```html
<tr class="border-b border-gray-100">
  <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
```

**Data rows:**
```html
<tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
  <td class="px-5 py-3.5 text-gray-700">
```

**Row separator:** `border-b border-gray-50` (lighter than card border)
**Header separator:** `border-b border-gray-100`

**Empty state (inside table):**
```
<td colSpan={N} class="text-center text-gray-400 text-sm py-16">
```

**Patterns:**
- Tracking IDs are always `font-medium text-[#1a2744] hover:underline` clickable links
- Status and risk columns always use badge pills (see Badges)
- Last column is reserved for action icons/buttons, uses `px-3 py-3.5`
- No sorting, pagination, or column resizing implemented

---

### Badges

**Standard badge:**
```
text-xs font-medium px-2.5 py-1 rounded-full {bg-color} {text-color}
```

**Compact badge (in headings/rows):**
```
text-xs font-medium px-2.5 py-0.5 rounded-full
```

**Slightly larger (detail page):**
```
text-xs font-medium px-3 py-1 rounded-full
```

Badges are always:
- `text-xs font-medium`
- `rounded-full`
- Using pastel bg + saturated text from the semantic color table
- Never interactive (no hover/click)

---

### Tabs

**Variant 1 — Pill Switcher** (used in Attendance, WorkLog, Tasks, Expenses filter, Attendance filter)
```
Container: flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit
Active tab: bg-[#1a2744] text-white rounded-lg px-5 py-2 text-sm font-medium
Inactive tab: text-gray-500 hover:text-gray-700 rounded-lg px-5 py-2 text-sm font-medium
```

**Variant 2 — Underline** (used in FileDetailPage)
```
Container: flex gap-1 border-b border-gray-200 mb-5
Active: border-b-2 border-[#1a2744] text-[#1a2744] -mb-px px-4 py-2 text-sm font-medium
Inactive: border-transparent text-gray-400 hover:text-gray-600 border-b-2 -mb-px px-4 py-2 text-sm font-medium
```

Use pill switcher for binary or small option sets (Today/History, All/Pending/Visited). Use underline for page-level tab navigation (Details/Documents/Version History).

---

### Slide-in Panels (Drawers)

All slide-ins use the same structure:
```
Overlay: fixed inset-0 z-50 flex
Backdrop: flex-1 bg-black/30  (click to close)
Panel: w-96 (standard) bg-white h-full shadow-xl flex flex-col
  Header: px-6 py-5 border-b border-gray-100 — title + close button
  Body: flex-1 px-6 py-5 space-y-4 overflow-y-auto — form fields
  Footer: px-6 py-4 border-t border-gray-100 — primary action button (full width)
```

Close button: `text-gray-400 hover:text-gray-600` with 24px × SVG close icon.

Wider variants: `w-120` (EntryPanel in WorkLog), `w-130` (HistoryDetailPanel in WorkLog). These are Tailwind 4 arbitrary width tokens.

Slide-ins do **not** animate in from the side — they appear instantly (`fixed` without transform transition).

---

### Dropdowns (Context Menus)

```
absolute right-8 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 min-w-[220px]
```

Section label within dropdown: `text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 pt-1 pb-1.5`

Dropdown items: `w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left`

Closed on outside click using `mousedown` document listener + `useRef`.

---

### Navigation (Sidebar)

```
w-64 bg-[#1a2744] flex flex-col shrink-0
```

**Logo section:** `px-5 py-5 border-b border-white/10`
- Logo mark: `w-7 h-7 rounded-md bg-amber-400` with bold "U" text
- App name: `text-white font-semibold text-sm`
- Subtitle: `text-white/50 text-xs`

**Nav container:** `flex-1 px-3 py-4 space-y-1 overflow-y-auto`

**Nav item:**
- Active: `bg-white/15 text-white`
- Inactive: `text-white/60 hover:bg-white/10 hover:text-white`
- Base classes: `w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150`

**Accordion parent item** (Activity Log):
- Same base classes as nav item
- Includes a chevron SVG (`w-3.5 h-3.5`) that rotates 180° when open: `transition-transform duration-200`
- Active when open OR when a child is active

**Accordion children:**
- Container: `mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5`
- Item: `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150`
- Active child: `bg-white/15 text-white font-medium`
- Inactive child: `text-white/50 hover:bg-white/10 hover:text-white`

**User section:** `px-4 py-4 border-t border-white/10 flex items-center justify-between`
- Avatar: `w-8 h-8 rounded-full bg-amber-400 text-[#1a2744] font-bold text-sm` — initials from user's name
- Name: `text-white text-sm font-medium`
- Role: `text-white/50 text-xs`
- Log out: `text-white/40 hover:text-white text-xs`

---

### Header

```
h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 shrink-0
```

Currently displays only a ULB indicator (dot + city name): `text-sm text-gray-600` with a `w-2 h-2 rounded-full bg-red-500` dot.

---

### Filters / Dashboard Controls

**Filter bar container:**
```
bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 mb-4 flex-wrap
```

Contains a search input wrapper + select dropdowns. Uses `flex-wrap` for overflow on smaller viewports.

---

### File Upload / Drag-and-Drop Zone

**Default state:**
```
border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 bg-gray-50 cursor-pointer transition-colors duration-150
```

**Drag-over state:**
```
border-[#1a2744] bg-blue-50
```

**Simplified upload area (slide-ins):**
```
border-2 border-dashed border-gray-200 rounded-lg p-4/p-6 cursor-pointer hover:border-gray-300 transition-colors
```

---

### Back Navigation

```
flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors
```

Uses a plain `←` text arrow (not an SVG icon). Always placed directly below the page root, above the h1.

---

### Empty States

**Table empty state:**
```
<td colSpan={N} class="text-center text-gray-400 text-sm py-16">
  No records. [Instruction to create one if applicable]
</td>
```

**Full-page empty state:**
```
flex-1 flex flex-col items-center justify-center text-center
text-gray-400 text-sm + text-gray-300 text-xs
```

**Panel empty state:**
```
p-8 text-center text-sm text-gray-400
```

---

### Progress Bar

```
Container: w-{fixed} h-1.5 bg-gray-100 rounded-full overflow-hidden
Fill: h-full bg-[#1a2744] rounded-full transition-all
Width: controlled via inline style={{ width: `${percent}%` }}
```

---

### Version Diff Display

Old value: `bg-red-50 text-red-500 line-through px-2 py-0.5 rounded text-xs`
Arrow: `text-xs text-gray-400` — plain text `→`
New value: `bg-green-50 text-green-600 px-2 py-0.5 rounded text-xs`

---

### Authentication Screens

**Full-page wrapper:**
```
min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center px-4
```

**Brand block (above card):**
```
mb-6 text-center
h1: text-3xl font-bold text-[#1a2744] tracking-tight — "ULB Audit Management"
p: text-sm text-gray-500 mt-1 — "Internal Audit & Pre-Post Audit System"
```

**Card:**
```
bg-white rounded-xl shadow-md w-full max-w-md p-8
h2: text-xl font-semibold text-gray-800 mb-1
p: text-sm text-gray-400 mb-6
```

Only location in the app where `shadow-md` is used on a non-overlay element.

---

### Icons

No external icon library is used. All icons are **inline SVGs** with:
```jsx
xmlns="http://www.w3.org/2000/svg"
fill="none"
viewBox="0 0 24 24"
stroke="currentColor"
strokeWidth={2} or strokeWidth={1.5}
```

Standard sizes:
- `w-3.5 h-3.5` — sidebar chevron
- `w-4 h-4` — table action icons, small inline icons
- `w-5 h-5` — panel close button, form icons
- `w-6 h-6` — placeholder icons in empty zones
- `w-7 h-7`, `w-8 h-8` — avatar/logo

All paths use `strokeLinecap="round" strokeLinejoin="round"`.

---

## 7. Interaction and UX Patterns

### Hover Behavior
- Buttons: background color shift (via `hover:bg-*`)
- Table rows: `hover:bg-gray-50`
- Nav items: `hover:bg-white/10 hover:text-white`
- Download items in dropdown: `hover:bg-gray-50`
- Back link: `hover:text-gray-800`
- Document row in detail: `hover:bg-gray-50` + reveal hidden "Download" label via `group-hover:opacity-100`

### Active / Selected States
- Active nav item: `bg-white/15 text-white`
- Active tab (pill): `bg-[#1a2744] text-white`
- Active tab (underline): `border-b-2 border-[#1a2744] text-[#1a2744]`

### Focus States
All interactive form elements use: `focus:ring-2 focus:ring-[#1a2744] focus:border-transparent focus:outline-none`

The focus ring uses the navy primary color. `focus:outline-none` removes the default browser outline before applying the custom ring.

### Disabled States
- Primary button: `disabled:opacity-60`
- No other explicit disabled states defined

### Error Display Pattern
Errors are displayed as a **page-level message block** between the last field and the submit button:
```
text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2
```
No field-level highlighting or inline error messages adjacent to inputs.

### Transition Philosophy
All transitions are **color-only**:
- `transition-colors` — most interactive elements
- `transition-colors duration-150` — nav items
- `transition-colors duration-200` — auth form buttons
- `transition` — form inputs (Tailwind default, covers all properties)
- `transition-opacity` — group-hover reveal in document list
- `transition-transform duration-200` — accordion chevron rotation

No translate, scale, slide, or bounce animations exist anywhere in the codebase.

### Slide-in Panel Behavior
- Opens instantly (no slide animation)
- Backdrop click closes the panel
- Close button (×) in header also closes
- Panel header has title + close button
- Panel footer has full-width primary action button
- Body scrolls independently if content overflows (`overflow-y-auto`)

### Accordion Behavior (Sidebar)
- Clicking parent item toggles open/closed
- Clicking a child item sets it as active but does NOT close the accordion
- Accordion closes only when a non-child nav item is clicked
- Parent button highlights when accordion is open OR when any child is active

### Inline Expansion (Attendance Table)
- Clicking "Check In" on a table row inserts an expansion row directly below it
- The expansion row spans all columns (`colSpan={5}`)
- Cancel button collapses it; Confirm closes and marks as visited

### Detail Navigation Pattern
- Main list pages (FilesPage, etc.) render detail views inline by swapping component state (`selectedFile`, `showNew`) — **no routing**, no URL change
- Back links restore the list state

---

## 8. Responsive Design Rules

### Breakpoints Used
Only Tailwind's default breakpoints appear:
- `md:` (768px) — used in grid layouts for column expansion
- `xl:` (1280px) — used in AttendancePage card grid (old version)

### Responsive Strategies
| Pattern | Implementation |
|---|---|
| Task cards | `grid-cols-1 md:grid-cols-2` |
| Filter bar wrapping | `flex-wrap` with `min-w-[]` on selects |
| Attendance cards (old) | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` |

### Desktop-First Assumptions
The app is **designed for desktop use only**. The sidebar is always visible (`w-64 shrink-0`), there is no hamburger menu, and the main content area is `p-8`. Mobile users would see a collapsed sidebar and overflowing content.

No mobile-specific overrides, no responsive nav, no touch-specific patterns exist.

---

## 9. Theme Implementation Details

### CSS Architecture
- **Framework:** Tailwind CSS 4 via `@tailwindcss/vite` plugin
- **Config file:** No `tailwind.config.js` exists — Tailwind 4 is configured via the Vite plugin directly
- **Global CSS:** `src/index.css` contains only `@import "tailwindcss"` and a `margin: 0; padding: 0` reset on `html, body`
- **App.css:** Empty file, unused
- **No CSS modules, no styled-components, no CSS-in-JS**

### Tailwind Conventions
- All styling is done via **utility classes inline in JSX**
- No `@apply` directives
- No custom Tailwind theme extensions in any config file
- Arbitrary values used: `text-[#1a2744]`, `bg-[#1a2744]`, `bg-[#243460]`, `bg-[#f0f2f5]`, `text-[10px]`, `min-w-[220px]`, `min-w-[130px]`, `min-w-[120px]`, `min-w-[180px]`
- Tailwind 4 custom widths used: `w-120`, `w-130` (valid in Tailwind 4's new arbitrary value system)

### Design Tokens (Hardcoded, Not Abstracted)
There is no centralized design token file. Colors and spacing values are repeated inline. The closest thing to a shared token is the `inputClass` string defined per-file:

**In auth pages (SignUpPage, LoginPage):**
```js
const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition";
```

**In NewFilePage:**
```js
const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition placeholder-gray-400";
```

**In FileDetailPage:**
```js
const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent transition";
```

These are subtle variants (px-4 vs px-3, bg-gray-50 vs bg-white). They are the de facto token system.

### Status/Color Maps (Shared Pattern)
Color maps are defined as objects at the top of files where they're needed:
```js
const RISK_STYLES = { High: "...", Medium: "...", Low: "..." };
const STATUS_STYLES = { "Pre-Audit": "...", ... };
```

These are **duplicated** across `FilesPage.jsx` and `FileDetailPage.jsx`. No shared constants file exists.

### Component Libraries / UI Frameworks
**None.** Zero external UI libraries. No Material UI, Ant Design, Shadcn, Radix, Headless UI, etc.

### Icon Libraries
**None.** All icons are handwritten inline SVG.

### Chart Libraries
**None.** KPI display uses custom div-based stat cards only.

### State Management
**Local React state only** (`useState`, `useEffect`). No Redux, Zustand, Context API, or any global state manager.

### Data Persistence
- **localStorage:** User accounts (`ulb_users`), session (`ulb_session`), file records (`ulb_files`), version history (`ulb_version_history`)
- **IndexedDB:** File attachments (binary blobs) via `src/utils/db.js`

---

## 10. Page-Level Pattern Library

### Auth Pages (Login, Signup)
- Full viewport centered layout
- Brand header above the card
- White card with `shadow-md`, `max-w-md`, `p-8`
- `space-y-4` form fields
- Error message between last field and submit
- Footer link to the alternate auth screen

### List Pages (FilesPage, AttendancePage)
- Page header: `text-2xl font-bold` + subtitle + primary CTA button (top right)
- Filter bar: `bg-white rounded-xl border` with search input + select filters
- Data table: `bg-white rounded-xl border overflow-hidden flex-1`
- Empty state in table body
- Row click or button click navigates to detail view (inline state swap, not route change)

### Detail Pages (FileDetailPage)
- Back link at top (`← Back to Files`)
- Page heading = record identifier (file number)
- Underline tab navigation
- 2-column card grid for structured data
- Edit/Save/Cancel controls above the grid
- Context-specific edit mode with reason textarea

### Form Pages (NewFilePage)
- Back link at top
- White card container (`max-w-2xl p-6`)
- Grid and stacked fields
- Drag-and-drop attachment zone
- Submit + Cancel at bottom

### Activity Module Pages (Attendance, WorkLog, Expenses, Tasks)
- Page header + CTA button (top right, conditionally shown)
- Pill tab switcher (Today/History or similar)
- Content area below tabs
- Slide-in panels for create/edit actions
- Slide-in detail panels for history records

### Dashboard (Placeholder)
Not yet implemented. Currently renders `text-4xl font-bold text-gray-300` centered placeholder text.

---

## 11. Content Style in UI

### Labels
- **Title Case:** "File Title", "Work Description", "Risk Flag", "Contract Type", "ULB", "Amount (₹)"
- Required fields marked with `<span class="text-red-500">*</span>` after the label text

### Button Text
- **Title Case:** "Sign In", "Create Account", "New File", "Add Entry", "Raise Expense", "New Task", "Submit Day", "Check In", "Confirm Check-In", "Save Changes", "Submit Request", "Create Task"

### Error Messages
- **Sentence case with period:** "An account with this email already exists." / "Invalid email or password." / "Passwords do not match." / "Full name is required."

### Placeholder Text
- **Lowercase, descriptive:** "email@test.com", "Describe the work...", "Brief description of expense...", "What needs to be done?", "e.g. 1h 30m", "Specify category..."

### Empty State Copy
- **Instructional:** 'No files yet. Click "+ New File" to create one.' / "No files match your filters." / "No tasks found." / "No documents attached to this file."

### Subtitle / Section Description
- **Sentence case, concise:** "All audit files across ULBs", "Daily timesheet of field activities", "Track and raise reimbursement requests", "Mark your visit at each allotted ULB"

### Pending Fields
- **Italic amber, explanatory:** "Available after master & resource allocation module"

### Currency Format
- Indian locale: `₹${Number(x).toLocaleString("en-IN")}` → "₹1,20,000"

### Date Format
- Indian locale: `new Date().toLocaleDateString("en-IN")` → "3/6/2026" (d/m/yyyy)
- Hardcoded display dates: `"05/03/2026"`, `"Friday, 06 March 2026"`

### Column Headers
- **All caps:** "TRACKING ID", "FILE TITLE", "ULB", "AMOUNT", "RISK", "STATUS", "DATE"

---

## 12. Accessibility and Usability Observations

### Documented as-is (no recommendations)

**Focus visibility:** `focus:ring-2 focus:ring-[#1a2744]` is applied consistently on all form inputs and selects. Buttons do not have explicit focus ring styles — they rely on browser defaults.

**ARIA attributes:** None used. No `aria-label`, `aria-expanded`, `aria-current`, `role`, or `aria-*` attributes exist anywhere in the codebase.

**Form input association:** Labels use `<label>` tags visually, but no `htmlFor`/`id` pairing associates labels to inputs programmatically.

**Error association:** Error messages are displayed as styled `<p>` elements. No `aria-describedby` linking error messages to specific form fields.

**Color contrast:** The primary navy `#1a2744` on white passes WCAG AA for normal text. Badge combinations (pastel bg + saturated text) are generally readable but not verified against WCAG contrast ratios.

**Click target sizing:** Buttons use `py-2.5` (≈10px top/bottom padding) which produces reasonable click targets (~40px height). Small action buttons (`px-3 py-1`) are ~30px tall — acceptable for desktop.

**Keyboard navigation:** No explicit keyboard trap management in slide-in panels. No focus management when panels open/close.

**Semantic HTML:** `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` are used correctly in table layouts. Heading hierarchy (`h1`, `h2`, `h3`) is used appropriately.

**Screen reader:** The app is not screen-reader optimized. No skip links, landmark roles, or descriptive alt text for SVG icons.

---

## 13. Standard to Follow Going Forward

These are the dominant patterns, already established in the codebase, that all future development must follow:

### Colors
- The only structural colors are `#1a2744` (navy) and white. Do not introduce a third structural color.
- All semantic coloring uses Tailwind's pastel + saturated pairing: `bg-{color}-100 text-{color}-{shade}`.
- Do not invent new hex colors. If a new status or tag is needed, pick from the existing Tailwind semantic palette at the `-100`/`-500` or `-100`/`-600` level.
- The app background is always `#f0f2f5`. Do not use `bg-gray-100` or `bg-slate-*` as backgrounds.

### Typography
- Every page has exactly one `text-2xl font-bold text-gray-800` heading.
- Subtitles are always `text-sm text-gray-400 mt-1`.
- Card section titles are `text-sm font-semibold text-gray-700 mb-2`.
- Table headers are always `text-xs font-semibold text-gray-400 uppercase tracking-wide`.
- Badge text is always `text-xs font-medium`.
- Do not use `text-lg` or `text-base` in table cells or form content.

### Spacing
- Main content padding: `p-8`. Do not change this.
- Card padding: `p-5` (standard) or `px-5 py-4` (flex layout cards).
- Table cell padding: `px-5 py-3.5` (data), `px-5 py-3` (headers). Do not vary.
- Form field gap: `mb-4` between fields, or `space-y-4` in slide-ins.
- Page header bottom margin: `mb-6`. Always.

### Cards
- All cards: `bg-white rounded-xl border border-gray-200`.
- Do not add `shadow-*` to dashboard cards. Shadow is reserved for elevated overlays only.
- Do not use `rounded-2xl` or `rounded-md` for card containers.

### Buttons
- Use the exact primary button pattern: `bg-[#1a2744] hover:bg-[#243460] text-white font-medium rounded-lg transition-colors`.
- Use the exact outline-primary pattern for secondary actions that are reversible.
- Use the exact outline-secondary (gray border) for cancel/back actions.
- Do not create colored buttons (green, red, blue primary buttons do not exist in this app).

### Inputs
- Use the established `inputClass` pattern. Pick the `bg-gray-50` variant for forms on white cards, `bg-white` for inputs within content cards.
- All inputs use `focus:ring-2 focus:ring-[#1a2744] focus:border-transparent focus:outline-none`.
- Do not use `border-2` on inputs.

### Badges
- Always `text-xs font-medium px-2.5 py-1 rounded-full`.
- Always paired as `bg-{color}-100 text-{color}-{shade}`.
- Never interactive.

### Slide-in Panels
- Use the established 3-section (header / scrollable body / footer) structure.
- Width: `w-96` for standard forms, wider variants only if content genuinely requires it.
- Footer: always a single full-width primary button.
- Close: always via backdrop click + header × button.

### Navigation
- Do not modify the sidebar structure.
- New top-level modules go in the nav array.
- Modules exclusive to `Field Operations Staff` role must be conditionally rendered using `session?.role === "Field Operations Staff"`.

### Tables
- Always `bg-white rounded-xl border border-gray-200 overflow-hidden`.
- Always include an empty state row.
- Row hover: `hover:bg-gray-50 transition-colors`. Always.

### Transitions
- Use only `transition-colors`. Do not introduce `transition-transform` (except the accordion chevron), `translate`, `scale`, or keyframe animations.

---

## 14. AI Handoff Section

### Instructions for Any Future AI Working on This Codebase

**Visual language**
- Maintain the flat, enterprise aesthetic. Do not add illustrations, gradients, decorative patterns, or visual flourishes of any kind.
- The two structural colors are `#1a2744` (navy) and white. Do not introduce purple, teal, indigo, or any other brand-level color.
- All semantic coloring (statuses, tags, badges) uses Tailwind pastel pairs: `bg-{color}-100 text-{color}-500/600`.

**Color discipline**
- Do not use `bg-blue-500`, `bg-green-500`, or any saturated fill colors on UI elements. Saturated colors exist only as badge text, never as backgrounds.
- Do not invent new hex values. If you need a new status color, use an existing Tailwind color at the `-100`/`-500` level that is not already taken.

**Typography discipline**
- One `text-2xl font-bold` heading per page. One `text-sm text-gray-400` subtitle below it.
- All body content in table cells: `text-sm`. No larger.
- All badge text: `text-xs font-medium`.
- All form labels: `text-sm font-medium text-gray-700`.
- Do not use `text-lg` in the main content area.

**Spacing discipline**
- `p-8` on the main content wrapper. Do not pad individual pages differently.
- `px-5 py-3.5` on table cells. Do not invent new table cell padding.
- `mb-6` after page headers. `mb-4` between form fields.
- Card padding: `p-5` or `px-5 py-4`. Not `p-4` or `p-6` unless it is a KPI stat card (`p-4`) or form card (`p-6`).

**Component reuse**
- Before building a new component, check if an existing pattern covers it: cards, tables, slide-in panels, pill tabs, underline tabs, badges, stat cards, filter bars, back links, empty states.
- Do not create new button variants. Use primary, outline-primary, outline-secondary, ghost, or small-outline-primary as established.
- Do not import any external component library. Build with Tailwind utility classes only.

**Slide-in panels**
- All create/edit forms go in slide-in panels, not inline or in modals. Use the header/body/footer three-section structure.
- Standard width: `w-96`. Wider only if content genuinely demands it.
- Include backdrop click to close and a × button in the header.

**Inputs and forms**
- All inputs use the `inputClass` pattern. Do not style inputs differently from the established pattern.
- `focus:ring-2 focus:ring-[#1a2744]` on every focusable form element. No exceptions.
- Form labels in Title Case. Placeholders in lowercase.

**Icons**
- Do not import any icon library. Inline SVG only.
- Use `xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}` on all icons.
- Sizes: `w-4 h-4` (small), `w-5 h-5` (medium), `w-6 h-6` (large).

**Transitions**
- Use `transition-colors` only. Do not add slide, fade, scale, or bounce animations. The UI is static and immediate.

**State and data**
- All data is currently client-side (localStorage + IndexedDB). Do not assume a backend API exists unless explicitly told one has been added.
- Mock data for new pages should follow the existing data shape conventions.

**Page structure**
- New pages follow: back link (if nested) → `text-2xl` heading + subtitle → optional filter bar → content area.
- New Activity Log child modules follow: heading + optional CTA → pill tabs (if Today/History split exists) → content.

**Role-based visibility**
- `ULB Field Officer`: sees Dashboard, Files, Pre-Audit, Post-Audit.
- `Field Operations Staff`: sees all of the above + Activity Log accordion (Attendance, Work Log, Expenses, Tasks).
- Check role via `getSession()` from `src/utils/auth.js`. Role string is `"Field Operations Staff"`.

**Naming and copy**
- Button labels: Title Case. Error messages: Sentence case with period. Column headers: ALL CAPS. Placeholders: lowercase.
- Currency: `₹${Number(x).toLocaleString("en-IN")}`. Dates: `toLocaleDateString("en-IN")`.

---

## 15. Appendix: Code References

| File | Purpose |
|---|---|
| `src/index.css` | Only global CSS — Tailwind import + body reset |
| `src/App.jsx` | Route definitions |
| `src/layouts/MainLayout.jsx` | Sidebar, header, nav accordion, RBAC, content router |
| `src/components/AuthCard.jsx` | Auth page shell — brand header + card wrapper |
| `src/pages/LogInPage.jsx` | Login form — inputClass definition, error pattern, primary button |
| `src/pages/SignUpPage.jsx` | Signup form — role selector, same inputClass |
| `src/pages/FilesPage.jsx` | Master list pattern — table, filters, RISK_STYLES, STATUS_STYLES, download dropdown |
| `src/pages/FileDetailPage.jsx` | Detail view pattern — underline tabs, EditRow component, version diff display, Row component, inputClass |
| `src/pages/NewFilePage.jsx` | Form page pattern — drag-and-drop zone, grid layout, inputClass |
| `src/pages/AttendancePage.jsx` | List with inline expansion — table + inline row expansion pattern |
| `src/pages/WorkLogPage.jsx` | Complex page — slide-in panel (EntryPanel), history detail panel, per-entry status, ACTIVITY_BADGE map |
| `src/pages/ExpensesPage.jsx` | Stat cards + table + slide-in — KPI card pattern, status filter tabs |
| `src/pages/TasksPage.jsx` | Card grid + slide-in — TaskCard component, dual-tab layout, PRIORITY_STYLES, STATUS_STYLES |
| `src/utils/auth.js` | User/session management — role values, localStorage keys |
| `src/utils/db.js` | IndexedDB wrapper — attachment storage |
| `vite.config.js` | Vite + Tailwind CSS 4 plugin setup |
| `package.json` | Dependency versions — React 19, Tailwind 4, React Router 7 |

**Key color values appearing in code:**
- `#1a2744` — primary navy (sidebar, buttons, rings)
- `#243460` — navy hover
- `#f0f2f5` — app background
- `amber-400` — logo mark, avatar (Tailwind token)
- All other colors are standard Tailwind palette tokens at `-50`, `-100`, `-200`, `-400`, `-500`, `-600` shades
