# Changelog

All notable changes to Maison (Clothing Planner v3) will be documented in this file.

## [0.7.0] - 2026-03-11

### Added
- **REQ-060b**: AI-Enhanced Generation — `aiOutfitService.ts` with Groq `llama-3.3-70b-versatile` model; `generateWeekPlanAI()` creates style-aware 7-day outfit plans; "AI Generate" button in PlannerPage header and empty state; auto-fallback to rule-based generation on failure
- **REQ-130**: Smart Suggestions — `getSmartSuggestions()` generates 3 distinct outfit recommendations with style labels and reasoning; `SuggestionsModal` with optional occasion context input; "Suggestions" button in PlannerPage header
- **REQ-150/151/152**: Feedback System — `feedbackService.ts` (Supabase + localStorage fallback); `useFeedback` hook with toggle; floating `FeedbackButton` component auto-detects current page; `FeedbackPage` with status filter (new/parked/done/cancelled), status transitions, and delete; sidebar nav link; toggle on/off from FeedbackPage header
- Client-side rate limiting for Groq API (20 requests/hour) with `getRemainingRequests()` check
- Supabase migration for `feedback` table with RLS

### Changed
- `usePlanner` hook now exports `generateAI` callback alongside `generate`
- `AppLayout` renders floating `FeedbackButton` when enabled
- Sidebar nav now includes Feedback link
- PlannerPage empty state shows both AI and Rule-Based generation options
- `.env.example` updated with `VITE_GROQ_API_KEY`

### New Files
- `src/services/aiOutfitService.ts`
- `src/services/feedbackService.ts`
- `src/hooks/useFeedback.ts`
- `src/components/planner/SuggestionsModal.tsx`
- `src/components/feedback/FeedbackButton.tsx`
- `src/pages/FeedbackPage.tsx`
- `supabase/migrations/20260311_add_feedback.sql`

## [0.6.0] - 2026-03-11

### Added
- **REQ-023**: Bulk Delete — "Delete Selected" danger button in selection toolbar with two-click confirmation; `bulkDeleteItems()` in useWardrobe batches deletions in groups of 10
- **REQ-022**: Photo Retake — `PhotoRetakeModal` for re-photographing items; camera icon in ClothingCard hover overlay; full crop → BG removal → save pipeline preserving metadata
- **REQ-046**: Per-Item Rule Override — `ItemRuleOverride` type with `max_per_week` and `allow_consecutive` fields; collapsible override section in EditItemModal with inherit/custom tri-state; `scoreItem()` in generatorService checks item overrides before layer rules; Supabase migration for `rule_override` jsonb column
- **REQ-035**: Outfit Templates — `templateService` (Supabase-first with localStorage fallback); `useTemplates` hook; `TemplateListModal` with rename/delete/apply; "Save" button per day card in PlannerPage; "Apply" button per day for draft plans; "Templates" button in header; `OutfitTemplate` added to `BackupData`

### Changed
- `ClothingCard` now accepts `onRetakePhoto` prop for camera overlay button
- `generatorService.scoreItem()` uses `item.rule_override` before falling back to layer rules
- Day card actions now show "Save" (template) for all plans, not just drafts

## [0.5.0] - 2026-03-11

### Added
- **REQ-144**: Data Backup — `backupService.ts` with export/import/validate; SettingsPage wired with JSON file download and file picker import with validation + confirmation dialog
- **REQ-014**: Bulk Metadata Edit — selection mode in WardrobePage with Select/Deselect All toolbar; `BulkMetadataEditModal` for batch editing layer, color, seasons, clean/favorite status, and tags across multiple items; `bulkEditItems()` in useWardrobe batches updates in groups of 10
- **REQ-071**: Drag-Drop Reorder — `@dnd-kit/core` integration in PlannerPage; `DraggableOutfitItem` + `DroppableDayZone` components; PointerSensor with 8px activation distance to avoid click conflicts; `DragOverlay` shows floating card; `swapItemsBetweenDays()` in usePlanner; disabled for locked/approved plans
- **Dashboard (data-driven)** — DashboardPage now uses real data from `useWardrobe`, `useRules`, `usePlanner`; wardrobe stats show actual counts; today's outfit renders real plan items with photos; weekly summary reflects actual plan state; skeleton loaders during data load

### Changed
- **REQ-204**: Item Name Prefill status updated from UI-Done to Done (already functional via Gemini AI in processImagePipeline)
- `ClothingCard` now accepts `selectable`, `selected`, `onSelect` props for selection mode with checkbox overlay
- Weather widget in Dashboard now shows placeholder state instead of fake data
- `BackupData` interface added to `src/types/index.ts`

