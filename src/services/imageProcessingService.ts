import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { GoogleGenerativeAI } from '@google/generative-ai';
import imageCompression from 'browser-image-compression';
import { CLOTHING_COLORS } from '@/types';
import type { ClothingColor, Layer } from '@/types';

// ── Processing Stage Type ────────────────────────────────────────────

export type ProcessingStage = 'removing-bg' | 'detecting-color' | 'detecting-ai';

export interface ProcessingResult {
  bgBlob: Blob | null;
  bgUrl: string | null;
  color: ClothingColor;
  ai: AIDetectionResult | null;
}

// ── Image Resizing ──────────────────────────────────────────────────

/** Cache resized files to avoid double-resize. */
const resizeCache = new WeakMap<File, Promise<File>>();

/** Resize image to max 1024px on longest side for faster processing. */
async function resizeForProcessing(file: File): Promise<File> {
  const cached = resizeCache.get(file);
  if (cached) return cached;
  const promise = imageCompression(file, {
    maxWidthOrHeight: 1024,
    maxSizeMB: 1,
    useWebWorker: true,
    fileType: 'image/jpeg',
  });
  resizeCache.set(file, promise);
  return promise;
}

// ── WASM Preload ─────────────────────────────────────────────────────

let preloadPromise: Promise<void> | null = null;

/** Preload WASM models for background removal during idle time. */
export function preloadBackgroundRemoval(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    try {
      // Create a tiny 1x1 canvas to trigger WASM download
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 1, 1);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/png'));
      await imglyRemoveBackground(blob, { output: { format: 'image/png', quality: 0.1 } });
    } catch {
      // Preload is best-effort
    }
  })();
  return preloadPromise;
}

// ── Background Removal ──────────────────────────────────────────────

export async function removeBackground(file: File): Promise<Blob> {
  const resized = await resizeForProcessing(file);
  const blob = await imglyRemoveBackground(resized, {
    output: { format: 'image/png', quality: 0.9 },
  });
  return blob;
}

// ── Dominant Color Detection (Canvas pixel analysis) ─────────────────

const COLOR_RGB_MAP: Record<ClothingColor, [number, number, number]> = {
  black: [26, 26, 26],
  white: [245, 245, 245],
  gray: [156, 163, 175],
  navy: [30, 58, 95],
  blue: [59, 130, 246],
  'light-blue': [147, 197, 253],
  teal: [45, 212, 191],
  green: [34, 197, 94],
  olive: [107, 122, 46],
  khaki: [195, 176, 145],
  brown: [120, 85, 43],
  tan: [210, 180, 140],
  beige: [232, 220, 200],
  cream: [245, 240, 225],
  burgundy: [114, 47, 55],
  red: [239, 68, 68],
  coral: [248, 113, 113],
  pink: [244, 114, 182],
  purple: [139, 92, 246],
  lavender: [196, 181, 253],
  yellow: [234, 179, 8],
  multi: [128, 128, 128],
};

function rgbDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export async function detectDominantColor(imageUrl: string): Promise<ClothingColor> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Build color histogram — skip transparent/near-white-bg pixels
      const rSum: number[] = [];
      const gSum: number[] = [];
      const bSum: number[] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        // Skip transparent or very light background pixels
        if (a < 128) continue;
        if (r > 240 && g > 240 && b > 240) continue;
        rSum.push(r);
        gSum.push(g);
        bSum.push(b);
      }

      if (rSum.length === 0) {
        resolve('white');
        return;
      }

      const avgR = Math.round(rSum.reduce((a, b) => a + b, 0) / rSum.length);
      const avgG = Math.round(gSum.reduce((a, b) => a + b, 0) / gSum.length);
      const avgB = Math.round(bSum.reduce((a, b) => a + b, 0) / bSum.length);

      // Find nearest predefined color
      let bestColor: ClothingColor = 'black';
      let bestDist = Infinity;
      for (const [color, rgb] of Object.entries(COLOR_RGB_MAP) as [ClothingColor, [number, number, number]][]) {
        if (color === 'multi') continue;
        const dist = rgbDistance([avgR, avgG, avgB], rgb);
        if (dist < bestDist) {
          bestDist = dist;
          bestColor = color;
        }
      }

      resolve(bestColor);
    };
    img.onerror = () => resolve('black');
    img.src = imageUrl;
  });
}

