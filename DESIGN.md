# Maison - Design Document & Workflows

## Aesthetic Direction: "Maison" (French Fashion House Editorial)

The app feels like stepping into a curated Parisian atelier. Warm parchment backgrounds
with a deep espresso sidebar. Terracotta accents punctuate interactions. Playfair Display
serif headings evoke fashion editorial typography. A subtle grain texture adds tactile depth.
Every transition is deliberate and smooth.

---

## Implementation Status

### Pages (all browser-verified 2026-03-05)

| Page | Route | Status | Key Features Verified |
|------|-------|--------|----------------------|
| Dashboard | `/` | Done | Greeting, outfit cards, weather widget, weekly summary, quick actions, wardrobe stats |
| Wardrobe | `/wardrobe` | UI-Done | 12 demo items, color dots, favorites, dirty badges, layer/status filters, grid/list toggle |
| Planner | `/planner` | UI-Done | 7-day grid, today highlight, weather temps, outfit items, swap/regen, approve, week nav |
| Matching | `/matching` | UI-Done | 4 group cards, item tags, compatibility pairs, new group button |
| Rules | `/rules` | UI-Done | 8-layer wear limits, consecutive checkboxes, color clash list, reset defaults |
| Settings | `/settings` | UI-Done | Profile fields, temp unit, week start, data export/import, delete account |
| Login | `/login` | Done | Split-screen branding, Google OAuth button, Maison gold logo |

### Components

| Component | File | Status |
|-----------|------|--------|
| AppLayout | `components/layout/AppLayout.tsx` | Done |
| Sidebar | `components/layout/Sidebar.tsx` | Done |
| Button | `components/common/Button.tsx` | Done + tested |
| Skeleton | `components/common/Skeleton.tsx` | Done |
| ToastProvider | `contexts/ToastContext.tsx` | Done |
| AuthProvider | `contexts/AuthContext.tsx` | Done (demo user) |

### Pending for Full Functionality
- Supabase connection (auth, database, storage)
- AddItemModal with photo upload
- SwapModal for outfit item replacement
- Onboarding flow (3 steps)
- Real data persistence (currently demo data)
- Service layer (wardrobeService, plannerService, matchingService, rulesService)

---

## Critical Workflows

### 1. First-Time User Flow
```
Login (Google) -> Onboarding (3 steps) -> Dashboard
     |                  |
     |          Step 1: Location & Preferences
     |          Step 2: Upload First Items (bulk)
     |          Step 3: Set Basic Rules
     |
     v
  Returning users skip to Dashboard
```

### 2. Add Clothing Item Flow
```
Wardrobe Page -> [+] Add Item -> Photo Upload -> Crop (1:1)
     |                                |
     |                        Background Removal (optional)
     |                                |
     |                        Compression (<1MB)
     |                                |
     v                         Set Metadata:
  Grid updates    <---    [name, layer, color, temp range, season]
  with new item                    |
                              Save to Supabase
```

### 3. Weekly Plan Generation Flow
```
Planner Page -> Select Week -> "Generate Week"
     |                              |
     |                    Rule Engine evaluates:
     |                    - Clean items only
     |                    - Temperature/season fit
     |                    - Max wears/week not exceeded
     |                    - No consecutive day violations
     |                    - Color clash avoidance
     |                    - Group compatibility
     |                              |
     |                    Score & rank combinations
     |                              |
     v                         Show 7-day plan
  Review Plan                       |
     |              +------ Swap Item (per slot)
     |              +------ Regenerate Day
     |              +------ Regenerate Week
     |                              |
     v                              v
  "Approve Plan" ---------> Lock plan
     |                      Increment wear counts
     v                      Mark items scheduled
  Plan saved to history
```

### 4. Item Swap Flow
```
Day Card -> Click item slot -> Swap Modal opens
     |                              |
     |                    Show valid alternatives:
     |                    - Same layer type
     |                    - Clean & available
     |                    - Compatible with other items in outfit
     |                    - Within temp/season constraints
     |                              |
     v                         Select replacement
  Day Card updates              |
  with swapped item      <------+
```

