# Clothing Planner v3 - Project Guidelines

## Project Overview
**Maison** - A luxury wardrobe management and weekly outfit planner.
Stack: React 19 + TypeScript 5.9 + Vite 7 + Supabase + Tailwind CSS v4 + Framer Motion 12

## Architecture
- **Frontend**: React SPA with React Router v7, component-driven architecture
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions) - not yet connected
- **State**: React Context + custom hooks (no Redux)
- **Styling**: Tailwind CSS v4 with `@theme` tokens in `src/styles/globals.css`
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Testing**: Vitest + React Testing Library (unit), Chrome browser automation (visual)

## Design System - "Maison" Aesthetic
### Colors (defined in src/styles/globals.css @theme block)
- Background: `parchment` (#FAF7F2), `parchment-dark` (#F0EBE3), `parchment-deep` (#E5DED4)
- Sidebar/Dark: `espresso` (#1A1412), `espresso-light` (#2C2420), `espresso-mid` (#3D332C)
- Primary accent: `terracotta` (#C4654A), `terracotta-light` (#D4856E), `terracotta-dark` (#A44E36)
- Secondary: `sage` (#7D8E7D), `sage-light` (#A3B0A3), `sage-dark` (#5E6E5E)
- Gold: `gold` (#B89B6E), `gold-light` (#D4BC94), `gold-dark` (#96794E)
- Text: `ink` (#1A1412), `ink-light` (#6B5E54), `ink-muted` (#9B8E84)
- Error: `rouge` (#B94A4A), `rouge-light` (#D47070)
- Shadows: `shadow-maison`, `shadow-maison-md`, `shadow-maison-lg` (warm-toned)

### Typography (loaded via Google Fonts in index.html)
- Display/Headings: "Playfair Display" (serif, elegant, fashion-editorial) - `font-display`
- Body/UI: "DM Sans" (clean, modern, highly readable) - `font-body`
- Mono/Data: "JetBrains Mono" (code/data display) - `font-mono`

### Design Principles
1. **Photo-centric**: Clothing images are heroes - large, well-cropped, minimal overlay
2. **Editorial spacing**: Generous whitespace, deliberate asymmetry
3. **Warm & organic**: No cold blues/grays - everything warm-toned
4. **Subtle grain**: Background SVG noise texture (body::before) for tactile depth
5. **Motion with purpose**: Staggered reveals, smooth transitions via `EASE_MAISON` curve

## Tailwind CSS v4 Notes
- Tokens defined in `@theme {}` block in `src/styles/globals.css`, NOT in tailwind.config.ts
- Import via `@import "tailwindcss"` at top of globals.css
- Plugin added via `@tailwindcss/vite` in vite.config.ts
- Custom colors/shadows/fonts available as Tailwind utilities (e.g., `bg-parchment`, `text-terracotta`)

## File Structure
```
src/
  components/
    layout/          # AppLayout, Sidebar
    common/          # Button, Skeleton
    wardrobe/        # ClothingCard, AddItemModal, EditItemModal, BulkUploadModal, BulkMetadataEditModal
    planner/         # SwapModal
    matching/        # AddGroupModal, EditGroupModal
    rules/           # (planned) RulesEditor, ColorClashEditor
    dashboard/       # (planned) DashboardWidgets, TodayOutfit
  pages/             # DashboardPage, WardrobePage, PlannerPage, MatchingPage, RulesPage, SettingsPage, LoginPage
  services/          # wardrobeService, rulesService, matchingService, imageProcessingService, backupService, planService, generatorService
  hooks/             # useWardrobe, useRules, useMatching, usePlanner, useMediaQuery, useMobileMenu
  types/             # TypeScript interfaces, enums, constants (Layer, ClothingItem, BackupData, etc.)
  lib/               # animations.ts, constants.ts
  styles/            # globals.css (Tailwind + @theme tokens + grain texture)
  contexts/          # AuthContext, ToastContext
  test/              # setup.ts (jest-dom)
```

## Conventions
- **Components**: PascalCase, one component per file, co-located test files (*.test.tsx)
- **Hooks**: `use` prefix, return objects not arrays
- **Services**: camelCase, async functions, typed returns
- **Types**: PascalCase interfaces, UPPER_SNAKE for constants/enums
- **File naming**: PascalCase for components, camelCase for services/hooks/utils
- **Animations**: Use shared variants from `lib/animations.ts` (stagger, fadeUp, fadeIn, scaleIn)
- **Framer Motion ease**: Always cast as `[number, number, number, number]` or use `EASE_MAISON`

## Layer Types (8 total)
`outer` | `top-over` | `top-base` | `dress` | `bottom` | `footwear` | `accessory` | `bag`

## Predefined Colors (22)
black, white, gray, navy, blue, light-blue, teal, green, olive, khaki,
brown, tan, beige, cream, burgundy, red, coral, pink, purple, lavender, yellow, multi

## Mobile Responsiveness
- **Primary breakpoint:** `md:` (768px) — below this, sidebar becomes a drawer and layouts go single-column
- **Sidebar:** Desktop: fixed with collapse toggle. Mobile: hidden, slides in from left as overlay drawer via `useMobileMenu`
- **Mobile top bar:** `md:hidden` fixed bar with hamburger + MAISON logo, `h-14`
- **Layout offset:** `md:ml-[260px]` (no left margin on mobile), `p-4 md:p-8`, `pt-18 md:pt-8`
- **Touch support:** PlannerPage uses both `PointerSensor` (8px) and `TouchSensor` (200ms delay, 5px tolerance)
- **Responsive grids:** Pages use `grid-cols-1 md:grid-cols-12`, `sm:grid-cols-2`, `lg:grid-cols-5/7`
- **Modals:** Padding `p-3 sm:p-5`, form grids `grid-cols-1 sm:grid-cols-2`, item grids `grid-cols-2 sm:grid-cols-3`
- **Headers:** Stack vertically on mobile via `flex-col sm:flex-row` or `flex-col md:flex-row`

## Key Patterns
- All Supabase tables will use RLS (Row-Level Security)
- Auth via Google OAuth with PKCE flow (currently demo user in AuthContext)
- Images compressed client-side before upload (max 1MB) - browser-image-compression installed
- Toast notifications for all user feedback (ToastContext)
- Skeleton loaders for all async content (Skeleton component)
- All forms validate before submission (react-hook-form installed)
- Path alias `@/` maps to `src/` (configured in tsconfig.app.json + vite.config.ts)
- Drag-drop in PlannerPage via `@dnd-kit/core` (PointerSensor + TouchSensor for mobile)
- Bulk operations batch API calls in groups of 10 (Promise.all) to avoid rate limits
- Backup export/import via `backupService.ts` — generates new UUIDs on import, remaps references
- Dashboard is data-driven: uses `useWardrobe`, `useRules`, `usePlanner` for real stats

## Git Workflow
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Update CHANGELOG.md on every meaningful change
- Update REQUIREMENTS.csv status when implementing features (Planned -> UI-Done -> Done)
- Test before committing (both unit tests and browser verification)

## Requirement Statuses
- **Planned**: Not started
- **UI-Done**: Frontend UI built with demo data; backend/persistence not connected
- **Done**: Fully implemented and verified

## Testing Strategy
- **Unit**: Vitest + RTL for component logic and services (`npx vitest run`)
- **Browser**: Chrome automation for visual/UX verification
- **Coverage target**: 80%+ for services, 60%+ for components