// ── Gemini AI Detection ─────────────────────────────────────────────

const VALID_LAYERS: Layer[] = ['outer', 'top-over', 'top-base', 'dress', 'bottom', 'footwear', 'accessory', 'bag'];
const VALID_COLORS: ClothingColor[] = CLOTHING_COLORS.map(c => c.value);

export interface AIDetectionResult {
  name: string;
  layer: Layer;
  color: ClothingColor;
}

export async function detectItemMetadata(file: File): Promise<AIDetectionResult | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const resized = await resizeForProcessing(file);
    const base64 = await fileToBase64(resized);

    const prompt = `Analyze this clothing item image. Return a JSON object with these fields:
- "name": A short descriptive name for the item (e.g. "Navy Wool Blazer", "White Cotton T-Shirt"). 2-4 words.
- "layer": One of: ${VALID_LAYERS.join(', ')}
  - outer = coats, jackets, parkas
  - top-over = blazers, cardigans, sweaters worn over
  - top-base = t-shirts, shirts, blouses
  - dress = dresses, jumpsuits
  - bottom = pants, jeans, skirts, shorts
  - footwear = shoes, boots, sandals
  - accessory = watches, scarves, hats, jewelry, belts, sunglasses
  - bag = bags, purses, backpacks
- "color": The dominant color, one of: ${VALID_COLORS.join(', ')}

Return ONLY valid JSON, no markdown fences.`;

    const result = await model.generateContent([
      { inlineData: { mimeType: file.type || 'image/jpeg', data: base64 } },
      prompt,
    ]);

    const text = result.response.text().trim();
    // Strip markdown fences if present
    const jsonStr = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Validate
    const name = typeof parsed.name === 'string' ? parsed.name.slice(0, 60) : 'Clothing Item';
    const layer = VALID_LAYERS.includes(parsed.layer) ? parsed.layer : 'top-base';
    const color = VALID_COLORS.includes(parsed.color) ? parsed.color : 'black';

    return { name, layer, color };
  } catch (err) {
    console.warn('Gemini detection failed:', err);
    return null;
  }
}

// ── Parallel Processing Pipeline ─────────────────────────────────────

/**
 * Process an image through BG removal + AI detection in parallel,
 * then color detection. ~30% faster than sequential.
 */
export async function processImagePipeline(
  file: File,
  dataUrl: string,
  onStage: (stage: ProcessingStage) => void,
  options?: { skipBgRemoval?: boolean },
): Promise<ProcessingResult> {
  // Run BG removal and AI detection in parallel
  onStage(options?.skipBgRemoval ? 'detecting-ai' : 'removing-bg');

  const bgPromise = options?.skipBgRemoval
    ? Promise.resolve(null)
    : removeBackground(file);

  const [bgResult, aiResult] = await Promise.allSettled([
    bgPromise,
    detectItemMetadata(file),
  ]);

  const bgBlob = bgResult.status === 'fulfilled' ? bgResult.value : null;
  const bgUrl = bgBlob ? await fileToDataUrl(bgBlob) : null;
  const ai = aiResult.status === 'fulfilled' ? aiResult.value : null;

  // Color detection runs after (fast, uses canvas)
  onStage('detecting-color');
  let color: ClothingColor = 'black';
  try {
    color = await detectDominantColor(dataUrl);
  } catch {
    // Keep default
  }

  // AI color overrides canvas detection if available
  if (ai) {
    color = ai.color;
  }

  return { bgBlob, bgUrl, color, ai };
}

// ── URL Import ──────────────────────────────────────────────────────

export async function fetchImageFromUrl(url: string): Promise<File> {
  // Use Vite dev proxy to bypass CORS restrictions
  const fetchUrl = import.meta.env.DEV
    ? `/api/fetch-image?url=${encodeURIComponent(url)}`
    : url;
  const response = await fetch(fetchUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const blob = await response.blob();
  const ext = blob.type.split('/')[1] || 'jpg';
  return new File([blob], `imported.${ext}`, { type: blob.type });
}

// ── Clipboard ───────────────────────────────────────────────────────

export function fileFromClipboard(items: DataTransferItemList): File | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }
  return null;
}

// ── Helpers ─────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to get raw base64
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
