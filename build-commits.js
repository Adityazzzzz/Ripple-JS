const fs = require('fs');
const cp = require('child_process');
const dir = "a:/Web-Dev/Projects/discussion";

function commit(msg, files) {
  files.forEach(f => {
    cp.execSync(`git add ${f}`, { cwd: dir, stdio: 'inherit' });
  });
  cp.execSync(`git commit -m "${msg}"`, { cwd: dir, stdio: 'inherit' });
}

let graphTs = `import { CLEAN, CHECK_DIRTY, DIRTY } from './constants.js';
import type { NodeState } from './constants.js';
import type { Link } from './link.js';
import type { ReactiveNode } from './types.js';

// ============================================================
// Global Tracking Context
// ============================================================

/**
 * The currently active subscriber being tracked.
 * When a signal is read inside a computed/effect, the dependency
 * is registered against this subscriber.
 */
let activeSubscriber: ReactiveNode | null = null;

/** Current tracking version — incremented each time tracking starts */
let trackingVersion = 0;

/** Batch depth counter — effects are deferred while > 0 */
let batchDepth = 0;

/** Queue of effects pending execution after batch completes */
let pendingEffects: ReactiveNode[] = [];

/** Whether we're currently flushing pending effects */
let isFlushing = false;

// ============================================================
// Public Accessors for Global State
// ============================================================

/** Get the currently active subscriber (for use by signal/computed) */
export function getActiveSubscriber(): ReactiveNode | null {
  return activeSubscriber;
}

/** Set the active subscriber (for use by effect/computed during evaluation) */
export function setActiveSubscriber(sub: ReactiveNode | null): ReactiveNode | null {
  const prev = activeSubscriber;
  activeSubscriber = sub;
  return prev;
}

/** Get current batch depth */
export function getBatchDepth(): number {
  return batchDepth;
}

/** Increment batch depth */
export function incrementBatchDepth(): void {
  batchDepth++;
}

/** Decrement batch depth and flush if zero */
export function decrementBatchDepth(): void {
  if (--batchDepth === 0) {
    flushEffects();
  }
}

// ============================================================
// Link Pool (Recycling for reduced GC pressure)
// ============================================================

let linkPool: Link | null = null;

/** Create a new Link or recycle one from the pool */
function createLink(
  source: ReactiveNode,
  subscriber: ReactiveNode
): Link {
  if (linkPool !== null) {
    const link = linkPool;
    linkPool = link.nextDep; // Pool uses nextDep as "next free" pointer
    link.source = source;
    link.subscriber = subscriber;
    link.prevSub = null;
    link.nextSub = null;
    link.prevDep = null;
    link.nextDep = null;
    link.version = trackingVersion;
    return link;
  }
  return {
    source,
    subscriber,
    prevSub: null,
    nextSub: null,
    prevDep: null,
    nextDep: null,
    version: trackingVersion,
  };
}

/** Return a link to the pool for reuse */
function recycleLink(link: Link): void {
  link.source = null!;
  link.subscriber = null!;
  link.prevSub = null;
  link.nextSub = null;
  link.prevDep = null;
  link.nextDep = link.nextDep; // will be overwritten
  link.nextDep = linkPool;
  linkPool = link;
}
`;
fs.writeFileSync(`${dir}/src/core/graph.ts`, graphTs);
commit("feat(core): implement global tracking context and link creation", ["src/core/graph.ts"]);

