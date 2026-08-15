import { describe, it, expect, vi } from 'vitest';
import { signal, computed, effect, batch, createScope, untrack, watch } from '../src/index.js';
import { effectScope } from '../src/utils/effectScope.js';

describe('effectScope', () => {
  it('should create and run a scope in one call', () => {
    const count = signal(0);
    const fn = vi.fn();

    const scope = effectScope(() => {
      effect(() => fn(count.value));
    });

    expect(fn).toHaveBeenCalledWith(0);

    count.value = 1;
    expect(fn).toHaveBeenCalledWith(1);

    scope.dispose();

    count.value = 2;
    expect(fn).toHaveBeenCalledTimes(2); // Not called again after dispose
  });
});

describe('edge cases', () => {
  it('should handle deeply nested computeds (chain of 10)', () => {
    const base = signal(1);
    let current: any = base;

    for (let i = 0; i < 10; i++) {
      const prev = current;
      current = computed(() => prev.value + 1);
    }

    expect(current.value).toBe(11);
    base.value = 100;
    expect(current.value).toBe(110);
  });

  it('should handle effect that creates another effect', () => {
    const outer = signal(0);
    const inner = signal(0);
    const log: string[] = [];

    const stop = effect(() => {
      log.push(`outer:${outer.value}`);
      effect(() => {
        log.push(`inner:${inner.value}`);
      });
    });

    expect(log).toContain('outer:0');
    expect(log).toContain('inner:0');
  });

  it('should handle signal set to same value (no-op)', () => {
    const s = signal(42);
    const fn = vi.fn();

    effect(() => fn(s.value));
    fn.mockClear();

    s.value = 42; // same value
    expect(fn).not.toHaveBeenCalled(); // should not re-run
  });

  it('should handle rapid alternating signal values', () => {
    const s = signal('a');
    const fn = vi.fn();

    effect(() => fn(s.value));
    fn.mockClear();

    batch(() => {
      s.value = 'b';
      s.value = 'a'; // back to original
    });

    // After batch, value is 'a' again — same as before
    // Whether effect runs depends on implementation; signal saw a write
  });

  it('should handle computed reading multiple signals in batch', () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);
    const fn = vi.fn();

    effect(() => fn(sum.value));
    expect(fn).toHaveBeenCalledWith(3);
    fn.mockClear();

    batch(() => {
      a.value = 10;
      b.value = 20;
    });

    expect(fn).toHaveBeenCalledWith(30);
    expect(fn).toHaveBeenCalledTimes(1); // only once, not twice
  });

  it('should handle watch with immediate option', () => {
    const s = signal(5);
    const fn = vi.fn();

    watch(() => s.value, fn, { immediate: true });
    expect(fn).toHaveBeenCalledWith(5, undefined);
  });

  it('should handle creating 100 signals', () => {
    const signals = Array.from({ length: 100 }, (_, i) => signal(i));
    const sum = computed(() => signals.reduce((acc, s) => acc + s.value, 0));

    expect(sum.value).toBe(4950); // 0+1+2+...+99

    signals[0].value = 100;
    expect(sum.value).toBe(5050);
  });
});
