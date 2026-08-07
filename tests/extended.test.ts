import { describe, it, expect, vi } from 'vitest';
import {
  signal, computed, effect, batch,
  isSignal, isComputed, isReactive,
  readonly, memo, derive, subscribe, previous,
  createStore,
} from '../src/index.js';

describe('isSignal / isComputed / isReactive', () => {
  it('should identify signals', () => {
    const s = signal(0);
    expect(isSignal(s)).toBe(true);
    expect(isComputed(s)).toBe(false);
    expect(isReactive(s)).toBe(true);
  });

  it('should identify computeds', () => {
    const c = computed(() => 0);
    expect(isSignal(c)).toBe(false);
    expect(isComputed(c)).toBe(true);
    expect(isReactive(c)).toBe(true);
  });

  it('should reject non-reactive values', () => {
    expect(isReactive(42)).toBe(false);
    expect(isReactive('hello')).toBe(false);
    expect(isReactive(null)).toBe(false);
    expect(isReactive({})).toBe(false);
  });
});

describe('readonly', () => {
  it('should create a read-only view of a signal', () => {
    const s = signal(0);
    const r = readonly(s);
    expect(r.value).toBe(0);

    s.value = 5;
    expect(r.value).toBe(5);
  });

  it('should track the source signal in effects', () => {
    const s = signal(0);
    const r = readonly(s);
    const fn = vi.fn();

    effect(() => fn(r.value));
    expect(fn).toHaveBeenCalledWith(0);

    s.value = 10;
    expect(fn).toHaveBeenCalledWith(10);
  });

  it('should support peek() without tracking', () => {
    const s = signal(42);
    const r = readonly(s);
    expect(r.peek()).toBe(42);
  });
});

describe('memo', () => {
  it('should work like computed', () => {
    const s = signal(5);
    const m = memo(() => s.value * 3);
    expect(m.value).toBe(15);

    s.value = 10;
    expect(m.value).toBe(30);
  });
});

describe('derive', () => {
  it('should create multiple computed values', () => {
    const price = signal(100);
    const quantity = signal(5);

    const { subtotal, tax, total } = derive({
      subtotal: () => price.value * quantity.value,
      tax: () => price.value * quantity.value * 0.1,
      total: () => price.value * quantity.value * 1.1,
    });

    expect(subtotal.value).toBe(500);
    expect(tax.value).toBe(50);
    expect(total.value).toBe(550);
  });

  it('should update when dependencies change', () => {
    const count = signal(2);
    const { doubled, tripled } = derive({
      doubled: () => count.value * 2,
      tripled: () => count.value * 3,
    });

    expect(doubled.value).toBe(4);
    expect(tripled.value).toBe(6);

    count.value = 10;
    expect(doubled.value).toBe(20);
    expect(tripled.value).toBe(30);
  });
});

describe('subscribe', () => {
  it('should call callback on initial value and changes', () => {
    const s = signal(0);
    const fn = vi.fn();

    const unsub = subscribe(s, fn);
    expect(fn).toHaveBeenCalledWith(0);

    s.value = 5;
    expect(fn).toHaveBeenCalledWith(5);

    unsub();
    s.value = 10;
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('previous', () => {
  it('should track the previous value of a signal', () => {
    const count = signal(0);
    const prev = previous(count);

    // Initial: prev equals initial value
    expect(prev.value).toBe(0);

    count.value = 1;
    expect(prev.value).toBe(0);

    count.value = 2;
    expect(prev.value).toBe(1);
  });
});

describe('createStore', () => {
  it('should create a store with state, getters, and actions', () => {
    const store = createStore({
      state: () => ({ count: 0, step: 1 }),
      getters: (state) => ({
        double: () => state.count.value * 2,
      }),
      actions: (state) => ({
        increment() { state.count.value += state.step.value; },
        decrement() { state.count.value -= state.step.value; },
      }),
    });

    expect(store.count.value).toBe(0);
    expect(store.double.value).toBe(0);

    store.increment();
    expect(store.count.value).toBe(1);
    expect(store.double.value).toBe(2);

    store.decrement();
    expect(store.count.value).toBe(0);
  });

  it('should support $reset', () => {
    const store = createStore({
      state: () => ({ name: 'Alice', age: 30 }),
    });

    store.name.value = 'Bob';
    store.age.value = 25;
    expect(store.name.value).toBe('Bob');

    store.$reset();
    expect(store.name.value).toBe('Alice');
    expect(store.age.value).toBe(30);
  });

  it('should support $snapshot', () => {
    const store = createStore({
      state: () => ({ x: 1, y: 2 }),
    });

    const snap = store.$snapshot();
    expect(snap).toEqual({ x: 1, y: 2 });
  });

  it('should support batch in actions', () => {
    const fn = vi.fn();
    const store = createStore({
      state: () => ({ a: 0, b: 0 }),
      actions: (state) => ({
        setAll(a: number, b: number) {
          batch(() => {
            state.a.value = a;
            state.b.value = b;
          });
        },
      }),
    });

    effect(() => fn(store.a.value + store.b.value));
    fn.mockClear();

    store.setAll(5, 10);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(15);
  });
});