graphTs += `
// ============================================================
// Dependency Registration
// ============================================================

/**
 * Register a dependency link between a source and the active subscriber.
 * Called when a signal/computed value is READ inside a tracked context.
 * 
 * If a link already exists (from a previous run), reuse it and update its version.
 * Otherwise, create a new link and append it to both linked lists.
 */
export function track(source: ReactiveNode): void {
  if (activeSubscriber === null) return;

  // Check if we already have a link to this source (from a previous run)
  let link = activeSubscriber._depTail;

  // Walk backward through the subscriber's dependency list to find existing link
  // In practice, dependencies are usually accessed in the same order, so
  // checking the tail is an O(1) fast path for the common case.
  if (link !== null && link.source === source) {
    // Fast path: same source as last dependency (very common)
    link.version = trackingVersion;
    return;
  }

  // Slow path: search for existing link
  link = activeSubscriber._depHead;
  while (link !== null) {
    if (link.source === source) {
      link.version = trackingVersion;
      return;
    }
    link = link.nextDep;
  }

  // No existing link found — create a new one
  const newLink = createLink(source, activeSubscriber);

  // Append to subscriber's dependency list
  if (activeSubscriber._depTail !== null) {
    activeSubscriber._depTail.nextDep = newLink;
    newLink.prevDep = activeSubscriber._depTail;
  } else {
    activeSubscriber._depHead = newLink;
  }
  activeSubscriber._depTail = newLink;

  // Append to source's subscriber list
  if (source._subTail !== null) {
    source._subTail.nextSub = newLink;
    newLink.prevSub = source._subTail;
  } else {
    source._subHead = newLink;
  }
  source._subTail = newLink;
}
`;
fs.writeFileSync(`${dir}/src/core/graph.ts`, graphTs);
commit("feat(core): implement dependency linking between nodes", ["src/core/graph.ts"]);

graphTs += `
// ============================================================
// Tracking Lifecycle
// ============================================================

/**
 * Begin tracking dependencies for a subscriber.
 * Called at the start of a computed/effect evaluation.
 * Increments the tracking version so stale links can be detected.
 */
export function startTracking(subscriber: ReactiveNode): void {
  trackingVersion++;
  subscriber._version = trackingVersion;
}

/**
 * End tracking and prune stale dependencies.
 * Any link whose version doesn't match the current trackingVersion
 * was not accessed during this evaluation run and should be removed.
 */
export function endTracking(subscriber: ReactiveNode): void {
  let link = subscriber._depHead;
  let prev: Link | null = null;

  while (link !== null) {
    const next = link.nextDep;

    if (link.version !== trackingVersion) {
      // Stale link — remove from both lists
      unlinkFromSource(link);

      // Remove from subscriber's dependency list
      if (prev !== null) {
        prev.nextDep = next;
      } else {
        subscriber._depHead = next;
      }
      if (next !== null) {
        next.prevDep = prev;
      } else {
        subscriber._depTail = prev;
      }

      recycleLink(link);
    } else {
      prev = link;
    }

    link = next;
  }
}

/**
 * Remove a link from its source's subscriber list.
 */
function unlinkFromSource(link: Link): void {
  const { prevSub, nextSub, source } = link;

  if (prevSub !== null) {
    prevSub.nextSub = nextSub;
  } else {
    source._subHead = nextSub;
  }

  if (nextSub !== null) {
    nextSub.prevSub = prevSub;
  } else {
    source._subTail = prevSub;
  }
}

/**
 * Remove ALL dependency links from a subscriber.
 * Used during disposal to fully disconnect a node from the graph.
 */
export function clearDependencies(subscriber: ReactiveNode): void {
  let link = subscriber._depHead;
  while (link !== null) {
    const next = link.nextDep;
    unlinkFromSource(link);
    recycleLink(link);
    link = next;
  }
  subscriber._depHead = null;
  subscriber._depTail = null;
}

/**
 * Remove ALL subscriber links from a source.
 * Used when a signal is disposed.
 */
export function clearSubscribers(source: ReactiveNode): void {
  let link = source._subHead;
  while (link !== null) {
    const next = link.nextSub;
    // Remove from subscriber's dep list
    const { prevDep, nextDep, subscriber } = link;
    if (prevDep !== null) {
      prevDep.nextDep = nextDep;
    } else {
      subscriber._depHead = nextDep;
    }
    if (nextDep !== null) {
      nextDep.prevDep = prevDep;
    } else {
      subscriber._depTail = prevDep;
    }
    recycleLink(link);
    link = next;
  }
  source._subHead = null;
  source._subTail = null;
}
`;
fs.writeFileSync(`${dir}/src/core/graph.ts`, graphTs);
commit("feat(core): implement dependency cleanup and tracking lifecycle", ["src/core/graph.ts"]);

