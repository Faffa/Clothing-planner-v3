# Clothing Planner v3 - Project Guidelines

## Project Overview
**Maison** - A luxury wardrobe management and weekly outfit planner.
Stack: React 18 + TypeScript + Vite + Supabase + Tailwind CSS + Framer Motion

## Architecture
- **Frontend**: React SPA with React Router v6, component-driven architecture
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **State**: React Context + custom hooks (no Redux)
- **Styling**: Tailwind CSS with custom design tokens in `tailwind.config.ts`
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Testing**: Vitest + React Testing Library (unit), Playwright (e2e)

## Design System - "Maison" Aesthetic
### Colors (defined in tailwind.config.ts)
- Background: `parchment` (#FAF7F2), `parchment-dark` (#F0EBE3)
- Sidebar/Dark: `espresso` (#1A1412), `espresso-light` (#2C2420)
- Primary accent: `terracotta` (#C4654A)
- Secondary: `sage` (#7D8E7D)
- Gold: `gold` (#B89B6E)
- Text: `ink` (#1A1412), `ink-light` (#6B5E54)
- Card: white with `shadow-maison` (warm-toned shadow)
- Error: `rouge` (#B94A4A)
- Success: `sage` (#7D8E7D)

### Typography
- Display/Headings: "Playfair Display" (serif, elegant, fashion-editorial)
- Body/UI: "DM Sans" (clean, modern, highly readable)
- Mono/Data: "JetBrains Mono" (code/data display)

### Design Principles
1. **Photo-centric**: Clothing images are heroes - large, well-cropped, minimal overlay
2. **Editorial spacing**: Generous whitespace, deliberate asymmetry
3. **Warm & organic**: No cold blues/grays - everything warm-toned
4. **Subtle grain**: Background noise texture for tactile depth
5. **Motion with purpose**: Staggered reveals, smooth transitions, no gratuitous animation

## File Structure
```
src/
  components/
    layout/          # AppLayout, Sidebar, Header, OnboardingGuard
    common/          # Button, Modal, Toast, Skeleton, PhotoCropper
    wardrobe/        # ClothingCard, WardrobeGrid, AddItemModal, BulkUpload
    planner/         # WeekView, DayCard, SwapModal, OutfitStack
    matching/        # GroupEditor, CompatibilityMatrix
    rules/           # RulesEditor, ColorClashEditor
    dashboard/       # DashboardWidgets, TodayOutfit, WeatherWidget
  pages/             # Page-level components (one per route)
  services/          # Supabase service modules (wardrobeService, etc.)
  hooks/             # Custom React hooks (useAuth, useWardrobe, etc.)
  types/             # TypeScript interfaces and enums
  lib/               # Utilities, constants, defaults
  styles/            # Global CSS, grain texture, font imports
  contexts/          # React Contexts (AuthContext, ToastContext)
```

## Conventions
- **Components**: PascalCase, one component per file, co-located styles if needed
- **Hooks**: `use` prefix, return objects not arrays
- **Services**: camelCase, async functions, typed returns
- **Types**: PascalCase interfaces, UPPER_SNAKE for constants/enums
- **File naming**: PascalCase for components, camelCase for services/hooks/utils

## Layer Types (8 total)
`outer` | `top-over` | `top-base` | `dress` | `bottom` | `footwear` | `accessory` | `bag`

## Predefined Colors (22)
black, white, gray, navy, blue, light-blue, teal, green, olive, khaki,
brown, tan, beige, cream, burgundy, red, coral, pink, purple, lavender, yellow, multi

## Key Patterns
- All Supabase tables use RLS (Row-Level Security)
- Auth via Google OAuth with PKCE flow
- Images compressed client-side before upload (max 1MB)
- Toast notifications for all user feedback
- Skeleton loaders for all async content
- All forms validate before submission

## Git Workflow
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Update CHANGELOG.md on every meaningful change
- Update REQUIREMENTS.csv status when implementing features
- Test before committing (both unit and browser verification)

## Testing Strategy
- **Unit**: Vitest + RTL for component logic and services
- **Browser**: Manual verification via Chrome automation for visual/UX
- **Coverage target**: 80%+ for services, 60%+ for components
