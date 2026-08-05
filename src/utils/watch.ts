import { effect, onCleanup } from '../core/effect.js';
import { untrack } from '../core/untrack.js';
import type { EffectHandle } from '../core/types.js';

/**
 * Watch a reactive source and call a callback when it changes.
 * 
 * Unlike `effect()`, `watch()` provides both the old and new values
 * to the callback, and does NOT run the callback on initial creation
 * (unless `immediate` option is set).
 * 
 * @param source - A function that returns the value to watch
 * @param callback - Called with (newValue, oldValue) when source changes
 * @param options - Optional configuration
 * @returns A dispose function to stop watching
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * 
 * watch(
 *   () => count.value,
 *   (newVal, oldVal) => {
 *     console.log(`Changed from ${oldVal} to ${newVal}`);
 *   }
 * );
 * 
 * count.value = 1; // logs: "Changed from 0 to 1"
 * ```
 */
export interface WatchOptions {
  /** If true, run the callback immediately with the initial value */
  immediate?: boolean;
}

export function watch<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T | undefined) => void,
  options?: WatchOptions
): EffectHandle {
  let oldValue: T | undefined;
  let isFirst = true;

  return effect(() => {
    const newValue = source();

    if (isFirst) {
      isFirst = false;
      oldValue = newValue;
      if (options?.immediate) {
        untrack(() => callback(newValue, undefined));
      }
      return;
    }

    // Use untrack to prevent the callback from registering dependencies
    const prev = oldValue;
    oldValue = newValue;
    untrack(() => callback(newValue, prev));
  });
}
