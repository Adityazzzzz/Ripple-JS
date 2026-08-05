import { effect } from '../core/effect.js';
import { untrack } from '../core/untrack.js';
import type { Signal, ReadonlySignal, EffectHandle } from '../core/types.js';

type SignalLike<T> = Signal<T> | ReadonlySignal<T>;

/**
 * Create an effect with explicit dependency tracking.
 * 
 * Instead of auto-tracking all signal reads, `on()` lets you
 * explicitly declare which signals to watch, and passes their
 * current values to the callback.
 * 
 * @param deps - A signal or array of signals to watch
 * @param callback - Called with the current values when any dep changes
 * @param options - Optional configuration
 * @returns A dispose function to stop the effect
 * 
 * @example
 * ```ts
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 * 
 * on([firstName, lastName], ([first, last]) => {
 *   console.log(`Full name: ${first} ${last}`);
 * });
 * ```
 * 
 * @example
 * ```ts
 * // Single signal
 * on(count, (value) => {
 *   console.log('Count:', value);
 * });
 * ```
 */
export interface OnOptions {
  /** If true, run immediately with current values. Defaults to true. */
  immediate?: boolean;
}

// Overload: single signal
export function on<T>(
  deps: SignalLike<T>,
  callback: (value: T) => void,
  options?: OnOptions
): EffectHandle;

// Overload: array of signals
export function on<T extends readonly SignalLike<any>[]>(
  deps: [...T],
  callback: (values: { [K in keyof T]: T[K] extends SignalLike<infer U> ? U : never }) => void,
  options?: OnOptions
): EffectHandle;

export function on(
  deps: SignalLike<any> | SignalLike<any>[],
  callback: (values: any) => void,
  options?: OnOptions
): EffectHandle {
  const immediate = options?.immediate ?? true;
  const isArray = Array.isArray(deps);
  let isFirst = true;

  return effect(() => {
    // Read all dependencies (tracked)
    const values = isArray
      ? (deps as SignalLike<any>[]).map(d => d.value)
      : (deps as SignalLike<any>).value;

    if (isFirst) {
      isFirst = false;
      if (immediate) {
        untrack(() => callback(values));
      }
      return;
    }

    untrack(() => callback(values));
  });
}
