import Groq from 'groq-sdk';
import type { ClothingItem, Layer, WearingRule, ColorClash, DayOutfit } from '@/types';
import { LAYER_LABELS } from '@/lib/constants';
import { format, addDays } from 'date-fns';

// ── Rate Limiter ─────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 20; // requests per window
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms
const RATE_KEY = 'maison-groq-rate';

interface RateData {
  timestamps: number[];
}

function getRateData(): RateData {
  try {
    return JSON.parse(localStorage.getItem(RATE_KEY) || '{"timestamps":[]}');
  } catch {
    return { timestamps: [] };
  }
}

function recordRequest(): void {
  const data = getRateData();
  const now = Date.now();
  data.timestamps = data.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  data.timestamps.push(now);
  localStorage.setItem(RATE_KEY, JSON.stringify(data));
}

export function getRemainingRequests(): number {
  const data = getRateData();
  const now = Date.now();
  const recent = data.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  return Math.max(0, RATE_LIMIT_MAX - recent.length);
}

function checkRateLimit(): void {
  if (getRemainingRequests() <= 0) {
    throw new Error('AI rate limit reached. Try again later.');
  }
}

// ── Groq Client ──────────────────────────────────────────────────────

function getGroqClient(): Groq | null {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
}



function describeRules(rules: WearingRule[], clashes: ColorClash[]): string {
  const ruleLines = rules.map(r =>
    `${LAYER_LABELS[r.layer]}: max ${r.max_per_week}/week, ${r.allow_consecutive ? 'consecutive OK' : 'no consecutive'}`
  );
  const clashLines = clashes.map(c => `${c.color_a} + ${c.color_b}`);
  return `Wearing rules:\n${ruleLines.join('\n')}\n\nColor clashes (avoid):\n${clashLines.join(', ') || 'none'}`;
}

// ── AI-Enhanced Generation (REQ-060b) ────────────────────────────────

export interface AIGenerationResult {
  days: DayOutfit[];
  reasoning?: string;
}

export async function generateWeekPlanAI(
  items: ClothingItem[],
  rules: WearingRule[],
  clashes: ColorClash[],
  weekStart: string,
): Promise<AIGenerationResult> {
  const groq = getGroqClient();
  if (!groq) throw new Error('Groq API key not configured');
  checkRateLimit();

  const cleanItems = items.filter(i => i.is_clean);
  // itemMap reserved for future use with full item lookups

  // Build a compact ID reference for the prompt
  const itemRef = cleanItems.map(i =>
    `${i.id.slice(0, 8)}: ${i.name} [${LAYER_LABELS[i.layer]}, ${i.color}]`
  ).join('\n');

  const dayNames = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(weekStart), i), 'EEEE')
  );

  const prompt = `You are a fashion-savvy wardrobe planner. Generate a 7-day outfit plan.

WARDROBE (use the 8-char ID to reference items):
${itemRef}

RULES:
${describeRules(rules, clashes)}

LAYER TYPES: outer, top-over, top-base, dress, bottom, footwear, accessory, bag
- dress and bottom are mutually exclusive (pick one per day)
- Not every layer needs to be filled

GOALS:
- Create stylish, cohesive daily outfits with good color coordination
- Respect max wears per week and no-consecutive rules
- Avoid color clashes
- Vary items across the week for freshness
- Favor less-worn items for balance

Respond with ONLY valid JSON in this exact format:
{
  "reasoning": "Brief 1-2 sentence style approach",
  "days": [
    {
      "day": "${dayNames[0]}",
      "items": { "top-base": "abc12345", "bottom": "def67890", "footwear": "ghi12345" }
    }
  ]
}

Use the first 8 characters of item IDs. Only include layers that have an assigned item. Generate all 7 days: ${dayNames.join(', ')}.`;

  recordRequest();

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  const parsed = JSON.parse(content) as {
    reasoning?: string;
    days: { day: string; items: Record<string, string> }[];
  };

  // Map AI response back to full DayOutfit objects
  const days: DayOutfit[] = parsed.days.map((aiDay, idx) => {
    const date = format(addDays(new Date(weekStart), idx), 'yyyy-MM-dd');
    const dayItems: Record<Layer, ClothingItem | null> = {
      'outer': null, 'top-over': null, 'top-base': null, 'dress': null,
      'bottom': null, 'footwear': null, 'accessory': null, 'bag': null,
    };

    for (const [layer, shortId] of Object.entries(aiDay.items)) {
      if (!shortId) continue;
      // Match by prefix
      const found = cleanItems.find(i => i.id.startsWith(shortId));
      if (found && found.layer === layer) {
        dayItems[layer as Layer] = found;
      }
    }

    return { date, items: dayItems, is_locked: false };
  });

  return { days, reasoning: parsed.reasoning };
}

