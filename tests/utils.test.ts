import { describe, it, expect, vi } from 'vitest';
import { signal, computed, effect, on, toJSON } from '../src/index.js';

describe('on', () => {
  it('should explicitly track a single signal', () => {
    const count = signal(0);
    const fn = vi.fn();
    on(count, fn);
    expect(fn).toHaveBeenCalledWith(0);
  });

  it('should explicitly track multiple signals', () => {
    const a = signal('hello');
    const b = signal('world');
    const fn = vi.fn();

    on([a, b] as const, fn);
    expect(fn).toHaveBeenCalledWith(['hello', 'world']);
  });

  it('should re-run when tracked signals change', () => {
    const count = signal(0);
    const fn = vi.fn();
    on(count, fn);
    fn.mockClear();

    count.value = 5;
    expect(fn).toHaveBeenCalledWith(5);
  });

  it('should support immediate: false', () => {
    const count = signal(0);
    const fn = vi.fn();
    on(count, fn, { immediate: false });
    expect(fn).not.toHaveBeenCalled();

    count.value = 1;
    expect(fn).toHaveBeenCalledWith(1);
  });
});

describe('toJSON', () => {
  it('should unwrap a signal value', () => {
    const s = signal(42);
    expect(toJSON(s)).toBe(42);
  });

  it('should unwrap a computed value', () => {
    const s = signal(5);
    const c = computed(() => s.value * 2);
    expect(toJSON(c)).toBe(10);
  });

  it('should unwrap nested signals in objects', () => {
    const name = signal('Alice');
    const age = signal(30);
    const user = { name, age, role: 'admin' };
    expect(toJSON(user)).toEqual({ name: 'Alice', age: 30, role: 'admin' });
  });

  it('should handle arrays', () => {
    const items = signal([1, 2, 3]);
    expect(toJSON(items)).toEqual([1, 2, 3]);
  });

  it('should handle primitives passthrough', () => {
    expect(toJSON(42)).toBe(42);
    expect(toJSON('hello')).toBe('hello');
    expect(toJSON(null)).toBeNull();
    expect(toJSON(true)).toBe(true);
  });
});
