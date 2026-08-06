import { signal } from '../core/signal.js';
import { computed } from '../core/computed.js';
import { effect } from '../core/effect.js';
import type { ReadonlySignal, Signal as SignalType } from '../core/types.js';

/**
 * Track the previous value of a signal or computed.
 * 
 * Returns a ReadonlySignal that always holds the value the source
 * had *before* its most recent change. Useful for animations,
 * undo/redo, or diff-based updates.
 * 
 * @param source - Signal or computed to track
 * @returns ReadonlySignal containing the previous value
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * const prevCount = previous(count);
 * 
 * console.log(prevCount.value); // 0 (initial = current)
 * 
 * count.value = 1;
 * console.log(prevCount.value); // 0
 * 
 * count.value = 2;
 * console.log(prevCount.value); // 1
 * ```
 */
export function previous<T>(
  source: SignalType<T> | ReadonlySignal<T>
): ReadonlySignal<T | undefined> {
  const _prev = signal<T | undefined>(undefined);
  let current = source.peek();

  effect(() => {
    const newVal = source.value;
    _prev.value = current;
    current = newVal;
  });

  return computed(() => _prev.value);
}
