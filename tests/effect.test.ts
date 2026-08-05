import { describe, it, expect, vi } from 'vitest';
import { signal, computed, effect, onCleanup } from '../src/index.js';

describe('effect', () => {
  it('should run immediately on creation', () => {
    const fn = vi.fn();
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should auto-track signal dependencies', () => {
    const count = signal(0);
    const fn = vi.fn();
    
    effect(() => {
      fn(count.value);
    });
    expect(fn).toHaveBeenCalledWith(0);
    
    count.value = 1;
    expect(fn).toHaveBeenCalledWith(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should auto-track computed dependencies', () => {
    const count = signal(0);
    const double = computed(() => count.value * 2);
    const fn = vi.fn();

    effect(() => {
      fn(double.value);
    });
    expect(fn).toHaveBeenCalledWith(0);

    count.value = 3;
    expect(fn).toHaveBeenCalledWith(6);
  });

  it('should return a dispose function', () => {
    const count = signal(0);
    const fn = vi.fn();

    const stop = effect(() => {
      fn(count.value);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    stop();
    count.value = 1;
    expect(fn).toHaveBeenCalledTimes(1); // No additional call
  });

  it('should support onCleanup', () => {
    const count = signal(0);
    const cleanupFn = vi.fn();

    effect((onCleanup) => {
      count.value; // track
      onCleanup(cleanupFn);
    });
    expect(cleanupFn).not.toHaveBeenCalled();

    count.value = 1; // triggers re-run, cleanup runs first
    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it('should run cleanup on dispose', () => {
    const cleanupFn = vi.fn();
    const stop = effect((onCleanup) => {
      onCleanup(cleanupFn);
    });

    stop();
    expect(cleanupFn).toHaveBeenCalledTimes(1);
  });

  it('should handle dynamic dependencies', () => {
    const toggle = signal(true);
    const a = signal('A');
    const b = signal('B');
    const fn = vi.fn();

    effect(() => {
      fn(toggle.value ? a.value : b.value);
    });
    expect(fn).toHaveBeenCalledWith('A');

    // Changing b should NOT trigger (not a dependency when toggle=true)
    b.value = 'B2';
    expect(fn).toHaveBeenCalledTimes(1);

    // Switch to b branch
    toggle.value = false;
    expect(fn).toHaveBeenCalledWith('B2');

    // Now a changes shouldn't trigger
    a.value = 'A2';
    expect(fn).toHaveBeenCalledTimes(2);

    // But b changes should
    b.value = 'B3';
    expect(fn).toHaveBeenCalledWith('B3');
  });

  it('should not trigger for same value writes', () => {
    const count = signal(0);
    const fn = vi.fn();

    effect(() => fn(count.value));
    expect(fn).toHaveBeenCalledTimes(1);

    count.value = 0; // same value
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
