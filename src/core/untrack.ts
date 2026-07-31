import { setActiveSubscriber } from './graph.js';

/**
 * Execute a function without tracking any signal reads as dependencies.
 *
 * Any signals read inside the callback will NOT be registered as
 * dependencies of the current effect or computed.
 *
 * @param fn - Function to execute without tracking
 * @returns The return value of the function
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const name = signal('Alice');
 *
 * effect(() => {
 *   // This will re-run when count changes
 *   console.log('Count:', count.value);
 *
 *   // This will NOT cause the effect to re-run when name changes
 *   const currentName = untrack(() => name.value);
 *   console.log('Name (untracked):', currentName);
 * });
 *
 * name.value = 'Bob';  // Effect does NOT re-run
 * count.value = 1;     // Effect re-runs
 * ```
 */
export function untrack<T>(fn: () => T): T {
  const prev = setActiveSubscriber(null);
  try {
    return fn();
  } finally {
    setActiveSubscriber(prev);
  }
}
