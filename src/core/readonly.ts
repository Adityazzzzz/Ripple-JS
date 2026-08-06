import type { ReadonlySignal, Signal } from './types.js';
import { ComputedBrand } from './types.js';
import { track } from './graph.js';
import type { ReactiveNode } from './types.js';

/**
 * Create a read-only view of a signal.
 * 
 * Returns a ReadonlySignal that mirrors the source signal's value
 * but cannot be written to. Useful for exposing state from a module
 * without allowing external mutation.
 * 
 * @param source - The signal to wrap
 * @returns A ReadonlySignal that tracks the source
 * 
 * @example
 * ```ts
 * // Internal state
 * const _count = signal(0);
 * 
 * // Exposed as read-only
 * export const count = readonly(_count);
 * 
 * count.value;     // 0 (reads work)
 * count.value = 5; // TypeScript error! (writes blocked)
 * ```
 */
export function readonly<T>(source: Signal<T> | ReadonlySignal<T>): ReadonlySignal<T> {
  const sourceNode = source as unknown as ReactiveNode;
  
  return {
    get value(): T {
      // Track the underlying source node so subscribers of this
      // readonly wrapper are notified when the source changes
      track(sourceNode);
      return source.value;
    },
    peek(): T {
      return source.peek();
    },
    get [ComputedBrand](): true {
      return true;
    },
  } as ReadonlySignal<T>;
}
