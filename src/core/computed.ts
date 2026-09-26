import { CLEAN, DIRTY, type NodeState } from './constants.js';
import type { Link } from './link.js';
import type { ReactiveNode, ReadonlySignal, ComputedOptions } from './types.js';
import { ComputedBrand } from './types.js';
import { track, updateIfDirty, setActiveSubscriber, startTracking, endTracking, propagate, clearDependencies } from './graph.js';
import { getCurrentScope } from './effect.js';

/**
 * Internal node representing a computed (derived) reactive value.
 * 
 * Computed values are:
 * - Lazy: Only evaluated when read
 * - Memoized: Cached until dependencies change
 * - Glitch-free: Uses push-pull algorithm to avoid stale reads
 */
class ComputedNode<T> implements ReactiveNode {
  _state: NodeState = DIRTY; // Start dirty so first read triggers computation
  _subHead: Link | null = null;
  _subTail: Link | null = null;
  _depHead: Link | null = null;
  _depTail: Link | null = null;
  _version = 0;

  _value: T = undefined!;
  _initialized = false;
  _compute: () => T;
  _equals: (a: T, b: T) => boolean;
  _disposed = false;

  readonly [ComputedBrand] = true as const;

  constructor(compute: () => T, options?: ComputedOptions<T>) {
    this._compute = compute;
    this._equals = options?.equals ?? Object.is;
  }

  /**
   * Dispose this computed node, disconnecting it from the reactive graph.
   * After disposal, reading .value returns the last cached value without tracking.
   */
  _dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    clearDependencies(this);
    this._subHead = null;
    this._subTail = null;
  }

  /**
   * Public dispose method for manual cleanup.
   */
  dispose(): void {
    this._dispose();
  }

  /**
   * Read the computed value.
   * Triggers lazy re-evaluation if the node is dirty.
   * Registers a dependency if inside a tracked context.
   */
  get value(): T {
    if (this._disposed) return this._value;
    // Pull phase: update if needed
    updateComputed(this);
    // Register dependency on this computed
    track(this);
    return this._value;
  }

  /**
   * Read the computed value without tracking.
   * Still triggers evaluation if dirty (to ensure freshness).
   */
  peek(): T {
    if (this._disposed) return this._value;
    updateComputed(this);
    return this._value;
  }
}

/**
 * Re-evaluate a computed node if it's dirty.
 * Uses the push-pull algorithm to determine if re-evaluation is needed.
 */
function updateComputed<T>(node: ComputedNode<T>): void {
  if (node._state === CLEAN) return;

  // Use the graph's updateIfDirty for CHECK_DIRTY resolution
  if (updateIfDirty(node)) {
    // Value changed — propagate to our own subscribers
    if (node._subHead !== null) {
      propagate(node);
    }
  } else if (node._state === DIRTY) {
    // First computation or forced dirty — evaluate directly
    const prevSubscriber = setActiveSubscriber(node);
    startTracking(node);

    try {
      const newValue = node._compute();

      // Skip equality check on first computation (value is uninitialized)
      const changed = !node._initialized || !node._equals(node._value, newValue);

      if (changed) {
        node._value = newValue;
        node._initialized = true;
        node._version++;

        // Propagate to subscribers if value changed
        if (node._subHead !== null) {
          propagate(node);
        }
      }

      node._state = CLEAN;
    } catch (err) {
      node._state = CLEAN;
      throw err;
    } finally {
      endTracking(node);
      setActiveSubscriber(prevSubscriber);
    }
  }
}


/**
 * Create a computed (derived) reactive value.
 * 
 * The computation function is evaluated lazily on first read,
 * and re-evaluated only when its dependencies change.
 * Results are memoized — if the recomputed value is the same
 * as the previous value (via Object.is or custom equals),
 * downstream subscribers are NOT notified.
 * 
 * @param compute - Function that computes the derived value
 * @param options - Optional configuration (custom equality function)
 * @returns A ReadonlySignal with .value getter and .peek()
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * const double = computed(() => count.value * 2);
 * console.log(double.value); // 0
 * count.value = 5;
 * console.log(double.value); // 10
 * ```
 * 
 * @example
 * ```ts
 * // With custom equality (deep comparison)
 * const data = signal({ x: 1, y: 2 });
 * const point = computed(
 *   () => ({ x: data.value.x, y: data.value.y }),
 *   { equals: (a, b) => a.x === b.x && a.y === b.y }
 * );
 * ```
 */
export function computed<T>(compute: () => T, options?: ComputedOptions<T>): ReadonlySignal<T> {
  const node = new ComputedNode(compute, options);
  
  // Register with active scope for automatic disposal
  const scope = getCurrentScope();
  if (scope !== null && typeof (scope as any)._addChild === 'function') {
    (scope as any)._addChild(node);
  }
  
  return node as unknown as ReadonlySignal<T>;
}
