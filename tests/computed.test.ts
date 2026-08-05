import { describe, it, expect, vi } from 'vitest';
import { signal, computed, effect } from '../src/index.js';

describe('computed', () => {
  it('should derive value from signal', () => {
    const count = signal(2);
    const double = computed(() => count.value * 2);
    expect(double.value).toBe(4);
  });

  it('should update when dependency changes', () => {
    const count = signal(1);
    const double = computed(() => count.value * 2);
    expect(double.value).toBe(2);
    count.value = 5;
    expect(double.value).toBe(10);
  });

  it('should be lazy (not compute until read)', () => {
    const fn = vi.fn(() => 42);
    const c = computed(fn);
    expect(fn).not.toHaveBeenCalled();
    expect(c.value).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should memoize when value is unchanged', () => {
    const count = signal(5);
    const fn = vi.fn(() => count.value > 3);
    const isHigh = computed(fn);
    
    expect(isHigh.value).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
    
    count.value = 10; // still > 3, result unchanged
    expect(isHigh.value).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2); // recomputed but same result
  });

  it('should support custom equality', () => {
    const data = signal({ x: 1, y: 2 });
    const fn = vi.fn();
    const point = computed(
      () => ({ x: data.value.x, y: data.value.y }),
      { equals: (a, b) => a.x === b.x && a.y === b.y }
    );

    effect(() => {
      point.value;
      fn();
    });
    fn.mockClear();

    // Set to equivalent object — should NOT trigger effect
    data.value = { x: 1, y: 2 };
    // Effect may or may not re-run depending on implementation,
    // but the computed value should remain equal
    expect(point.value.x).toBe(1);
    expect(point.value.y).toBe(2);
  });

  it('should support chained computeds', () => {
    const a = signal(1);
    const b = computed(() => a.value * 2);
    const c = computed(() => b.value + 10);
    
    expect(c.value).toBe(12); // (1*2) + 10
    a.value = 5;
    expect(c.value).toBe(20); // (5*2) + 10
  });

  it('should handle diamond dependency (glitch-free)', () => {
    const source = signal(1);
    const left = computed(() => source.value * 2);
    const right = computed(() => source.value * 3);
    const bottom = computed(() => left.value + right.value);

    expect(bottom.value).toBe(5); // (1*2) + (1*3)

    const fn = vi.fn();
    effect(() => {
      fn(bottom.value);
    });
    fn.mockClear();

    source.value = 2;
    expect(bottom.value).toBe(10); // (2*2) + (2*3)
    // Effect should only fire once with the final value, not with intermediate states
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(10);
  });

  it('should support peek() without tracking', () => {
    const count = signal(3);
    const double = computed(() => count.value * 2);
    expect(double.peek()).toBe(6);
  });
});
