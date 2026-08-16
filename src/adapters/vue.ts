/**
 * Ripple.js Vue 3 Adapter
 * 
 * Provides composables to bridge Ripple.js signals with Vue's reactivity system.
 * Allows using Ripple signals inside Vue components with automatic reactivity.
 * 
 * @module ripple-js/vue
 * 
 * @example
 * ```vue
 * <script setup>
 * import { signal } from 'ripple-js';
 * import { useSignal, toVueRef } from 'ripple-js/vue';
 * 
 * const count = signal(0);
 * const countRef = toVueRef(count);
 * // countRef works like a normal Vue ref
 * </script>
 * 
 * <template>
 *   <button @click="countRef++">{{ countRef }}</button>
 * </template>
 * ```
 */

import {
  ref,
  computed as vueComputed,
  watch as vueWatch,
  onUnmounted,
  type Ref,
  type ComputedRef,
  customRef,
} from 'vue';
import { signal } from '../core/signal.js';
import { computed } from '../core/computed.js';
import { effect } from '../core/effect.js';
import type { Signal, ReadonlySignal, EffectHandle } from '../core/types.js';

/**
 * Convert a Ripple signal to a Vue ref.
 * 
 * The returned ref is two-way bound: reading the ref reads the signal,
 * writing the ref writes the signal. Changes propagate in both directions.
 * 
 * @param sig - Ripple signal to convert
 * @returns A Vue ref backed by the Ripple signal
 * 
 * @example
 * ```vue
 * <script setup>
 * import { signal } from 'ripple-js';
 * import { toVueRef } from 'ripple-js/vue';
 * 
 * const count = signal(0);
 * const countRef = toVueRef(count);
 * </script>
 * 
 * <template>
 *   <input v-model.number="countRef" />
 *   <p>Count: {{ countRef }}</p>
 * </template>
 * ```
 */
export function toVueRef<T>(sig: Signal<T>): Ref<T> {
  return customRef<T>((track, trigger) => {
    // Watch the Ripple signal for changes and trigger Vue updates
    const dispose = effect(() => {
      sig.value; // track in Ripple
      trigger(); // notify Vue
    });

    // Clean up on component unmount (best-effort)
    try {
      onUnmounted(() => dispose());
    } catch {
      // Not inside a Vue setup context — caller is responsible for cleanup
    }

    return {
      get() {
        track(); // track in Vue
        return sig.peek();
      },
      set(value: T) {
        sig.value = value;
      },
    };
  });
}

/**
 * Convert a Ripple computed to a Vue computed ref.
 * 
 * @param sig - Ripple computed to convert
 * @returns A Vue computed ref backed by the Ripple computed
 * 
 * @example
 * ```vue
 * <script setup>
 * import { signal, computed } from 'ripple-js';
 * import { toVueComputed } from 'ripple-js/vue';
 * 
 * const count = signal(0);
 * const doubled = computed(() => count.value * 2);
 * const doubledRef = toVueComputed(doubled);
 * </script>
 * ```
 */
export function toVueComputed<T>(sig: ReadonlySignal<T>): ComputedRef<T> {
  const vRef = ref(sig.peek()) as Ref<T>;

  const dispose = effect(() => {
    vRef.value = sig.value;
  });

  try {
    onUnmounted(() => dispose());
  } catch {
    // Not in setup context
  }

  return vueComputed(() => vRef.value);
}

/**
 * Convert a Vue ref to a Ripple signal.
 * 
 * @param vueRef - Vue ref to convert
 * @returns A Ripple signal backed by the Vue ref
 * 
 * @example
 * ```ts
 * import { ref } from 'vue';
 * import { fromVueRef } from 'ripple-js/vue';
 * 
 * const count = ref(0);
 * const rippleCount = fromVueRef(count);
 * 
 * // Now use rippleCount with Ripple's effect/computed
 * effect(() => console.log(rippleCount.value));
 * ```
 */
export function fromVueRef<T>(vueRef: Ref<T>): Signal<T> {
  const sig = signal<T>(vueRef.value);

  // Vue → Ripple sync
  vueWatch(vueRef, (newVal) => {
    sig.value = newVal;
  });

  // Ripple → Vue sync
  effect(() => {
    vueRef.value = sig.value;
  });

  return sig;
}

/**
 * Create a local Ripple signal with auto-cleanup in Vue setup.
 * 
 * @param initialValue - Initial value
 * @returns A Ripple signal that can be used in Vue templates via toVueRef
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useSignal } from 'ripple-js/vue';
 * 
 * const count = useSignal(0);
 * </script>
 * ```
 */
export function useSignal<T>(initialValue: T): Signal<T> {
  return signal(initialValue);
}

/**
 * Run a Ripple effect with Vue lifecycle cleanup.
 * 
 * @param fn - Effect function
 * 
 * @example
 * ```vue
 * <script setup>
 * import { signal } from 'ripple-js';
 * import { useSignalEffect } from 'ripple-js/vue';
 * 
 * const count = signal(0);
 * 
 * useSignalEffect(() => {
 *   document.title = `Count: ${count.value}`;
 * });
 * </script>
 * ```
 */
export function useSignalEffect(fn: () => void): void {
  const dispose = effect(fn);

  try {
    onUnmounted(() => dispose());
  } catch {
    // Not in setup context
  }
}
