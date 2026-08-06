import { computed } from '../core/computed.js';
import type { ReadonlySignal } from '../core/types.js';

/**
 * Derive multiple computed values from a single reactive source.
 * 
 * Takes an object of computation functions and returns an object
 * of ReadonlySignals. Useful for deriving a related set of values
 * from shared state.
 * 
 * @param derivations - Object mapping names to computation functions
 * @returns Object mapping the same names to ReadonlySignals
 * 
 * @example
 * ```ts
 * const cart = signal([
 *   { name: 'Apple', price: 1.5, qty: 3 },
 *   { name: 'Banana', price: 0.5, qty: 6 },
 * ]);
 * 
 * const { itemCount, subtotal, total } = derive({
 *   itemCount: () => cart.value.reduce((sum, i) => sum + i.qty, 0),
 *   subtotal: () => cart.value.reduce((sum, i) => sum + i.price * i.qty, 0),
 *   total: () => {
 *     const sub = cart.value.reduce((sum, i) => sum + i.price * i.qty, 0);
 *     return sub + sub * 0.1;
 *   },
 * });
 * 
 * console.log(total.value); // 8.25
 * ```
 */
export function derive<T extends Record<string, () => any>>(
  derivations: T
): { [K in keyof T]: ReadonlySignal<ReturnType<T[K]>> } {
  const result = {} as { [K in keyof T]: ReadonlySignal<ReturnType<T[K]>> };

  for (const key of Object.keys(derivations) as Array<keyof T>) {
    result[key] = computed(derivations[key]) as ReadonlySignal<ReturnType<T[typeof key]>>;
  }

  return result;
}
