import { computed } from '../core/computed.js';
import type { ReadonlySignal, ComputedOptions } from '../core/types.js';

/**
 * Create a memoized function that returns a computed signal.
 * 
 * Unlike `computed()`, `memo()` is a convenience wrapper that reads
 * more naturally and can be used as a drop-in for expensive calculations.
 * 
 * @param fn - The computation function
 * @param options - Optional computed options
 * @returns A ReadonlySignal with the memoized value
 * 
 * @example
 * ```ts
 * const list = signal([3, 1, 4, 1, 5, 9]);
 * 
 * // Expensive sort only recalculates when list changes
 * const sorted = memo(() => [...list.value].sort((a, b) => a - b));
 * 
 * console.log(sorted.value); // [1, 1, 3, 4, 5, 9]
 * ```
 */
export function memo<T>(fn: () => T, options?: ComputedOptions<T>): ReadonlySignal<T> {
  return computed(fn, options);
}
