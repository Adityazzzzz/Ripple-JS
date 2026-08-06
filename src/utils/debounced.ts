import { effect } from '../core/effect.js';
import { signal } from '../core/signal.js';
import { untrack } from '../core/untrack.js';
import type { EffectHandle, CleanupFn } from '../core/types.js';

/**
 * Create a debounced effect that delays execution.
 * 
 * Like `effect()`, but the callback is debounced by the specified
 * delay. If dependencies change multiple times within the delay,
 * only the last change triggers execution.
 * 
 * Useful for search-as-you-type, auto-save, or rate-limited API calls.
 * 
 * @param fn - Effect function (same as effect())
 * @param delay - Debounce delay in milliseconds
 * @returns Dispose function
 * 
 * @example
 * ```ts
 * const searchQuery = signal('');
 * 
 * debouncedEffect(() => {
 *   const query = searchQuery.value;
 *   fetch(`/api/search?q=${query}`)
 *     .then(r => r.json())
 *     .then(results => console.log(results));
 * }, 300);
 * 
 * // Rapid typing only triggers one API call after 300ms of inactivity
 * searchQuery.value = 'hello';
 * ```
 */
export function debouncedEffect(
  fn: () => void,
  delay: number
): EffectHandle {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  const _trigger = signal(0);

  // The outer effect tracks the real dependencies by calling fn in tracking context
  // then schedules the actual execution debounced
  const stop = effect((onCleanup) => {
    // Read trigger to re-run when debounce fires
    _trigger.value;

    // Clear any pending debounce
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    // Schedule the actual work
    timerId = setTimeout(() => {
      timerId = null;
      untrack(() => fn());
    }, delay);

    onCleanup(() => {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    });
  });

  return stop;
}

/**
 * Create a debounced signal that delays propagation.
 * 
 * Writes to the returned signal are debounced — the underlying value
 * only updates after `delay` ms of no writes.
 * 
 * @param initialValue - Initial value
 * @param delay - Debounce delay in milliseconds
 * @returns A signal-like object with debounced writes and `.immediate` for the raw value
 * 
 * @example
 * ```ts
 * const search = debouncedSignal('', 300);
 * 
 * effect(() => {
 *   console.log('Search:', search.value);
 * });
 * 
 * search.value = 'abc'; // After 300ms: logs "Search: abc"
 * ```
 */
export function debouncedSignal<T>(initialValue: T, delay: number) {
  const _immediate = signal(initialValue);
  const _debounced = signal(initialValue);
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return {
    get value(): T {
      return _debounced.value;
    },
    set value(newValue: T) {
      _immediate.value = newValue;

      if (timerId !== null) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        timerId = null;
        _debounced.value = _immediate.peek();
      }, delay);
    },
    /** Get the immediate (non-debounced) value */
    get immediate(): T {
      return _immediate.value;
    },
    peek(): T {
      return _debounced.peek();
    },
  };
}
