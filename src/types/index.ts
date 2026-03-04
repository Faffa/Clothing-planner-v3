export type Layer =
  | 'outer'
  | 'top-over'
  | 'top-base'
  | 'dress'
  | 'bottom'
  | 'footwear'
  | 'accessory'
  | 'bag';

export type ClothingColor =
  | 'black' | 'white' | 'gray' | 'navy' | 'blue' | 'light-blue'
  | 'teal' | 'green' | 'olive' | 'khaki' | 'brown' | 'tan'
  | 'beige' | 'cream' | 'burgundy' | 'red' | 'coral' | 'pink'
  | 'purple' | 'lavender' | 'yellow' | 'multi';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all-year';

export type LaundryStatus = 'clean' | 'dirty';

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  layer: Layer;
  color: ClothingColor;
  photo_url: string | null;
  temp_min: number | null;
  temp_max: number | null;
  seasons: Season[];
  is_clean: boolean;
  is_favorite: boolean;
  wear_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  location: string | null;
  temp_unit: 'celsius' | 'fahrenheit';
  week_start_day: 'monday' | 'sunday';
  onboarding_completed: boolean;
  created_at: string;
}

export interface MatchingGroup {
  id: string;
  user_id: string;
  name: string;
  item_ids: string[];
  created_at: string;
}

export interface GroupCompatibility {
  id: string;
  group_a_id: string;
  group_b_id: string;
}

export interface WearingRule {
  id: string;
  user_id: string;
  layer: Layer;
  max_per_week: number;
  allow_consecutive: boolean;
}

export interface ColorClash {
  color_a: ClothingColor;
  color_b: ClothingColor;
}

export interface DayOutfit {
  date: string;
  items: Record<Layer, ClothingItem | null>;
  is_locked: boolean;
}

export interface WeekPlan {
  id: string;
  user_id: string;
  week_start: string;
  days: DayOutfit[];
  status: 'draft' | 'approved';
  created_at: string;
  approved_at: string | null;
}

export interface OutfitTemplate {
  id: string;
  user_id: string;
  name: string;
  items: Record<Layer, string | null>; // item IDs
  created_at: string;
}

export const LAYERS: { value: Layer; label: string; icon: string }[] = [
  { value: 'outer', label: 'Outer', icon: 'coat' },
  { value: 'top-over', label: 'Top Over', icon: 'shirt' },
  { value: 'top-base', label: 'Top Base', icon: 'tshirt' },
  { value: 'dress', label: 'Dress', icon: 'dress' },
  { value: 'bottom', label: 'Bottom', icon: 'pants' },
  { value: 'footwear', label: 'Footwear', icon: 'boot' },
  { value: 'accessory', label: 'Accessory', icon: 'watch' },
  { value: 'bag', label: 'Bag', icon: 'bag' },
];

export const CLOTHING_COLORS: { value: ClothingColor; hex: string }[] = [
  { value: 'black', hex: '#1a1a1a' },
  { value: 'white', hex: '#f5f5f5' },
  { value: 'gray', hex: '#9ca3af' },
  { value: 'navy', hex: '#1e3a5f' },
  { value: 'blue', hex: '#3b82f6' },
  { value: 'light-blue', hex: '#93c5fd' },
  { value: 'teal', hex: '#2dd4bf' },
  { value: 'green', hex: '#22c55e' },
  { value: 'olive', hex: '#6b7a2e' },
  { value: 'khaki', hex: '#c3b091' },
  { value: 'brown', hex: '#78552b' },
  { value: 'tan', hex: '#d2b48c' },
  { value: 'beige', hex: '#e8dcc8' },
  { value: 'cream', hex: '#f5f0e1' },
  { value: 'burgundy', hex: '#722f37' },
  { value: 'red', hex: '#ef4444' },
  { value: 'coral', hex: '#f87171' },
  { value: 'pink', hex: '#f472b6' },
  { value: 'purple', hex: '#8b5cf6' },
  { value: 'lavender', hex: '#c4b5fd' },
  { value: 'yellow', hex: '#eab308' },
  { value: 'multi', hex: 'linear-gradient(135deg, #ef4444, #eab308, #22c55e, #3b82f6)' },
];

export const SEASONS: { value: Season; label: string }[] = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
  { value: 'all-year', label: 'All Year' },
];
