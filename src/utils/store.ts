import { signal } from '../core/signal.js';
import { computed } from '../core/computed.js';
import { batch } from '../core/batch.js';
import type { Signal, ReadonlySignal } from '../core/types.js';

/**
 * A reactive store for managing structured application state.
 * 
 * Similar to Zustand or Pinia, but built on Ripple.js signals.
 * Provides a simple API for defining state, getters (computed),
 * and actions.
 * 
 * @example
 * ```ts
 * const useCounter = createStore({
 *   state: () => ({ count: 0, step: 1 }),
 *   getters: (state) => ({
 *     double: () => state.count.value * 2,
 *   }),
 *   actions: (state) => ({
 *     increment() { state.count.value += state.step.value; },
 *     decrement() { state.count.value -= state.step.value; },
 *     reset() {
 *       batch(() => {
 *         state.count.value = 0;
 *         state.step.value = 1;
 *       });
 *     },
 *   }),
 * });
 * 
 * useCounter.increment();
 * console.log(useCounter.count.value);  // 1
 * console.log(useCounter.double.value); // 2
 * ```
 */

type SignalMap<T> = {
  [K in keyof T]: Signal<T[K]>;
};

type ComputedMap<T> = {
  [K in keyof T]: ReadonlySignal<T[K]>;
};

export interface StoreDefinition<
  S extends Record<string, any>,
  G extends Record<string, () => any>,
  A extends Record<string, (...args: any[]) => any>
> {
  /** Factory function returning the initial state */
  state: () => S;
  /** Getters (computed values derived from state) */
  getters?: (state: SignalMap<S>) => G;
  /** Actions (methods that mutate state) */
  actions?: (state: SignalMap<S>) => A;
}

export type Store<
  S extends Record<string, any>,
  G extends Record<string, () => any>,
  A extends Record<string, (...args: any[]) => any>
> = SignalMap<S> & ComputedMap<{ [K in keyof G]: ReturnType<G[K]> }> & A & {
  /** Reset all state to initial values */
  $reset(): void;
  /** Get a plain snapshot of current state */
  $snapshot(): S;
};

export function createStore<
  S extends Record<string, any>,
  G extends Record<string, () => any> = Record<string, never>,
  A extends Record<string, (...args: any[]) => any> = Record<string, never>
>(
  definition: StoreDefinition<S, G, A>
): Store<S, G, A> {
  // Create signals from initial state
  const initialState = definition.state();
  const state = {} as SignalMap<S>;

  for (const key of Object.keys(initialState) as Array<keyof S>) {
    state[key] = signal(initialState[key]) as Signal<S[typeof key]>;
  }

  // Create the store object
  const store: any = { ...state };

  // Add getters as computed values
  if (definition.getters) {
    const getters = definition.getters(state);
    for (const key of Object.keys(getters)) {
      store[key] = computed(getters[key]);
    }
  }

  // Add actions
  if (definition.actions) {
    const actions = definition.actions(state);
    for (const key of Object.keys(actions)) {
      store[key] = actions[key];
    }
  }

  // Add $reset
  store.$reset = () => {
    const fresh = definition.state();
    batch(() => {
      for (const key of Object.keys(fresh) as Array<keyof S>) {
        state[key].value = fresh[key];
      }
    });
  };

  // Add $snapshot
  store.$snapshot = (): S => {
    const snap = {} as S;
    for (const key of Object.keys(state) as Array<keyof S>) {
      snap[key] = state[key].peek();
    }
    return snap;
  };

  return store as Store<S, G, A>;
}
