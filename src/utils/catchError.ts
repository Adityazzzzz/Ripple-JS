import { effect } from '../core/effect.js';
import { signal } from '../core/signal.js';
import { computed } from '../core/computed.js';
import type { EffectHandle, CleanupFn, ReadonlySignal } from '../core/types.js';

/**
 * Create an effect with error boundary handling.
 * 
 * If the effect throws an error, the `onError` callback is called
 * instead of the error propagating. The effect continues to track
 * dependencies and will re-run on changes.
 * 
 * @param fn - Effect function
 * @param onError - Error handler callback
 * @returns Dispose function
 * 
 * @example
 * ```ts
 * const userId = signal(1);
 * 
 * catchError(
 *   () => {
 *     const data = fetchSync(userId.value); // might throw
 *     renderUser(data);
 *   },
 *   (error) => {
 *     console.error('Failed to render user:', error);
 *     showErrorUI();
 *   }
 * );
 * ```
 */
export function catchError(
  fn: (onCleanup: (fn: CleanupFn) => void) => void,
  onError: (error: unknown) => void
): EffectHandle {
  return effect((onCleanup) => {
    try {
      fn(onCleanup);
    } catch (err) {
      onError(err);
    }
  });
}
