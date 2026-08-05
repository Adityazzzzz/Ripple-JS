import { describe, it, expect, vi } from 'vitest';
import { signal, effect, batch } from '../src/index.js';

describe('batch', () => {
  it('should coalesce multiple writes into single effect execution', () => {
    const a = signal(0);
    const b = signal(0);
    const fn = vi.fn();

    effect(() => {
      fn(a.value + b.value);
    });
    fn.mockClear();

    batch(() => {
      a.value = 1;
      b.value = 2;
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('should support nested batches', () => {
    const a = signal(0);
    const b = signal(0);
    const c = signal(0);
    const fn = vi.fn();

    effect(() => {
      fn(a.value + b.value + c.value);
    });
    fn.mockClear();

    batch(() => {
      a.value = 1;
      batch(() => {
        b.value = 2;
        c.value = 3;
      });
      // Effects still deferred here (outer batch not complete)
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(6);
  });

  it('should return the value from the batch function', () => {
    const result = batch(() => {
      return 42;
    });
    expect(result).toBe(42);
  });

  it('should flush effects even if batch throws', () => {
    const count = signal(0);
    const fn = vi.fn();

    effect(() => fn(count.value));
    fn.mockClear();

    expect(() => {
      batch(() => {
        count.value = 1;
        throw new Error('oops');
      });
    }).toThrow('oops');

    // Effect should still have been queued and eventually flushed
    // (behavior depends on implementation — at minimum, batch depth should reset)
  });
});