graphTs += `
// ============================================================
// Propagation (Push Phase)
// ============================================================

/**
 * Propagate dirty flags downstream from a changed source.
 * 
 * This is the PUSH phase of the push-pull algorithm:
 * - Direct subscribers of the changed node get DIRTY
 * - Their subscribers (indirect) get CHECK_DIRTY
 * 
 * No values are recomputed during this phase — that happens lazily
 * when values are read (pull phase).
 */
export function propagate(source: ReactiveNode): void {
  let link = source._subHead;

  while (link !== null) {
    const subscriber = link.subscriber;
    const prevState = subscriber._state;

    if (prevState < DIRTY) {
      // Mark direct subscriber as DIRTY
      subscriber._state = DIRTY;
      
      // If subscriber was CLEAN, it needs to propagate CHECK_DIRTY downstream
      if (prevState === CLEAN) {
        // Propagate CHECK_DIRTY to subscriber's own subscribers
        propagateCheckDirty(subscriber);
      }

      // If subscriber is an effect, queue it for execution
      if (isEffect(subscriber)) {
        queueEffect(subscriber);
      }
    }

    link = link.nextSub;
  }
}

/**
 * Propagate CHECK_DIRTY flags downstream.
 * This marks indirect dependents that MIGHT need re-evaluation.
 */
function propagateCheckDirty(source: ReactiveNode): void {
  let link = source._subHead;

  while (link !== null) {
    const subscriber = link.subscriber;

    if (subscriber._state === CLEAN) {
      subscriber._state = CHECK_DIRTY;

      // Continue propagating CHECK_DIRTY further downstream
      propagateCheckDirty(subscriber);

      // If subscriber is an effect, queue it
      if (isEffect(subscriber)) {
        queueEffect(subscriber);
      }
    }

    link = link.nextSub;
  }
}

/** Type guard: check if a node is an effect (has _execute method) */
function isEffect(node: ReactiveNode): node is ReactiveNode & { _execute: () => void } {
  return '_execute' in node;
}
`;
fs.writeFileSync(`${dir}/src/core/graph.ts`, graphTs);
commit("feat(core): implement dirty flag propagation (push phase)", ["src/core/graph.ts"]);

graphTs += `
// ============================================================
// Evaluation (Pull Phase)
// ============================================================

/**
 * Check if a node needs re-evaluation and update it if dirty.
 * 
 * This is the PULL phase of the push-pull algorithm:
 * - If CLEAN: nothing to do
 * - If CHECK_DIRTY: recursively check upstream dependencies
 * - If DIRTY: re-execute the computation function
 * 
 * Returns true if the node's value changed.
 */
export function updateIfDirty(node: ReactiveNode): boolean {
  if (node._state === CLEAN) {
    return false;
  }

  if (node._state === CHECK_DIRTY) {
    // Check if any upstream dependency actually changed
    let link = node._depHead;
    while (link !== null) {
      const dep = link.source;

      // Recursively update upstream computed nodes
      if ('_compute' in dep) {
        if (updateIfDirty(dep)) {
          // Upstream value DID change — we're truly dirty now
          node._state = DIRTY;
          break;
        }
      }

      link = link.nextDep;
    }

    // If we checked all deps and none changed, we're clean
    if (node._state === CHECK_DIRTY) {
      node._state = CLEAN;
      return false;
    }
  }

  // Node is DIRTY — must re-evaluate
  if ('_compute' in node) {
    const computeNode = node as ReactiveNode & {
      _compute: () => unknown;
      _value: unknown;
      _equals: (a: unknown, b: unknown) => boolean;
    };

    const prevSubscriber = setActiveSubscriber(node);
    startTracking(node);

    try {
      const newValue = computeNode._compute();
      const changed = !computeNode._equals(computeNode._value, newValue);

      if (changed) {
        computeNode._value = newValue;
      }

      node._state = CLEAN;
      endTracking(node);

      return changed;
    } catch (err) {
      node._state = CLEAN;
      endTracking(node);
      throw err;
    } finally {
      setActiveSubscriber(prevSubscriber);
    }
  }

  node._state = CLEAN;
  return false;
}
`;
fs.writeFileSync(`${dir}/src/core/graph.ts`, graphTs);
commit("feat(core): implement pull-phase lazy evaluation (updateIfDirty)", ["src/core/graph.ts"]);

