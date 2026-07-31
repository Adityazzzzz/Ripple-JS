import type { NodeState } from './constants.js';
import type { Link } from './link.js';

/**
 * Base interface for all reactive graph nodes.
 * 
 * Every signal, computed, and effect in Ripple.js implements this interface.
 * The reactive graph is built by connecting ReactiveNodes via Link edges.
 */
export interface ReactiveNode {
  /** Current dirty state of this node */
  _state: NodeState;

  /** Head of this node's subscriber linked list (nodes that depend on this) */
  _subHead: Link | null;

  /** Tail of this node's subscriber linked list */
  _subTail: Link | null;

  /** Head of this node's dependency linked list (nodes this depends on) */
  _depHead: Link | null;

  /** Tail of this node's dependency linked list */
  _depTail: Link | null;

  /** Monotonically increasing version for tracking dependency freshness */
  _version: number;
}

/**
 * A writable reactive value.
 * 
 * Signals are the atomic building blocks of Ripple.js reactivity.
 * Reading `.value` inside a tracked context (effect/computed) registers
 * a dependency. Writing `.value` triggers propagation to all subscribers.
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * count.value;      // read (tracked)
 * count.value = 5;  // write (propagates)
 * count.peek();     // read (untracked)
 * ```
 */
export interface Signal<T> {
  /** Read or write the signal's value. Reading is tracked; writing propagates. */
  value: T;

  /** Read the signal's value without registering a dependency */
  peek(): T;

  /** Brand for type discrimination */
  readonly [SignalBrand]: true;
}

/** Symbol used to brand Signal types for runtime type checking */
export const SignalBrand: unique symbol = Symbol('ripple:signal');

/**
 * A read-only derived reactive value.
 * 
 * Computeds are lazily evaluated and memoized. They only recompute
 * when their dependencies change, and only when read.
 * 
 * @example
 * ```ts
 * const double = computed(() => count.value * 2);
 * double.value; // lazily evaluates
 * ```
 */
export interface ReadonlySignal<T> {
  /** Read the computed value. Triggers lazy evaluation if dirty. */
  readonly value: T;

  /** Read without tracking (still triggers evaluation if dirty) */
  peek(): T;

  /** Brand for type discrimination */
  readonly [ComputedBrand]: true;
}

/** Symbol used to brand Computed types */
export const ComputedBrand: unique symbol = Symbol('ripple:computed');

/**
 * Options for creating a computed value.
 */
export interface ComputedOptions<T> {
  /** Custom equality function. Defaults to Object.is */
  equals?: (prev: T, next: T) => boolean;
}

/**
 * A reactive side-effect subscription.
 * 
 * Effects automatically track their signal/computed dependencies
 * and re-execute when those dependencies change.
 */
export interface EffectHandle {
  /** Dispose this effect, removing it from the reactive graph */
  (): void;
}

/**
 * Cleanup function registered inside an effect via onCleanup.
 * Called before the effect re-runs or when the effect is disposed.
 */
export type CleanupFn = () => void;

/**
 * A scope that owns reactive nodes (effects, computeds) and manages
 * their lifecycle. When a scope is disposed, all owned nodes are cleaned up.
 */
export interface Scope {
  /** Run a function within this scope. All reactive nodes created inside are owned by this scope. */
  run<T>(fn: () => T): T;

  /** Dispose this scope and all owned reactive nodes */
  dispose(): void;

  /** Whether this scope has been disposed */
  readonly disposed: boolean;
}

/**
 * Getter function returned by signal.tuple(). Calling it reads the value with tracking.
 */
export type SignalGetter<T> = () => T;

/**
 * Setter function returned by signal.tuple(). Accepts a value or an updater function.
 */
export type SignalSetter<T> = (valueOrUpdater: T | ((prev: T) => T)) => void;
