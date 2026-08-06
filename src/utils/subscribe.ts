import type { Signal, ReadonlySignal } from '../core/types.js';
import { effect } from '../core/effect.js';
import type { EffectHandle } from '../core/types.js';

/**
 * Subscribe to value changes on a signal or computed.
 * 
 * A simpler alternative to `effect()` when you just want to listen
 * for changes on a single reactive value. The callback receives
 * the new value each time it changes.
 * 
 * Unlike `watch()`, the callback is called on the initial value too.
 * 
 * @param source - Signal or computed to subscribe to
 * @param callback - Called with the current value whenever it changes
 * @returns Unsubscribe function
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * 
 * const unsub = subscribe(count, (value) => {
 *   console.log('Count:', value);
 * });
 * // logs: "Count: 0"
 * 
 * count.value = 5;
 * // logs: "Count: 5"
 * 
 * unsub(); // Stop listening
 * ```
 */
export function subscribe<T>(
  source: Signal<T> | ReadonlySignal<T>,
  callback: (value: T) => void
): EffectHandle {
  return effect(() => {
    callback(source.value);
  });
}