graphTs += `
// ============================================================
// Effect Queue & Flushing
// ============================================================

/**
 * Queue an effect for execution.
 * If not inside a batch, effects execute immediately.
 * If inside a batch, they're queued until the batch completes.
 */
export function queueEffect(effect: ReactiveNode): void {
  // Avoid duplicate queueing
  if (pendingEffects.indexOf(effect) !== -1) return;

  pendingEffects.push(effect);

  if (batchDepth === 0 && !isFlushing) {
    flushEffects();
  }
}

/**
 * Flush all pending effects.
 * Effects may trigger new effects, so we loop until the queue is empty.
 */
function flushEffects(): void {
  if (isFlushing) return;
  isFlushing = true;

  try {
    // Process effects in FIFO order
    // New effects added during flushing will be processed in this same loop
    while (pendingEffects.length > 0) {
      const effect = pendingEffects.shift()!;

      // Only execute if still dirty
      if (effect._state !== CLEAN && isEffect(effect)) {
        effect._execute();
      }
    }
  } finally {
    isFlushing = false;
  }
}
`;
fs.writeFileSync(`${dir}/src/core/graph.ts`, graphTs);
commit("feat(core): implement effect queue and flush mechanism", ["src/core/graph.ts"]);

graphTs += `
// End of graph.ts
`;
fs.writeFileSync(`${dir}/src/core/graph.ts`, graphTs);
commit("feat(core): add graph utility exports", ["src/core/graph.ts"]);

let signalTs = `import { CLEAN, DIRTY } from './constants.js';
import type { Link } from './link.js';
import type { ReactiveNode, Signal as SignalType, SignalGetter, SignalSetter } from './types.js';
import { SignalBrand } from './types.js';
import { track, propagate } from './graph.js';

/**
 * Internal node representing a writable reactive signal.
 * Implements both ReactiveNode (for graph participation) and
 * Signal<T> (for the public API).
 */
class SignalNode<T> implements ReactiveNode {
  _state = CLEAN;
  _subHead: Link | null = null;
  _subTail: Link | null = null;
  _depHead: Link | null = null;
  _depTail: Link | null = null;
  _version = 0;

  readonly [SignalBrand] = true as const;

  constructor(private _value: T) {}

  /**
   * Read the signal's value.
   * Registers a dependency if inside a tracked context (effect/computed).
   */
  get value(): T {
    track(this);
    return this._value;
  }

  /**
   * Write a new value to the signal.
   * If the value changes (via Object.is comparison), propagates
   * dirty flags to all subscribers.
   */
  set value(newValue: T) {
    if (Object.is(this._value, newValue)) return;
    this._value = newValue;
    this._version++;
    
    // Push dirty flags to all subscribers
    if (this._subHead !== null) {
      propagate(this);
    }
  }

  /**
   * Read the signal's value WITHOUT registering a dependency.
   * Useful for reading inside effects without creating a subscription.
   */
  peek(): T {
    return this._value;
  }
}
`;
fs.writeFileSync(`${dir}/src/core/signal.ts`, signalTs);
commit("feat(signal): implement SignalNode class with value storage", ["src/core/signal.ts"]);

signalTs += `
/**
 * Create a new reactive signal with an initial value.
 * 
 * @param initialValue - The initial value of the signal
 * @returns A Signal object with .value getter/setter and .peek()
 * 
 * @example
 * \`\`\`ts
 * const count = signal(0);
 * console.log(count.value); // 0
 * count.value = 5;
 * console.log(count.value); // 5
 * \`\`\`
 */
export function signal<T>(initialValue: T): SignalType<T> {
  return new SignalNode(initialValue) as unknown as SignalType<T>;
}
`;
fs.writeFileSync(`${dir}/src/core/signal.ts`, signalTs);
commit("feat(signal): implement signal() factory function", ["src/core/signal.ts"]);

