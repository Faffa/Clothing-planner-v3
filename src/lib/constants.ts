import type { Layer, WearingRule, ColorClash } from '@/types';

export const DEFAULT_WEARING_RULES: Omit<WearingRule, 'id' | 'user_id'>[] = [
  { layer: 'outer', max_per_week: 3, allow_consecutive: true },
  { layer: 'top-over', max_per_week: 2, allow_consecutive: false },
  { layer: 'top-base', max_per_week: 1, allow_consecutive: false },
  { layer: 'dress', max_per_week: 1, allow_consecutive: false },
  { layer: 'bottom', max_per_week: 2, allow_consecutive: true },
  { layer: 'footwear', max_per_week: 3, allow_consecutive: true },
  { layer: 'accessory', max_per_week: 5, allow_consecutive: true },
  { layer: 'bag', max_per_week: 5, allow_consecutive: true },
];

export const DEFAULT_COLOR_CLASHES: ColorClash[] = [
  { color_a: 'red', color_b: 'pink' },
  { color_a: 'red', color_b: 'burgundy' },
  { color_a: 'navy', color_b: 'black' },
  { color_a: 'brown', color_b: 'black' },
];

export const LAYER_LABELS: Record<Layer, string> = {
  'outer': 'Outer',
  'top-over': 'Top Over',
  'top-base': 'Top Base',
  'dress': 'Dress',
  'bottom': 'Bottom',
  'footwear': 'Footwear',
  'accessory': 'Accessory',
  'bag': 'Bag',
};

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/wardrobe', label: 'Wardrobe', icon: 'Shirt' },
  { path: '/planner', label: 'Planner', icon: 'Calendar' },
  { path: '/matching', label: 'Matching', icon: 'Puzzle' },
  { path: '/rules', label: 'Rules', icon: 'SlidersHorizontal' },
] as const;

export const NAV_BOTTOM = [
  { path: '/settings', label: 'Settings', icon: 'Settings' },
] as const;