### 5. Matching Group Flow
```
Matching Page -> Create Group -> Name + Select Items
     |                              |
     |                    Items can span layers
     |                    (e.g., "Earth Tones" group)
     |                              |
     v                         Save Group
  Compatibility Matrix              |
     |                    Set which groups match
     |                    (symmetric: A matches B = B matches A)
     v
  Groups feed into Plan Generator
```

---

## UI Mockups (ASCII)

### App Layout
```
+--+------------------------------------------------------+
|  |  Header: Page Title              [Search] [Profile]  |
|  +------------------------------------------------------+
|S |                                                      |
|I |                                                      |
|D |              MAIN CONTENT AREA                       |
|E |                                                      |
|B |         (varies by page - see below)                 |
|A |                                                      |
|R |                                                      |
|  |                                                      |
|  |                                                      |
+--+------------------------------------------------------+
```

### Sidebar (Collapsed: icons only | Expanded: icons + labels)
```
+--------+          +--+
| MAISON |          |Ma|
|--------|          |--|
| [] Dash|          |[]|
| [] Ward|          |[]|
| [] Plan|          |[]|
| [] Match|         |[]|
| [] Rules|         |[]|
|        |          |  |
|--------|          |--|
| Sarah  |          |  |
| Helsinki|         |  |
| [] Sett|          |[]|
| [] Sign |         |[]|
+--------+          +--+
 expanded           collapsed
```

### Dashboard Page
```
+--+------------------------------------------------------+
|  |  Good morning, Sarah                    [Mar 5, 2026]|
|  +------------------------------------------------------+
|  |                                                      |
|  |  +--TODAY'S OUTFIT--------+  +--WEATHER-----------+  |
|  |  | [Coat] [Knit] [Tee]   |  | 12C  Partly Cloudy |  |
|  |  | [Jeans] [Boots]       |  | Helsinki, Finland  |  |
|  |  |                        |  | Hi: 14  Lo: 8      |  |
|  |  +------------------------+  +---------------------+  |
|  |                                                      |
|  |  +--WEEKLY SUMMARY-+ +--QUICK----+ +--WARDROBE----+  |
|  |  | M T W T F S S   | | [+] Add   | | 47 items     |  |
|  |  | v v v - - - -   | | [>] Plan  | | 5 in laundry |  |
|  |  | 3/7 planned     | | [~] Wash  | | 12 planned   |  |
|  |  +-----------------+ +-----------+ +--------------+  |
+--+------------------------------------------------------+
```

### Wardrobe Page
```
+--+------------------------------------------------------+
|  |  My Wardrobe (12 items)                 [+ Add Item] |
|  +------------------------------------------------------+
|  |  Filter: [All Layers v] [All Status v]     [grid|list]|
|  +------------------------------------------------------+
|  |                                                      |
|  |  +--------+ +--------+ +--------+ +--------+        |
|  |  |o PHOTO*| |o PHOTO | |o PHOTO*| |o PHOTO |        |
|  |  |        | |        | |        | |   Dirty |        |
|  |  |--------|+|--------| |--------| |--------|        |
|  |  |WoolCoat||NavyBlzr | |CrmKnit | |WhtShirt|        |
|  |  |OUTER 14||TOPOVR 8 | |TOPBS 11| |TOPBS 22|        |
|  |  +--------+ +--------+ +--------+ +--------+        |
|  |  (* = favorite sparkle, o = color dot)               |
+--+------------------------------------------------------+
```