// ── Smart Suggestions (REQ-130) ──────────────────────────────────────

export interface OutfitSuggestion {
  items: Record<Layer, ClothingItem | null>;
  reasoning: string;
  style: string;
}

export async function getSmartSuggestions(
  items: ClothingItem[],
  _rules: WearingRule[],
  clashes: ColorClash[],
  context?: { occasion?: string; weather?: string },
): Promise<OutfitSuggestion[]> {
  const groq = getGroqClient();
  if (!groq) throw new Error('Groq API key not configured');
  checkRateLimit();

  const cleanItems = items.filter(i => i.is_clean);
  const itemRef = cleanItems.map(i =>
    `${i.id.slice(0, 8)}: ${i.name} [${LAYER_LABELS[i.layer]}, ${i.color}${i.wear_count > 10 ? ', heavily worn' : ''}${i.is_favorite ? ', favorite' : ''}]`
  ).join('\n');

  const contextStr = context
    ? `\nContext: ${context.occasion ? `Occasion: ${context.occasion}. ` : ''}${context.weather ? `Weather: ${context.weather}. ` : ''}`
    : '';

  const prompt = `You are a personal stylist. Suggest 3 complete outfit options from this wardrobe.

WARDROBE (8-char ID: name [layer, color]):
${itemRef}
${contextStr}
COLOR CLASHES to avoid: ${clashes.map(c => `${c.color_a}+${c.color_b}`).join(', ') || 'none'}

LAYER TYPES: outer, top-over, top-base, dress, bottom, footwear, accessory, bag
- dress and bottom are mutually exclusive

Create 3 distinct outfits with different vibes (e.g., casual chic, smart casual, elevated basics).

Respond with ONLY valid JSON:
{
  "suggestions": [
    {
      "style": "Casual Chic",
      "reasoning": "Why this works as an outfit",
      "items": { "top-base": "abc12345", "bottom": "def67890", "footwear": "ghi12345" }
    }
  ]
}

Use first 8 characters of item IDs. Only include layers with items.`;

  recordRequest();

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  const parsed = JSON.parse(content) as {
    suggestions: { style: string; reasoning: string; items: Record<string, string> }[];
  };

  return parsed.suggestions.map(s => {
    const outfitItems: Record<Layer, ClothingItem | null> = {
      'outer': null, 'top-over': null, 'top-base': null, 'dress': null,
      'bottom': null, 'footwear': null, 'accessory': null, 'bag': null,
    };

    for (const [layer, shortId] of Object.entries(s.items)) {
      if (!shortId) continue;
      const found = cleanItems.find(i => i.id.startsWith(shortId));
      if (found && found.layer === layer) {
        outfitItems[layer as Layer] = found;
      }
    }

    return { items: outfitItems, reasoning: s.reasoning, style: s.style };
  });
}

// ── Check if AI is available ─────────────────────────────────────────

export function isAIAvailable(): boolean {
  return !!import.meta.env.VITE_GROQ_API_KEY;
}
