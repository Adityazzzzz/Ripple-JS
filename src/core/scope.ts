import type { Scope as ScopeType } from './types.js';
import { setCurrentScope, getCurrentScope } from './effect.js';

/**
 * Internal node representing a reactive ownership scope.
 *
 * Scopes create a hierarchy of ownership for effects and nested scopes.
 * When a scope is disposed, all effects and child scopes created within
 * it are automatically cleaned up.
 */
class ScopeNode {
  private _children: Array<{ _dispose?(): void; dispose?(): void }> = [];
  private _cleanups: Array<() => void> = [];
  private _disposed = false;
  private _parent: ScopeNode | null = null;

  /**
   * Run a function within this scope.
   * All effects created inside the function will be owned by this scope.
   */
  run<T>(fn: () => T): T {
    if (this._disposed) {
      throw new Error('Ripple.js: Cannot run within a disposed scope');
    }

    const prevScope = setCurrentScope(this as any);
    try {
      return fn();
    } finally {
      setCurrentScope(prevScope);
    }
  }

  /**
   * Dispose this scope and all owned reactive nodes.
   * Disposal cascades to all children recursively.
   */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;

    // Dispose children in reverse order (LIFO)
    const children = this._children;
    for (let i = children.length - 1; i >= 0; i--) {
      try {
        const child = children[i];
        if (child._dispose) {
          child._dispose();
        } else if (child.dispose) {
          child.dispose();
        }
      } catch (err) {
        console.error('Ripple.js: Error during scope disposal:', err);
      }
    }
    this._children.length = 0;

    // Run scope-level cleanups
    const cleanups = this._cleanups;
    for (let i = 0; i < cleanups.length; i++) {
      try {
        cleanups[i]();
      } catch (err) {
        console.error('Ripple.js: Error in scope cleanup:', err);
      }
    }
    this._cleanups.length = 0;

    // Remove from parent scope
    if (this._parent !== null) {
      this._parent._removeChild(this as any);
      this._parent = null;
    }
  }

  /** Whether this scope has been disposed */
  get disposed(): boolean {
    return this._disposed;
  }

  /**
   * Add a child node (effect or nested scope) to this scope.
   * @internal
   */
  _addChild(child: { _dispose?(): void; dispose?(): void }): void {
    this._children.push(child);
  }

  /**
   * Remove a child node from this scope.
   * Called when a child is independently disposed.
   * @internal
   */
  _removeChild(child: { _dispose?(): void; dispose?(): void }): void {
    const idx = this._children.indexOf(child);
    if (idx !== -1) {
      this._children.splice(idx, 1);
    }
  }

  /**
   * Register a cleanup function to run when the scope is disposed.
   * @internal
   */
  _addCleanup(fn: () => void): void {
    this._cleanups.push(fn);
  }
}

/**
 * Create a new reactive scope for managing effect lifecycles.
 *
 * All effects and nested scopes created within `scope.run(fn)` are
 * owned by this scope. Calling `scope.dispose()` will clean up
 * all owned nodes recursively.
 *
 * @returns A Scope object with `.run()` and `.dispose()` methods
 *
 * @example
 * ```ts
 * const scope = createScope();
 *
 * scope.run(() => {
 *   const count = signal(0);
 *   effect(() => console.log(count.value));
 *   effect(() => console.log(count.value * 2));
 * });
 *
 * // Later: clean up all effects at once
 * scope.dispose();
 * ```
 *
 * @example
 * ```ts
 * // Nested scopes
 * const parent = createScope();
 * parent.run(() => {
 *   const child = createScope();
 *   child.run(() => {
 *     effect(() => { ... });
 *   });
 *   // child is owned by parent
 * });
 * parent.dispose(); // disposes child scope and all its effects too
 * ```
 */
export function createScope(): ScopeType {
  const scope = new ScopeNode();

  // Register with parent scope if one exists
  const parentScope = getCurrentScope() as ScopeNode | null;
  if (parentScope !== null && parentScope instanceof ScopeNode) {
    parentScope._addChild(scope as any);
    (scope as any)._parent = parentScope;
  }

  return scope as unknown as ScopeType;
}

/**
 * Register a cleanup function to run when the current scope is disposed.
 *
 * Must be called within a `scope.run()` context.
 *
 * @param fn - Cleanup function
 *
 * @example
 * ```ts
 * const scope = createScope();
 * scope.run(() => {
 *   onDispose(() => console.log('scope disposed!'));
 * });
 * scope.dispose(); // logs: "scope disposed!"
 * ```
 */
export function onDispose(fn: () => void): void {
  const scope = getCurrentScope() as ScopeNode | null;
  if (scope !== null && scope instanceof ScopeNode) {
    scope._addCleanup(fn);
  }
}
