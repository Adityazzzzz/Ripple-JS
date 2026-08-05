import { describe, it, expect, vi } from 'vitest';
import { signal, effect, untrack } from '../src/index.js';

describe('untrack', () => {
  it('should read signals without tracking', () => {
    const a = signal(0);
    const b = signal(0);
    const fn = vi.fn();

    effect(() => {
      const aVal = a.value; // tracked
      const bVal = untrack(() => b.value); // NOT tracked
      fn(aVal, bVal);
    });
    expect(fn).toHaveBeenCalledWith(0, 0);

    b.value = 1; // Should NOT trigger effect
    expect(fn).toHaveBeenCalledTimes(1);

    a.value = 1; // Should trigger effect, reading latest b
    expect(fn).toHaveBeenCalledWith(1, 1);
  });

  it('should return the value from the function', () => {
    const s = signal(42);
    const result = untrack(() => s.value);
    expect(result).toBe(42);
  });

  it('should handle nested untrack calls', () => {
    const a = signal(0);
    const fn = vi.fn();

    effect(() => {
      untrack(() => {
        untrack(() => {
          fn(a.value);
        });
      });
    });

    a.value = 1;
    expect(fn).toHaveBeenCalledTimes(1); // Only initial run
  });
});
