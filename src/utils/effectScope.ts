import { createScope } from '../core/scope.js';
import type { Scope } from '../core/types.js';

/**
 * Create and immediately run a scope.
 * 
 * Convenience wrapper around `createScope()` + `.run()`. Returns
 * the scope handle for later disposal.
 * 
 * Inspired by Vue 3's `effectScope()` API.
 * 
 * @param fn - Function to run within the scope
 * @returns Scope handle with `.dispose()` method
 * 
 * @example
 * ```ts
 * const scope = effectScope(() => {
 *   const count = signal(0);
 *   const doubled = computed(() => count.value * 2);
 *   
 *   effect(() => console.log(doubled.value));
 *   
 *   return { count }; // return value is ignored, scope is what matters
 * });
 * 
 * // Later: clean up everything
 * scope.dispose();
 * ```
 */
export function effectScope(fn: () => void): Scope {
  const scope = createScope();
  scope.run(fn);
  return scope;
}