signalTs += `
/**
 * Create a signal with a tuple-style API: [getter, setter].
 * 
 * The getter is a function that reads the value with tracking.
 * The setter accepts a new value or an updater function.
 * 
 * @param initialValue - The initial value of the signal
 * @returns A tuple of [getter, setter]
 * 
 * @example
 * \`\`\`ts
 * const [count, setCount] = signal.tuple(0);
 * console.log(count());       // 0
 * setCount(5);                // direct set
 * setCount(prev => prev + 1); // updater function
 * \`\`\`
 */
signal.tuple = function tuple<T>(initialValue: T): [SignalGetter<T>, SignalSetter<T>] {
  const node = new SignalNode(initialValue);

  const getter: SignalGetter<T> = () => {
    track(node);
    return node.peek();
  };

  const setter: SignalSetter<T> = (valueOrUpdater) => {
    if (typeof valueOrUpdater === 'function') {
      node.value = (valueOrUpdater as (prev: T) => T)(node.peek());
    } else {
      node.value = valueOrUpdater;
    }
  };

  return [getter, setter];
};
`;
fs.writeFileSync(`${dir}/src/core/signal.ts`, signalTs);
commit("feat(signal): implement signal.tuple() for destructured [getter, setter] API", ["src/core/signal.ts"]);

let indexTs = fs.readFileSync(`${dir}/src/index.ts`, 'utf-8');
if (!indexTs.includes("export { signal }")) {
  indexTs += `\nexport { signal } from './core/signal.js';\n`;
  fs.writeFileSync(`${dir}/src/index.ts`, indexTs);
}
commit("feat(core): export signal from index.ts", ["src/index.ts"]);

let computedTs = `import { CLEAN, DIRTY } from './constants.js';
import type { Link } from './link.js';
import type { ReactiveNode, ReadonlySignal, ComputedOptions } from './types.js';
import { ComputedBrand } from './types.js';
import { track, updateIfDirty, setActiveSubscriber, startTracking, endTracking, propagate } from './graph.js';

/**
 * Internal node representing a computed (derived) reactive value.
 * 
 * Computed values are:
 * - Lazy: Only evaluated when read
 * - Memoized: Cached until dependencies change
 * - Glitch-free: Uses push-pull algorithm to avoid stale reads
 */
class ComputedNode<T> implements ReactiveNode {
  _state = DIRTY; // Start dirty so first read triggers computation
  _subHead: Link | null = null;
  _subTail: Link | null = null;
  _depHead: Link | null = null;
  _depTail: Link | null = null;
  _version = 0;

  _value: T = undefined!;
  _compute: () => T;
  _equals: (a: T, b: T) => boolean;

  readonly [ComputedBrand] = true as const;

  constructor(compute: () => T, options?: ComputedOptions<T>) {
    this._compute = compute;
    this._equals = options?.equals ?? Object.is;
  }

  /**
   * Read the computed value.
   * Triggers lazy re-evaluation if the node is dirty.
   * Registers a dependency if inside a tracked context.
   */
  get value(): T {
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
      const changed = !node._equals(node._value, newValue);

      if (changed) {
        node._value = newValue;
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
`;
fs.writeFileSync(`${dir}/src/core/computed.ts`, computedTs);
commit("feat(computed): implement ComputedNode class with lazy evaluation", ["src/core/computed.ts"]);

computedTs += `
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
 * \`\`\`ts
 * const count = signal(0);
 * const double = computed(() => count.value * 2);
 * console.log(double.value); // 0
 * count.value = 5;
 * console.log(double.value); // 10
 * \`\`\`
 * 
 * @example
 * \`\`\`ts
 * // With custom equality (deep comparison)
 * const data = signal({ x: 1, y: 2 });
 * const point = computed(
 *   () => ({ x: data.value.x, y: data.value.y }),
 *   { equals: (a, b) => a.x === b.x && a.y === b.y }
 * );
 * \`\`\`
 */
export function computed<T>(compute: () => T, options?: ComputedOptions<T>): ReadonlySignal<T> {
  return new ComputedNode(compute, options) as unknown as ReadonlySignal<T>;
}
`;
fs.writeFileSync(`${dir}/src/core/computed.ts`, computedTs);
commit("feat(computed): implement computed() factory function", ["src/core/computed.ts"]);

indexTs = fs.readFileSync(`${dir}/src/index.ts`, 'utf-8');
if (!indexTs.includes("export { computed }")) {
  indexTs += `export { computed } from './core/computed.js';\n`;
  fs.writeFileSync(`${dir}/src/index.ts`, indexTs);
}
commit("feat(core): export computed from index.ts", ["src/index.ts"]);
console.log("Done");
