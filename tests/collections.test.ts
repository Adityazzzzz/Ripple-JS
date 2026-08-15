import { describe, it, expect, vi } from 'vitest';
import { effect, computed, reactiveMap, reactiveArray } from '../src/index.js';

describe('reactiveMap', () => {
  it('should trigger effects on set', () => {
    const map = reactiveMap<string, number>();
    const fn = vi.fn();

    effect(() => {
      fn(map.get('a'));
    });
    expect(fn).toHaveBeenCalledWith(undefined);

    map.set('a', 1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('should trigger effects on delete', () => {
    const map = reactiveMap<string, number>([['a', 1]]);
    const fn = vi.fn();

    effect(() => fn(map.has('a')));
    expect(fn).toHaveBeenCalledWith(true);

    map.delete('a');
    expect(fn).toHaveBeenCalledWith(false);
  });

  it('should support clear', () => {
    const map = reactiveMap<string, number>([['a', 1], ['b', 2]]);
    const fn = vi.fn();

    effect(() => fn(map.has('a')));
    expect(fn).toHaveBeenCalledWith(true);

    map.clear();
    expect(fn).toHaveBeenCalledWith(false);
  });

  it('should support iteration', () => {
    const map = reactiveMap<string, number>([['a', 1], ['b', 2]]);
    expect([...map.keys()]).toEqual(['a', 'b']);
    expect([...map.values()]).toEqual([1, 2]);
    expect([...map.entries()]).toEqual([['a', 1], ['b', 2]]);
  });
});

describe('reactiveArray', () => {
  it('should trigger effects on push', () => {
    const arr = reactiveArray([1, 2, 3]);
    const fn = vi.fn();

    effect(() => fn(arr.value.length));
    expect(fn).toHaveBeenCalledWith(3);

    arr.push(4);
    expect(fn).toHaveBeenCalledWith(4);
  });

  it('should support pop, shift, unshift', () => {
    const arr = reactiveArray([1, 2, 3]);

    expect(arr.pop()).toBe(3);
    expect(arr.value).toEqual([1, 2]);

    expect(arr.shift()).toBe(1);
    expect(arr.value).toEqual([2]);

    arr.unshift(0);
    expect(arr.value).toEqual([0, 2]);
  });

  it('should support splice', () => {
    const arr = reactiveArray([1, 2, 3, 4, 5]);

    const removed = arr.splice(1, 2, 10, 20);
    expect(removed).toEqual([2, 3]);
    expect(arr.value).toEqual([1, 10, 20, 4, 5]);
  });

  it('should support sort and reverse', () => {
    const arr = reactiveArray([3, 1, 2]);

    arr.sort((a, b) => a - b);
    expect(arr.value).toEqual([1, 2, 3]);

    arr.reverse();
    expect(arr.value).toEqual([3, 2, 1]);
  });

  it('should work with computed', () => {
    const arr = reactiveArray([1, 2, 3]);
    const sum = computed(() => arr.value.reduce((a, b) => a + b, 0));

    expect(sum.value).toBe(6);

    arr.push(4);
    expect(sum.value).toBe(10);
  });

  it('should support set for replacing all items', () => {
    const arr = reactiveArray([1, 2, 3]);

    arr.set([10, 20]);
    expect(arr.value).toEqual([10, 20]);
  });

  it('should support peek for untracked reads', () => {
    const arr = reactiveArray([1, 2, 3]);
    expect(arr.peek()).toEqual([1, 2, 3]);
  });
});
