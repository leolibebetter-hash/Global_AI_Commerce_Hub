# Base UI Framework — Implementation Plan

> **Goal:** Apply the design system, build layout shell + core components + i18n toggle + responsive behavior.

**Design System (from ui-ux-pro-max):**

| Token | Value |
|-------|-------|
| Primary | `#059669` (emerald-600) |
| Background | `#ECFDF5` (emerald-50) |
| Foreground | `#064E3B` (emerald-900) |
| Accent | `#EA580C` (orange-600) |
| Font | Plus Jakarta Sans, 300-700 |
| Radius | 8px (rounded-lg) |
| Spacing | 4px grid (Tailwind default) |

**Architecture:** Tailwind config extended with design tokens. Layout uses CSS Grid: sidebar (w-60) + main (flex-1). Mobile collapses sidebar into hamburger drawer. All text in i18n keys.

---

## Task 1: Design Tokens — `frontend/tailwind.config.ts`

Extend Tailwind theme with project colors, font family, and design tokens.

## Task 2: Google Font Import — `frontend/src/index.css`

Add Plus Jakarta Sans via `@import`.

## Task 3: Layout Shell — `frontend/src/components/Layout.tsx`

Sidebar (desktop) + top bar (mobile hamburger + lang toggle) + main content area.

## Task 4: Core Components

- `Button.tsx` — primary/secondary/outline/ghost variants, sm/md/lg sizes, loading state
- `Input.tsx` — labeled input with error message slot
- `Card.tsx` — container with padding + shadow + border

## Task 5: Responsive Sidebar

Collapses to hamburger drawer on mobile (<768px). Uses react-router-dom NavLink for active states.

## Task 6: Update i18n

Add navigation keys: nav.dashboard, nav.image_factory, nav.copy_factory, nav.publish, nav.settings.

## Task 7: Update App.tsx

Wrap with Layout, add react-router-dom BrowserRouter with placeholder routes.

## Task 8: Verify

Build passes, dev server starts, language toggle works, responsive at 375/768/1024/1440.
