# Changelog

All notable changes to Maison (Clothing Planner v3) will be documented in this file.

## [0.1.1] - 2026-03-05

### Changed
- Updated REQUIREMENTS.csv with implementation statuses (Done, UI-Done, Planned)
- Updated DESIGN.md with implementation status table and browser test results
- Updated CLAUDE.md with accurate stack versions and Tailwind v4 notes
- Updated CHANGELOG.md to track all document updates

### Verified (Browser Testing)
- Dashboard page: greeting, outfit cards, weather widget, weekly summary, quick actions, wardrobe stats
- Wardrobe page: 12 demo items in grid, color dots, favorite stars, dirty badges, layer/status filters
- Planner page: 7-day grid, today highlighted, weather temps, outfit items, swap/regen buttons
- Matching page: 4 group cards with item tags, compatibility section
- Rules page: all 8 layers with max/week dropdowns and consecutive checkboxes, color clash rules
- Settings page: profile fields, temp unit/week start dropdowns, data export/import, danger zone
- Sidebar navigation: all links working, active state highlighting, collapse toggle

## [0.1.0] - 2026-03-04

### Added
- Project initialization with Vite 7 + React 19 + TypeScript 5.9
- "Maison" design system: Playfair Display + DM Sans typography, warm parchment/espresso/terracotta palette
- Tailwind CSS v4 integration with @theme tokens in globals.css
- Collapsible sidebar navigation with Framer Motion animations
- Dashboard page with today's outfit, weather widget, weekly summary, quick actions, wardrobe stats
- Wardrobe page with clothing grid, layer/status filters, grid/list view toggle
- Weekly Planner page with 7-day grid, week navigation, outfit items per day, swap/regen actions
- Matching Groups page with group cards and compatibility section
- Rules page with per-layer wearing limits and color clash configuration
- Settings page with profile, preferences, data export/import, account deletion
- Login page with Google OAuth button and split-screen branding
- Auth context with demo user for development
- Toast notification system with success/error/info variants and AnimatePresence
- Skeleton loader components (Skeleton, CardSkeleton, ClothingCardSkeleton)
- Button component with primary/secondary/ghost/danger variants
- Shared animation constants in lib/animations.ts (stagger, fadeUp, fadeIn, scaleIn, EASE_MAISON)
- TypeScript types for all domain models (ClothingItem, WeekPlan, WearingRule, MatchingGroup, etc.)
- Constants for layers (8 types), colors (22 predefined), seasons (5), default wearing rules, color clashes
- Vitest + React Testing Library test setup with 9 passing tests
- CLAUDE.md project guidelines
- DESIGN.md with aesthetic direction, critical workflows, ASCII UI mockups
- REQUIREMENTS.csv with 80+ categorized requirements across 5 phases
- Git repository initialized
