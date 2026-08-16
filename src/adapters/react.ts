/**
 * Ripple.js React Adapter
 * 
 * Provides hooks to use Ripple.js signals seamlessly within React components.
 * Uses `useSyncExternalStore` (React 18+) for tear-safe concurrent rendering.
 * 
 * @module ripple-js/react
 * 
 * @example
 * ```tsx
 * import { signal } from 'ripple-js';
 * import { useSignal, useComputed, useSignalValue } from 'ripple-js/react';
 * 
 * // Global signals work across components
 * const count = signal(0);
 * 
 * function Counter() {
 *   const value = useSignalValue(count);
 *   return <button onClick={() => count.value++}>{value}</button>;
 * }
 * ```
 */

import { useSyncExternalStore, useRef, useEffect, useMemo, useCallback } from 'react';
import { signal } from '../core/signal.js';
import { computed } from '../core/computed.js';
import { effect } from '../core/effect.js';
import type { Signal, ReadonlySignal, EffectHandle } from '../core/types.js';

/**
 * Subscribe to a Ripple signal's value in a React component.
 * 
 * Re-renders the component whenever the signal's value changes.
 * Uses `useSyncExternalStore` for concurrent mode safety.
 * 
 * @param sig - A Ripple signal or computed to subscribe to
 * @returns The current value of the signal
 * 
 * @example
 * ```tsx
 * const count = signal(0);
 * 
 * function Display() {
 *   const value = useSignalValue(count);
 *   return <span>{value}</span>;
 * }
 * ```
 */
export function useSignalValue<T>(sig: Signal<T> | ReadonlySignal<T>): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const dispose = effect(() => {
        sig.value; // track
        onStoreChange();
      });
      return dispose as () => void;
    },
    [sig]
  );

  const getSnapshot = useCallback(() => sig.peek(), [sig]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Create a local Ripple signal scoped to a React component.
 * 
 * The signal persists across re-renders but is unique to each
 * component instance. Returns `[value, signal]` — the current
 * value and the signal object for writing.
 * 
 * @param initialValue - Initial value for the signal
 * @returns Tuple of [currentValue, signalObject]
 * 
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, countSignal] = useSignal(0);
 *   
 *   return (
 *     <div>
 *       <span>{count}</span>
 *       <button onClick={() => countSignal.value++}>+</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSignal<T>(initialValue: T): [T, Signal<T>] {
  const sigRef = useRef<Signal<T> | null>(null);
  if (sigRef.current === null) {
    sigRef.current = signal(initialValue);
  }

  const value = useSignalValue(sigRef.current);
  return [value, sigRef.current];
}

/**
 * Create a local Ripple computed value scoped to a React component.
 * 
 * The computed persists across re-renders and automatically
 * re-evaluates when its dependencies change.
 * 
 * @param fn - Computation function
 * @param deps - React dependency array (recreates computed if deps change)
 * @returns The current computed value
 * 
 * @example
 * ```tsx
 * const count = signal(0);
 * 
 * function DoubleDisplay() {
 *   const doubled = useComputed(() => count.value * 2);
 *   return <span>{doubled}</span>;
 * }
 * ```
 */
export function useComputed<T>(fn: () => T, deps: any[] = []): T {
  const computedRef = useRef<ReadonlySignal<T> | null>(null);

  useMemo(() => {
    computedRef.current = computed(fn);
  }, deps);

  return useSignalValue(computedRef.current!);
}

/**
 * Run a Ripple effect tied to the React component lifecycle.
 * 
 * The effect is created on mount and disposed on unmount.
 * It automatically tracks reactive dependencies.
 * 
 * @param fn - Effect function
 * @param deps - React dependency array (recreates effect if deps change)
 * 
 * @example
 * ```tsx
 * const searchQuery = signal('');
 * 
 * function SearchResults() {
 *   useSignalEffect(() => {
 *     console.log('Query changed:', searchQuery.value);
 *     // Fetch results...
 *   });
 *   
 *   return <input onChange={e => searchQuery.value = e.target.value} />;
 * }
 * ```
 */
export function useSignalEffect(fn: () => void | (() => void), deps: any[] = []): void {
  useEffect(() => {
    const dispose = effect((onCleanup) => {
      const cleanup = fn();
      if (typeof cleanup === 'function') {
        onCleanup(cleanup);
      }
    });
    return dispose as () => void;
  }, deps);
}
