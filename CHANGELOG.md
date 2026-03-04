# Changelog

All notable changes to Maison (Clothing Planner v3) will be documented in this file.

## [0.1.0] - 2026-03-04

### Added
- Project initialization with Vite + React 18 + TypeScript
- "Maison" design system: Playfair Display + DM Sans typography, warm parchment/espresso/terracotta palette
- Tailwind CSS v4 integration with custom theme tokens
- Collapsible sidebar navigation with Framer Motion animations
- Dashboard page with today's outfit, weather widget, weekly summary, quick actions, wardrobe stats
- Wardrobe page with clothing grid, layer/status filters, grid/list view toggle
- Weekly Planner page with 7-day grid, week navigation, outfit items per day, swap/regen actions
- Matching Groups page with group cards and compatibility section
- Rules page with per-layer wearing limits and color clash configuration
- Settings page with profile, preferences, data export/import, account deletion
- Login page with Google OAuth button and split-screen branding
- Auth context with demo user for development
- Toast notification system with success/error/info variants
- Skeleton loader components
- Button component with primary/secondary/ghost/danger variants
- TypeScript types for all domain models (ClothingItem, WeekPlan, WearingRule, etc.)
- Constants for layers (8 types), colors (22 predefined), seasons, default rules
- CLAUDE.md project guidelines
- DESIGN.md with aesthetic direction, critical workflows, ASCII UI mockups
- REQUIREMENTS.csv with 80+ categorized requirements across 5 phases
