import { CLEAN, DIRTY } from './constants.js';
import type { Link } from './link.js';
import type { ReactiveNode, EffectHandle, CleanupFn } from './types.js';
import {
  setActiveSubscriber,
  startTracking,
  endTracking,
  clearDependencies,
  queueEffect,
} from './graph.js';

/** Reference to the currently executing effect's cleanup registry */
let activeCleanups: CleanupFn[] | null = null;

/**
 * Register a cleanup function for the currently running effect.
 * The cleanup will be called before the effect re-runs or when disposed.
 *
 * @param fn - Cleanup function to register
 *
 * @example
 * ```ts
 * effect((onCleanup) => {
 *   const id = setInterval(() => tick(), 1000);
 *   onCleanup(() => clearInterval(id));
 * });
 * ```
 */
export function onCleanup(fn: CleanupFn): void {
  if (activeCleanups !== null) {
    activeCleanups.push(fn);
  }
}

/**
 * Internal node representing a reactive side-effect.
 *
 * Effects automatically track signal/computed dependencies
 * during execution and re-run when those dependencies change.
 */
class EffectNode implements ReactiveNode {
  _state = DIRTY; // Start dirty so initial run happens
  _subHead: Link | null = null;
  _subTail: Link | null = null;
  _depHead: Link | null = null;
  _depTail: Link | null = null;
  _version = 0;

  private _fn: (onCleanup: (fn: CleanupFn) => void) => void;
  private _cleanups: CleanupFn[] = [];
  private _disposed = false;

  /** Scope that owns this effect (if any) */
  _owner: { _removeChild(node: EffectNode): void } | null = null;

  constructor(fn: (onCleanup: (fn: CleanupFn) => void) => void) {
    this._fn = fn;
  }

  /**
   * Execute the effect function.
   * Called by the graph engine when dependencies change.
   */
  _execute(): void {
    if (this._disposed) return;

    // Run cleanup functions from the previous execution
    this._runCleanups();

    const prevSubscriber = setActiveSubscriber(this);
    startTracking(this);

    // Set up cleanup registration context
    const prevCleanups = activeCleanups;
    activeCleanups = this._cleanups;

    try {
      this._fn(onCleanup);
      this._state = CLEAN;
    } catch (err) {
      this._state = CLEAN;
      throw err;
    } finally {
      activeCleanups = prevCleanups;
      endTracking(this);
      setActiveSubscriber(prevSubscriber);
    }
  }

  /**
   * Dispose this effect, removing it from the reactive graph.
   */
  _dispose(): void {
    if (this._disposed) return;
    this._disposed = true;

    this._runCleanups();
    clearDependencies(this);

    // Remove from owner scope if registered
    if (this._owner !== null) {
      this._owner._removeChild(this);
      this._owner = null;
    }
  }

  /**
   * Run all registered cleanup functions.
   */
  private _runCleanups(): void {
    const cleanups = this._cleanups;
    for (let i = 0; i < cleanups.length; i++) {
      try {
        cleanups[i]();
      } catch (err) {
        // Log but don't throw during cleanup
        console.error('Ripple.js: Error in effect cleanup:', err);
      }
    }
    cleanups.length = 0;
  }
}

/**
 * Create a reactive side-effect that automatically tracks dependencies.
 *
 * The effect function runs immediately on creation, and re-runs whenever
 * any signal or computed value it reads changes.
 *
 * Returns a dispose function to stop the effect.
 *
 * @param fn - Effect function. Receives an `onCleanup` callback for registering teardown logic.
 * @returns A function that disposes the effect when called
 *
 * @example
 * ```ts
 * const count = signal(0);
 *
 * // Basic effect
 * const stop = effect(() => {
 *   console.log('Count:', count.value);
 * });
 *
 * count.value = 1; // logs: "Count: 1"
 * stop();          // effect is disposed
 * count.value = 2; // nothing happens
 * ```
 *
 * @example
 * ```ts
 * // Effect with cleanup
 * const stop = effect((onCleanup) => {
 *   const handler = () => console.log('clicked at count:', count.value);
 *   document.addEventListener('click', handler);
 *   onCleanup(() => document.removeEventListener('click', handler));
 * });
 * ```
 */
export function effect(
  fn: (onCleanup: (fn: CleanupFn) => void) => void
): EffectHandle {
  const node = new EffectNode(fn);

  // Register with current scope if one exists
  if (currentScope !== null) {
    currentScope._addChild(node);
    node._owner = currentScope;
  }

  // Initial execution
  node._execute();

  // Return dispose function
  const dispose = () => node._dispose();
  return dispose as EffectHandle;
}

// Forward reference to scope (will be set by scope.ts)
let currentScope: { _addChild(node: EffectNode): void; _removeChild(node: EffectNode): void } | null = null;

/**
 * Set the current active scope (called by scope.ts).
 * @internal
 */
export function setCurrentScope(scope: typeof currentScope): typeof currentScope {
  const prev = currentScope;
  currentScope = scope;
  return prev;
}

/**
 * Get the current active scope.
 * @internal
 */
export function getCurrentScope(): typeof currentScope {
  return currentScope;
}
