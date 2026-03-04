import { describe, it, expect } from 'vitest';
import { LAYERS, CLOTHING_COLORS, SEASONS } from './index';

describe('Type Constants', () => {
  it('defines 8 layer types', () => {
    expect(LAYERS).toHaveLength(8);
    const values = LAYERS.map(l => l.value);
    expect(values).toContain('outer');
    expect(values).toContain('top-over');
    expect(values).toContain('top-base');
    expect(values).toContain('dress');
    expect(values).toContain('bottom');
    expect(values).toContain('footwear');
    expect(values).toContain('accessory');
    expect(values).toContain('bag');
  });

  it('defines 22 clothing colors', () => {
    expect(CLOTHING_COLORS).toHaveLength(22);
  });

  it('defines 5 seasons', () => {
    expect(SEASONS).toHaveLength(5);
    expect(SEASONS.map(s => s.value)).toContain('all-year');
  });

  it('all colors have hex values', () => {
    CLOTHING_COLORS.forEach(color => {
      expect(color.hex).toBeTruthy();
    });
  });
});