### Weekly Planner Page
```
+--+------------------------------------------------------+
|  |  Weekly Planner         [Approve Plan] [Regenerate]  |
|  +------------------------------------------------------+
|  |        < Mar 2 - Mar 8, 2026 >     DRAFT            |
|  +------------------------------------------------------+
|  |                                                      |
|  | MON 8*  TUE 10* WED 12* THU 11* FRI 9*  SAT   SUN  |
|  | +-----+ +-----+ +-----+ +-----+ +-----+ +---+ +---+|
|  | |Outer| |Outer| |Outer| |Outer| |Outer| | O | | O ||
|  | |Top  | |Top  | |Top  | |Top  | |Top  | | T | | T ||
|  | |Bottm| |Bottm| |Bottm| |Bottm| |Bottm| | B | | B ||
|  | |Foot | |Foot | |Foot | |Foot | |Foot | | F | | F ||
|  | |Swap | |Swap | |Swap | |Swap | |Swap | |   | |   ||
|  | |Regen| |Regen| |Regen| |Regen| |Regen| |   | |   ||
|  | +-----+ +-----+ +-----+ +-----+ +-----+ +---+ +---+|
|  |  (* = weather temp per day, THU highlighted = today) |
+--+------------------------------------------------------+
```

### Onboarding Flow
```
Step 1/3                    Step 2/3                    Step 3/3
+--------------------+     +--------------------+     +--------------------+
|   Welcome to       |     |  Build Your        |     |  Set Your          |
|    MAISON          |     |   Wardrobe         |     |   Rules            |
|                    |     |                    |     |                    |
| Your name:         |     | Drag & drop photos |     | Max wears/week:    |
| [____________]     |     | or click to upload |     | Outer:  [2] v      |
|                    |     |                    |     | Tops:   [1] v      |
| Location:          |     | +--+ +--+ +--+    |     | Bottoms:[2] v      |
| [____________]     |     | |+ | |+ | |+ |    |     | Shoes:  [2] v      |
|                    |     | +--+ +--+ +--+    |     |                    |
| Preferred layers:  |     | +--+ +--+ +--+    |     | Consecutive days:  |
| [x] Outer          |     | |+ | |+ | |+ |    |     | [ ] Allow same     |
| [x] Top            |     | +--+ +--+ +--+    |     |     item 2 days    |
| [x] Bottom         |     |                    |     |                    |
| [x] Footwear       |     | We'll auto-detect  |     |                    |
| [ ] Accessory      |     | colors and layers  |     |                    |
| [ ] Bag            |     |                    |     |                    |
|                    |     |                    |     |                    |
|        [Next ->]   |     |   [<- Back][Next]  |     |   [<- Back][Done!] |
+--------------------+     +--------------------+     +--------------------+
```

---

## Requirements Refinements

### Added/Modified Requirements (from original spec)
1. **REQ-090 refined**: Changed to "Maison" design system with specific color/font tokens
2. **REQ-170 expanded**: Dashboard now includes weather widget, today's outfit, weekly summary
3. **REQ-095 refined**: Onboarding is 3 steps (profile, upload, rules) not generic
4. **Added REQ-091**: Background grain texture for depth (CSS noise pattern) - Done
5. **Added REQ-092**: Page transition animations (Framer Motion variants) - Done
6. **Added REQ-098**: Staggered card reveal animations on grid pages - Done

### Phase Prioritization
- **Phase 1**: Auth + Wardrobe CRUD + Dashboard + Layout + Design System *(UI mostly done)*
- **Phase 2**: Planner + Rules + Matching + History *(UI done, logic pending)*
- **Phase 3**: AI features + Bulk upload intelligence + Feedback
- **Phase 4**: Analytics + Advanced features + Accessibility polish
- **Phase 5**: PWA + Offline + Push notifications

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Styling | Tailwind CSS v4 | @theme tokens, JIT, no config file needed |
| State | Context + hooks | Simpler than Redux for this scale |
| Routing | React Router v7 | Standard, nested layouts, data loading |
| Animation | Framer Motion 12 | Best React animation lib, layout animations |
| Forms | React Hook Form | Performance, validation (installed, not yet used) |
| Image processing | browser-image-compression | Client-side, no server cost (installed) |
| Background removal | @imgly/background-removal | Client-side ONNX model (not yet installed) |
| Icons | Lucide React | Clean, consistent, tree-shakable |
| Date handling | date-fns | Lightweight, functional |
| Testing | Vitest + RTL | Modern, fast, 9 tests passing |
| Path alias | `@/` -> `src/` | Configured in tsconfig + vite |
