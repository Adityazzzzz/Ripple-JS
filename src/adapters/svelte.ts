/**
 * Ripple.js Svelte Adapter
 * 
 * Makes Ripple.js signals compatible with Svelte's store contract,
 * so you can use `$signal` syntax in Svelte components.
 * 
 * @module ripple-js/svelte
 * 
 * @example
 * ```svelte
 * <script>
 *   import { signal } from 'ripple-js';
 *   import { toStore } from 'ripple-js/svelte';
 * 
 *   const count = signal(0);
 *   const count$ = toStore(count);
 * </script>
 * 
 * <button on:click={() => count.value++}>
 *   Count: {$count$}
 * </button>
 * ```
 */

import { effect } from '../core/effect.js';
import { signal } from '../core/signal.js';
import type { Signal, ReadonlySignal, EffectHandle } from '../core/types.js';

/**
 * Svelte store contract — any object with a `subscribe` method.
 */
export interface SvelteReadable<T> {
  subscribe(run: (value: T) => void): () => void;
}

export interface SvelteWritable<T> extends SvelteReadable<T> {
  set(value: T): void;
  update(fn: (value: T) => T): void;
}

/**
 * Convert a Ripple signal to a Svelte-compatible writable store.
 * 
 * The returned store implements Svelte's store contract:
 * - `subscribe(callback)` — returns an unsubscribe function
 * - `set(value)` — sets the signal's value
 * - `update(fn)` — updates via a function
 * 
 * This means you can use `$store` syntax in Svelte templates.
 * 
 * @param sig - Ripple signal to convert
 * @returns A Svelte-compatible writable store
 * 
 * @example
 * ```svelte
 * <script>
 *   import { signal } from 'ripple-js';
 *   import { toStore } from 'ripple-js/svelte';
 * 
 *   const count = signal(0);
 *   const count$ = toStore(count);
 * </script>
 * 
 * <p>Count: {$count$}</p>
 * <button on:click={() => $count$ = $count$ + 1}>Increment</button>
 * ```
 */
export function toStore<T>(sig: Signal<T>): SvelteWritable<T> {
  return {
    subscribe(run: (value: T) => void): () => void {
      // Immediately call with current value (Svelte contract requirement)
      let dispose: EffectHandle | null = null;

      dispose = effect(() => {
        run(sig.value);
      });

      return () => {
        if (dispose) {
          dispose();
          dispose = null;
        }
      };
    },
    set(value: T): void {
      sig.value = value;
    },
    update(fn: (value: T) => T): void {
      sig.value = fn(sig.peek());
    },
  };
}

/**
 * Convert a Ripple computed/ReadonlySignal to a Svelte-compatible readable store.
 * 
 * @param sig - Ripple computed to convert
 * @returns A Svelte-compatible readable store
 * 
 * @example
 * ```svelte
 * <script>
 *   import { signal, computed } from 'ripple-js';
 *   import { toReadableStore } from 'ripple-js/svelte';
 * 
 *   const count = signal(0);
 *   const doubled = computed(() => count.value * 2);
 *   const doubled$ = toReadableStore(doubled);
 * </script>
 * 
 * <p>Doubled: {$doubled$}</p>
 * ```
 */
export function toReadableStore<T>(sig: ReadonlySignal<T>): SvelteReadable<T> {
  return {
    subscribe(run: (value: T) => void): () => void {
      let dispose: EffectHandle | null = null;

      dispose = effect(() => {
        run(sig.value);
      });

      return () => {
        if (dispose) {
          dispose();
          dispose = null;
        }
      };
    },
  };
}

/**
 * Convert a Svelte store to a Ripple signal.
 * 
 * @param store - Svelte store with subscribe method
 * @returns A Ripple signal synced with the store
 * 
 * @example
 * ```ts
 * import { writable } from 'svelte/store';
 * import { fromStore } from 'ripple-js/svelte';
 * 
 * const count = writable(0);
 * const rippleCount = fromStore(count);
 * 
 * // Now use with Ripple's effect/computed
 * effect(() => console.log(rippleCount.value));
 * ```
 */
export function fromStore<T>(store: SvelteReadable<T>): Signal<T> {
  let initialValue: T = undefined as T;

  // Svelte stores call subscribe synchronously with current value
  const unsub = store.subscribe((value) => {
    initialValue = value;
  });
  unsub();

  const sig = signal<T>(initialValue);

  // Keep signal in sync with store
  const unsubscribe = store.subscribe((value) => {
    sig.value = value;
  });

  return sig;
}