## [0.4.0] - 2026-03-11

### Added
- **REQ-004/095**: Onboarding Flow — 3-step wizard (profile → first item upload → rules overview) with split-screen layout, AnimatePresence transitions, OnboardingGuard in App.tsx
- **REQ-021**: Photo Cropping — `PhotoCropper` component with `react-image-crop`; auto-opens on upload *before* BG removal; free + 1:1 aspect ratio toggle; crop-before-process pipeline
- **REQ-024**: Search Items — search input in WardrobePage filters by name, color, and layer label
- **REQ-025**: Sort Options — dropdown in WardrobePage: Recent / Name A-Z / Most Worn / By Layer
- **REQ-033**: Visual Compatibility Matrix — upper-triangle grid with toggle cells for group compatibility; List/Matrix view toggle in MatchingPage
- **REQ-068**: Laundry Alert (UI-Done) — warning banner + red dot badges on day cards when planned items have `is_clean === false`
- **REQ-074**: Outfit History — past plan rows clickable via `jumpToWeek()`; "Current Week" back button in PlannerPage header
- GitHub Pages deployment workflow (`.github/workflows/deploy.yml`) with SPA routing hack

### Changed
- `AddItemModal` pipeline restructured: upload → preview → auto-open cropper → crop/skip → BG removal + AI detection runs once on final image
- `vite.config.ts` updated with production base path `/Clothing-planner-v3/` and manual chunk splitting
- `App.tsx` updated with `OnboardingGuard`, `/onboarding` route, and production basename
- `.gitignore` updated to exclude `.env`
- `.env.example` added with placeholder values

### New Files
- `src/pages/OnboardingPage.tsx`
- `src/components/wardrobe/PhotoCropper.tsx`
- `src/components/matching/CompatibilityMatrix.tsx`
- `.github/workflows/deploy.yml`
- `.env.example`

## [0.3.0] - 2026-03-10

### Added
- **Supabase backend fully connected** — all 8 tables verified with RLS policies
- `clothing-photos` storage bucket with per-user upload/delete policies and public read
- Profile auto-creation trigger (`handle_new_user`) fires on Google OAuth signup
- Google OAuth sign-in (REQ-001) fully configured with PKCE flow

### Changed
- 27 requirements promoted from Planned/UI-Done to **Done** now that Supabase persistence is verified
- Wardrobe CRUD (REQ-010), photo upload (REQ-011), image compression (REQ-012), bulk upload (REQ-013) all persist to Supabase
- Laundry toggle (REQ-018), favorites (REQ-026), wear count (REQ-029) persist via wardrobeService
- Matching groups (REQ-030/031), compatibility matrix (REQ-032) persist to Supabase with localStorage fallback
- Wearing rules (REQ-040/041), color clashes (REQ-043) persist via rulesService upsert
- Planner generation (REQ-060), week navigation (REQ-061), day view (REQ-062), swap (REQ-063), regen day (REQ-064), regen week (REQ-065), approve (REQ-066), valid alternatives (REQ-067) all fully wired
- Settings temp unit (REQ-141) and week start day (REQ-142) persist to profiles table
- RLS enforcement (REQ-202) verified on all tables + storage

## [0.2.0] - 2026-03-10

### Fixed
- **BUG-002**: Second upload hangs — added `setSubmitting(false)` to modal cleanup, explicit `catch` block in form submit, and slow-submit indicator after 3s
- **BUG-001**: Bulk upload no progress feedback — added per-item stage text ("Removing background...", "Detecting color...", "AI analyzing...") and terracotta progress bar in footer

### Improved
- **PERF-001**: Upload performance ~30% faster — BG removal and AI detection now run in parallel via `processImagePipeline()`, added resize cache (`WeakMap`), WASM preloads on WardrobePage mount
- Reduced Supabase `createItem` timeout from 10s to 5s for faster local fallback

### Added
- **REQ-310**: Planner defaults to 5-day (Mon–Fri) view with "Mon–Fri / Mon–Sun" toggle button; preference persists via localStorage
- **REQ-311**: Matching Groups fully functional — `matchingService.ts` with localStorage fallback CRUD, `useMatching` hook, `AddGroupModal` with item picker grid + search/filter, `EditGroupModal` with delete confirmation, `MatchingPage` rewritten with real data and compatibility dropdowns

### Changed
- `imageProcessingService.ts`: exported `ProcessingStage` type, `processImagePipeline()`, `preloadBackgroundRemoval()`
- `AddItemModal` and `BulkUploadModal` now use shared parallel pipeline
- `MatchingPage` no longer uses `DEMO_GROUPS`/`DEMO_COMPAT` — fully data-driven

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
