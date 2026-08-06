import { SignalBrand, ComputedBrand } from './types.js';
import type { Signal, ReadonlySignal } from './types.js';

/**
 * Check if a value is a Signal.
 * 
 * @param value - Value to check
 * @returns true if the value is a Signal
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * isSignal(count); // true
 * isSignal(42);    // false
 * ```
 */
export function isSignal<T = unknown>(value: unknown): value is Signal<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    SignalBrand in value
  );
}

/**
 * Check if a value is a Computed (ReadonlySignal).
 * 
 * @param value - Value to check
 * @returns true if the value is a Computed
 * 
 * @example
 * ```ts
 * const double = computed(() => count.value * 2);
 * isComputed(double); // true
 * isComputed(count);  // false
 * ```
 */
export function isComputed<T = unknown>(value: unknown): value is ReadonlySignal<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    ComputedBrand in value
  );
}

/**
 * Check if a value is any reactive primitive (Signal or Computed).
 * 
 * @param value - Value to check
 * @returns true if the value is reactive
 * 
 * @example
 * ```ts
 * isReactive(signal(0));            // true
 * isReactive(computed(() => 0));     // true
 * isReactive(42);                   // false
 * ```
 */
export function isReactive<T = unknown>(value: unknown): value is Signal<T> | ReadonlySignal<T> {
  return isSignal(value) || isComputed(value);
}
