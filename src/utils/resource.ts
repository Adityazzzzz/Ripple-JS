import { signal } from '../core/signal.js';
import { effect } from '../core/effect.js';
import { batch } from '../core/batch.js';
import type { Signal, ReadonlySignal, EffectHandle } from '../core/types.js';
import { computed } from '../core/computed.js';

/**
 * Resource state representing the lifecycle of an async operation.
 */
export interface Resource<T> {
  /** The resolved data (undefined while loading or on error) */
  readonly data: ReadonlySignal<T | undefined>;
  /** Whether the resource is currently loading */
  readonly loading: ReadonlySignal<boolean>;
  /** The error if the fetch failed (undefined otherwise) */
  readonly error: ReadonlySignal<Error | undefined>;
  /** Current state: 'idle' | 'loading' | 'success' | 'error' */
  readonly state: ReadonlySignal<'idle' | 'loading' | 'success' | 'error'>;
  /** Re-fetch the resource */
  refetch(): void;
  /** Dispose the resource and stop auto-refetching */
  dispose(): void;
}

/**
 * Options for creating a resource.
 */
export interface ResourceOptions {
  /** If true, fetch immediately on creation. Defaults to true. */
  immediate?: boolean;
}

/**
 * Create a reactive resource for async data loading.
 * 
 * Automatically re-fetches when reactive dependencies in the `source`
 * function change. Provides reactive `data`, `loading`, `error`, and
 * `state` signals.
 * 
 * @param source - Function that returns the fetch parameters (tracked)
 * @param fetcher - Async function that fetches data given the source params
 * @param options - Optional configuration
 * @returns A Resource object with reactive state
 * 
 * @example
 * ```ts
 * const userId = signal(1);
 * 
 * const user = resource(
 *   () => userId.value,
 *   async (id) => {
 *     const res = await fetch(`/api/users/${id}`);
 *     return res.json();
 *   }
 * );
 * 
 * effect(() => {
 *   if (user.loading.value) console.log('Loading...');
 *   if (user.data.value) console.log('User:', user.data.value);
 *   if (user.error.value) console.log('Error:', user.error.value);
 * });
 * 
 * // Changing userId automatically re-fetches
 * userId.value = 2;
 * ```
 * 
 * @example
 * ```ts
 * // Static resource (no reactive source)
 * const config = resource(
 *   () => null,
 *   async () => {
 *     const res = await fetch('/api/config');
 *     return res.json();
 *   }
 * );
 * ```
 */
export function resource<S, T>(
  source: () => S,
  fetcher: (source: S) => Promise<T>,
  options?: ResourceOptions
): Resource<T> {
  const _data = signal<T | undefined>(undefined);
  const _loading = signal(false);
  const _error = signal<Error | undefined>(undefined);
  const _state = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  let fetchId = 0; // For race condition prevention
  let stopEffect: EffectHandle | null = null;

  async function doFetch(sourceValue: S): Promise<void> {
    const currentId = ++fetchId;

    batch(() => {
      _loading.value = true;
      _error.value = undefined;
      _state.value = 'loading';
    });

    try {
      const result = await fetcher(sourceValue);

      // Guard against stale responses (race condition)
      if (currentId !== fetchId) return;

      batch(() => {
        _data.value = result;
        _loading.value = false;
        _state.value = 'success';
      });
    } catch (err) {
      if (currentId !== fetchId) return;

      batch(() => {
        _error.value = err instanceof Error ? err : new Error(String(err));
        _loading.value = false;
        _state.value = 'error';
      });
    }
  }

  // Track reactive source and auto-refetch
  const immediate = options?.immediate ?? true;
  let latestSource: S;

  if (immediate) {
    stopEffect = effect(() => {
      latestSource = source();
      doFetch(latestSource);
    });
  } else {
    // Still track but don't fetch initially
    let isFirst = true;
    stopEffect = effect(() => {
      latestSource = source();
      if (isFirst) {
        isFirst = false;
        return;
      }
      doFetch(latestSource);
    });
  }

  return {
    data: computed(() => _data.value),
    loading: computed(() => _loading.value),
    error: computed(() => _error.value),
    state: computed(() => _state.value),
    refetch() {
      doFetch(latestSource);
    },
    dispose() {
      if (stopEffect) {
        stopEffect();
        stopEffect = null;
      }
    },
  };
}
