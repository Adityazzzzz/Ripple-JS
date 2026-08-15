import { signal } from '../core/signal.js';
import { computed } from '../core/computed.js';
import type { ReadonlySignal } from '../core/types.js';

/**
 * Convert a Promise into a reactive signal.
 * 
 * Returns a ReadonlySignal that is initially `undefined` and resolves
 * to the Promise's value when it completes. Also provides `loading`
 * and `error` signals.
 * 
 * @param promise - The promise to convert
 * @returns Object with data, loading, and error signals
 * 
 * @example
 * ```ts
 * const user = fromPromise(fetch('/api/user').then(r => r.json()));
 * 
 * effect(() => {
 *   if (user.loading.value) return console.log('Loading...');
 *   if (user.error.value) return console.log('Error:', user.error.value);
 *   console.log('User:', user.data.value);
 * });
 * ```
 * 
 * @example
 * ```ts
 * // Simple usage — just the value
 * const config = fromPromise(loadConfig());
 * // Later...
 * if (config.data.value) {
 *   applyConfig(config.data.value);
 * }
 * ```
 */
export interface PromiseSignal<T> {
  /** The resolved data (undefined until resolved) */
  readonly data: ReadonlySignal<T | undefined>;
  /** Whether the promise is still pending */
  readonly loading: ReadonlySignal<boolean>;
  /** The rejection error (undefined if no error) */
  readonly error: ReadonlySignal<Error | undefined>;
}

export function fromPromise<T>(promise: Promise<T>): PromiseSignal<T> {
  const _data = signal<T | undefined>(undefined);
  const _loading = signal(true);
  const _error = signal<Error | undefined>(undefined);

  promise
    .then((value) => {
      _data.value = value;
      _loading.value = false;
    })
    .catch((err) => {
      _error.value = err instanceof Error ? err : new Error(String(err));
      _loading.value = false;
    });

  return {
    data: computed(() => _data.value),
    loading: computed(() => _loading.value),
    error: computed(() => _error.value),
  };
}
