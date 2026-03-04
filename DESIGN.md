# Maison - Design Document & Workflows

## Aesthetic Direction: "Maison" (French Fashion House Editorial)

The app feels like stepping into a curated Parisian atelier. Warm parchment backgrounds
with a deep espresso sidebar. Terracotta accents punctuate interactions. Playfair Display
serif headings evoke fashion editorial typography. A subtle grain texture adds tactile depth.
Every transition is deliberate and smooth.

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
| [] Sett|          |[]|
| [] Sign |         |[]|
+--------+          +--+
 expanded           collapsed
```

### Dashboard Page
```
+--+------------------------------------------------------+
|  |  Good morning, Sarah                    [Mar 4, 2026]|
|  +------------------------------------------------------+
|  |                                                      |
|  |  +--TODAY'S OUTFIT--------+  +--WEATHER-----------+  |
|  |  |                        |  | 12C  Partly Cloudy |  |
|  |  |  [Jacket]  [Top]      |  | Helsinki, Finland  |  |
|  |  |  [Pants]   [Shoes]    |  | Hi: 14  Lo: 8      |  |
|  |  |  [Bag]                |  +---------------------+  |
|  |  |                        |                           |
|  |  +------------------------+  +--QUICK ACTIONS------+  |
|  |                              | [+] Add Item        |  |
|  |  +--WEEKLY SUMMARY--------+ | [>] Generate Plan    |  |
|  |  | Mon Tue Wed Thu Fri S S | | [~] Laundry Toggle  |  |
|  |  | [=] [=] [=] [?] [?][ ][]| +---------------------+  |
|  |  | 3/7 days planned        |                          |
|  |  +-------------------------+  +--WARDROBE STATS----+  |
|  |                              | 47 items | 5 dirty  |  |
|  |                              | 12 outfits planned  |  |
|  |                              +---------------------+  |
+--+------------------------------------------------------+
```

### Wardrobe Page
```
+--+------------------------------------------------------+
|  |  My Wardrobe (47 items)                  [+ Add Item]|
|  +------------------------------------------------------+
|  |  Filters: [All Layers v] [All Colors v] [Clean v]   |
|  +------------------------------------------------------+
|  |                                                      |
|  |  +--------+ +--------+ +--------+ +--------+        |
|  |  |  PHOTO | |  PHOTO | |  PHOTO | |  PHOTO |        |
|  |  |        | |        | |        | |        |        |
|  |  |--------|+|--------| |--------| |--------|        |
|  |  |Denim Jkt||Navy Top| |Wht Tee | |Tan Chno|        |
|  |  |outer    ||top-base| |top-base| |bottom  |        |
|  |  |[clean]  ||[clean] | |[dirty] | |[clean] |        |
|  |  +--------+ +--------+ +--------+ +--------+        |
|  |                                                      |
|  |  +--------+ +--------+ +--------+ +--------+        |
|  |  |  PHOTO | |  PHOTO | |  PHOTO | |  PHOTO |        |
|  |  |        | |        | |        | |        |        |
|  |  |--------| |--------| |--------| |--------|        |
|  |  |Blk Boot||Crossbody| |Gold Wtch| |Rain Jkt|       |
|  |  |footwear||bag      | |accessor.| |outer   |        |
|  |  |[clean] ||[clean]  | |[clean]  | |[dirty] |        |
|  |  +--------+ +--------+ +--------+ +--------+        |
|  |                                                      |
+--+------------------------------------------------------+
```

### Weekly Planner Page
```
+--+------------------------------------------------------+
|  |  Week Plan      [< Prev]  Mar 2-8, 2026  [Next >]   |
|  +------------------------------------------------------+
|  |  [Generate Week]  [Approve Plan]          Status: Draft|
|  +------------------------------------------------------+
|  |                                                      |
|  | MON       TUE       WED       THU       FRI         |
|  | +------+ +------+ +------+ +------+ +------+       |
|  | |Jacket| |Blazer| |Coat  | |Jacket| |Fleece|       |
|  | |Shirt | |Blouse| |Swetr | |Shirt | |Tee   |       |
|  | |Jeans | |Skirt | |Pants | |Chinos| |Jeans |       |
|  | |Boots | |Heels | |Sneakr| |Loafr | |Boots |       |
|  | |Bag   | |Bag   | |Backpk| |Clutch| |Tote  |       |
|  | |      | |      | |      | |      | |      |       |
|  | |[swap]| |[swap]| |[swap]| |[swap]| |[swap]|       |
|  | |[regen]| |[regen]| |[regen]| |[regen]| |[regen]|  |
|  | +------+ +------+ +------+ +------+ +------+       |
|  |                                                      |
|  | SAT       SUN                                        |
|  | +------+ +------+                                    |
|  | |Hoodie| |Coat  |                                    |
|  | |Tee   | |Knit  |                                    |
|  | |Shorts| |Jeans |                                    |
|  | |Sandal| |Boots |                                    |
|  | |      | |      |                                    |
|  | |[swap]| |[swap]|                                    |
|  | |[regen]| |[regen]|                                  |
|  | +------+ +------+                                    |
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

### Added/Modified Requirements
1. **REQ-090 refined**: Changed to "Maison" design system with specific color/font tokens
2. **REQ-170 expanded**: Dashboard now includes weather widget, today's outfit, weekly summary
3. **REQ-095 refined**: Onboarding is 3 steps (profile, upload, rules) not generic
4. **Added REQ-091**: Background grain texture for depth (CSS noise pattern)
5. **Added REQ-092**: Page transition animations (Framer Motion AnimatePresence)
6. **Added REQ-098**: Staggered card reveal animations on grid pages

### Phase Prioritization (Recommended)
- **Phase 1**: Auth + Wardrobe CRUD + Dashboard + Layout + Design System
- **Phase 2**: Planner + Rules + Matching + History
- **Phase 3**: AI features + Bulk upload intelligence + Feedback
- **Phase 4**: Analytics + Advanced features + Accessibility polish
- **Phase 5**: PWA + Offline + Push notifications

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Styling | Tailwind CSS | Rapid iteration, design token support, JIT |
| State | Context + hooks | Simpler than Redux for this scale |
| Routing | React Router v6 | Standard, nested layouts |
| Animation | Framer Motion | Best React animation lib, layout animations |
| Forms | React Hook Form | Performance, validation |
| Image processing | browser-image-compression | Client-side, no server cost |
| Background removal | @imgly/background-removal | Client-side ONNX model |
| Icons | Lucide React | Clean, consistent, tree-shakable |
| Date handling | date-fns | Lightweight, functional |
| Testing | Vitest + RTL + Playwright | Modern, fast, comprehensive |
