import { describe, it, expect, vi } from 'vitest';
import { signal, watch } from '../src/index.js';

describe('watch', () => {
  it('should NOT call callback on creation by default', () => {
    const count = signal(0);
    const fn = vi.fn();
    watch(() => count.value, fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should call callback with old and new values on change', () => {
    const count = signal(0);
    const fn = vi.fn();
    watch(() => count.value, fn);

    count.value = 1;
    expect(fn).toHaveBeenCalledWith(1, 0);

    count.value = 5;
    expect(fn).toHaveBeenCalledWith(5, 1);
  });

  it('should support immediate option', () => {
    const count = signal(0);
    const fn = vi.fn();
    watch(() => count.value, fn, { immediate: true });
    expect(fn).toHaveBeenCalledWith(0, undefined);
  });

  it('should return a dispose function', () => {
    const count = signal(0);
    const fn = vi.fn();
    const stop = watch(() => count.value, fn);

    count.value = 1;
    expect(fn).toHaveBeenCalledTimes(1);

    stop();
    count.value = 2;
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
