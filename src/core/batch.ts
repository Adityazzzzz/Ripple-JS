import { incrementBatchDepth, decrementBatchDepth } from './graph.js';

/**
 * Batch multiple signal writes into a single update.
 *
 * Effects that depend on the changed signals will only execute
 * once after the batch function completes, rather than after
 * each individual write.
 *
 * Batches can be nested — effects only flush when the outermost
 * batch completes.
 *
 * @param fn - Function containing multiple signal writes
 *
 * @example
 * ```ts
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * effect(() => {
 *   console.log(`${firstName.value} ${lastName.value}`);
 * });
 *
 * // Without batch: effect runs twice (once per write)
 * // With batch: effect runs once after both writes
 * batch(() => {
 *   firstName.value = 'Jane';
 *   lastName.value = 'Smith';
 * });
 * // logs: "Jane Smith" (only once)
 * ```
 *
 * @example
 * ```ts
 * // Nested batches
 * batch(() => {
 *   a.value = 1;
 *   batch(() => {
 *     b.value = 2;
 *     c.value = 3;
 *   });
 *   // Effects still deferred here
 *   d.value = 4;
 * });
 * // Effects flush here (outermost batch completes)
 * ```
 */
export function batch<T>(fn: () => T): T {
  incrementBatchDepth();
  try {
    return fn();
  } finally {
    decrementBatchDepth();
  }
}
