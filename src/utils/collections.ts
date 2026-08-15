import { signal } from '../core/signal.js';
import { batch } from '../core/batch.js';
import type { Signal, ReadonlySignal } from '../core/types.js';
import { computed } from '../core/computed.js';

/**
 * A reactive wrapper around Map that triggers updates when entries change.
 * 
 * All mutating methods (set, delete, clear) are reactive — any effects
 * or computeds that read from this map will re-run when entries change.
 * 
 * @example
 * ```ts
 * const users = reactiveMap<number, string>();
 * 
 * effect(() => {
 *   console.log('Users:', users.size.value);
 * });
 * 
 * users.set(1, 'Alice'); // triggers effect
 * users.set(2, 'Bob');   // triggers effect
 * users.delete(1);       // triggers effect
 * ```
 */
export interface ReactiveMap<K, V> {
  /** Get a value by key */
  get(key: K): V | undefined;
  /** Set a key-value pair (triggers reactivity) */
  set(key: K, value: V): void;
  /** Check if a key exists */
  has(key: K): boolean;
  /** Delete a key (triggers reactivity) */
  delete(key: K): boolean;
  /** Clear all entries (triggers reactivity) */
  clear(): void;
  /** Reactive size */
  readonly size: ReadonlySignal<number>;
  /** Get all entries as a plain Map snapshot */
  toMap(): Map<K, V>;
  /** Iterate over entries */
  forEach(fn: (value: V, key: K) => void): void;
  /** Get all keys */
  keys(): IterableIterator<K>;
  /** Get all values */
  values(): IterableIterator<V>;
  /** Get all entries */
  entries(): IterableIterator<[K, V]>;
}

export function reactiveMap<K, V>(initial?: Iterable<[K, V]>): ReactiveMap<K, V> {
  const _map = new Map<K, V>(initial);
  const _version = signal(0);

  function notify() {
    _version.value = _version.peek() + 1;
  }

  function touch() {
    // Read version to register dependency
    _version.value;
  }

  return {
    get(key: K): V | undefined {
      touch();
      return _map.get(key);
    },
    set(key: K, value: V): void {
      _map.set(key, value);
      notify();
    },
    has(key: K): boolean {
      touch();
      return _map.has(key);
    },
    delete(key: K): boolean {
      const result = _map.delete(key);
      if (result) notify();
      return result;
    },
    clear(): void {
      if (_map.size > 0) {
        _map.clear();
        notify();
      }
    },
    get size(): ReadonlySignal<number> {
      return computed(() => {
        _version.value; // track
        return _map.size;
      });
    },
    toMap(): Map<K, V> {
      return new Map(_map);
    },
    forEach(fn: (value: V, key: K) => void): void {
      touch();
      _map.forEach(fn);
    },
    keys(): IterableIterator<K> {
      touch();
      return _map.keys();
    },
    values(): IterableIterator<V> {
      touch();
      return _map.values();
    },
    entries(): IterableIterator<[K, V]> {
      touch();
      return _map.entries();
    },
  };
}

/**
 * A reactive wrapper around Array that triggers updates when items change.
 * 
 * @example
 * ```ts
 * const items = reactiveArray([1, 2, 3]);
 * 
 * const sum = computed(() => items.value.reduce((a, b) => a + b, 0));
 * 
 * items.push(4);     // sum.value === 10
 * items.splice(0, 1); // sum.value === 9
 * ```
 */
export interface ReactiveArray<T> {
  /** Read the current array (tracked) */
  readonly value: T[];
  /** Read without tracking */
  peek(): T[];
  /** Number of items (reactive) */
  readonly length: ReadonlySignal<number>;
  /** Push items to the end */
  push(...items: T[]): number;
  /** Remove and return the last item */
  pop(): T | undefined;
  /** Remove and return the first item */
  shift(): T | undefined;
  /** Add items to the beginning */
  unshift(...items: T[]): number;
  /** Splice (remove/insert) items */
  splice(start: number, deleteCount?: number, ...items: T[]): T[];
  /** Set the entire array */
  set(items: T[]): void;
  /** Sort the array in place */
  sort(compareFn?: (a: T, b: T) => number): void;
  /** Reverse the array in place */
  reverse(): void;
}

export function reactiveArray<T>(initial: T[] = []): ReactiveArray<T> {
  const _items = signal<T[]>([...initial]);

  return {
    get value(): T[] {
      return _items.value;
    },
    peek(): T[] {
      return _items.peek();
    },
    get length(): ReadonlySignal<number> {
      return computed(() => _items.value.length);
    },
    push(...items: T[]): number {
      const arr = [..._items.peek(), ...items];
      _items.value = arr;
      return arr.length;
    },
    pop(): T | undefined {
      const arr = [..._items.peek()];
      const item = arr.pop();
      _items.value = arr;
      return item;
    },
    shift(): T | undefined {
      const arr = [..._items.peek()];
      const item = arr.shift();
      _items.value = arr;
      return item;
    },
    unshift(...items: T[]): number {
      const arr = [...items, ..._items.peek()];
      _items.value = arr;
      return arr.length;
    },
    splice(start: number, deleteCount?: number, ...items: T[]): T[] {
      const arr = [..._items.peek()];
      const removed = deleteCount !== undefined
        ? arr.splice(start, deleteCount, ...items)
        : arr.splice(start);
      _items.value = arr;
      return removed;
    },
    set(items: T[]): void {
      _items.value = [...items];
    },
    sort(compareFn?: (a: T, b: T) => number): void {
      const arr = [..._items.peek()];
      arr.sort(compareFn);
      _items.value = arr;
    },
    reverse(): void {
      const arr = [..._items.peek()];
      arr.reverse();
      _items.value = arr;
    },
  };
}
