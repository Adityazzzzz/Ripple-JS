import { SignalBrand, ComputedBrand } from '../core/types.js';
import type { Signal, ReadonlySignal } from '../core/types.js';

/**
 * Check if a value is a Signal or ReadonlySignal (Computed).
 */
function isReactive(value: unknown): value is Signal<unknown> | ReadonlySignal<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    (SignalBrand in value || ComputedBrand in value)
  );
}

/**
 * Recursively unwrap reactive values to plain JSON-serializable data.
 * 
 * Converts signals and computed values to their underlying values.
 * Works recursively on objects and arrays.
 * 
 * @param value - A signal, computed, or plain value to unwrap
 * @returns The unwrapped plain value
 * 
 * @example
 * ```ts
 * const name = signal('Alice');
 * const age = signal(30);
 * const user = { name, age, role: 'admin' };
 * 
 * toJSON(user);
 * // { name: 'Alice', age: 30, role: 'admin' }
 * ```
 * 
 * @example
 * ```ts
 * const items = signal([1, 2, 3]);
 * toJSON(items); // [1, 2, 3]
 * ```
 */
export function toJSON<T>(value: Signal<T> | ReadonlySignal<T>): T;
export function toJSON<T>(value: T): T;
export function toJSON(value: unknown): unknown {
  // Unwrap reactive values
  if (isReactive(value)) {
    return toJSON(value.peek());
  }

  // Recursively process arrays
  if (Array.isArray(value)) {
    return value.map(item => toJSON(item));
  }

  // Recursively process plain objects
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      result[key] = toJSON((value as Record<string, unknown>)[key]);
    }
    return result;
  }

  // Primitive values pass through
  return value;
}
