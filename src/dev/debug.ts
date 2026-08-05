import type { ReactiveNode } from '../core/types.js';
import type { Link } from '../core/link.js';

/**
 * Development-mode debugging utilities for Ripple.js.
 * 
 * These functions allow inspection of the reactive dependency graph
 * for debugging, visualization, and tooling purposes.
 * 
 * In production builds, these should be tree-shaken out.
 */

/**
 * Information about a reactive node for debugging.
 */
export interface NodeInfo {
  /** The node itself */
  node: ReactiveNode;
  /** Current state: 0=CLEAN, 1=CHECK_DIRTY, 2=DIRTY */
  state: number;
  /** Current version number */
  version: number;
  /** Number of subscribers (nodes that depend on this) */
  subscriberCount: number;
  /** Number of dependencies (nodes this depends on) */
  dependencyCount: number;
  /** Whether this node is a signal (has no _compute) */
  isSignal: boolean;
  /** Whether this node is a computed (has _compute) */
  isComputed: boolean;
  /** Whether this node is an effect (has _execute) */
  isEffect: boolean;
}

/**
 * Get all subscriber nodes of a reactive node.
 * Returns the nodes that depend on the given source.
 * 
 * @param source - The reactive node to inspect
 * @returns Array of subscriber nodes
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * const double = computed(() => count.value * 2);
 * effect(() => console.log(double.value));
 * 
 * // In devtools:
 * getSubscribers(count); // [ComputedNode(double)]
 * getSubscribers(double); // [EffectNode]
 * ```
 */
export function getSubscribers(source: ReactiveNode): ReactiveNode[] {
  const subscribers: ReactiveNode[] = [];
  let link: Link | null = source._subHead;
  while (link !== null) {
    subscribers.push(link.subscriber);
    link = link.nextSub;
  }
  return subscribers;
}

/**
 * Get all dependency nodes of a reactive node.
 * Returns the nodes that the given subscriber depends on.
 * 
 * @param subscriber - The reactive node to inspect
 * @returns Array of dependency nodes
 * 
 * @example
 * ```ts
 * const a = signal(1);
 * const b = signal(2);
 * const sum = computed(() => a.value + b.value);
 * 
 * getDependencies(sum); // [SignalNode(a), SignalNode(b)]
 * ```
 */
export function getDependencies(subscriber: ReactiveNode): ReactiveNode[] {
  const dependencies: ReactiveNode[] = [];
  let link: Link | null = subscriber._depHead;
  while (link !== null) {
    dependencies.push(link.source);
    link = link.nextDep;
  }
  return dependencies;
}

/**
 * Get detailed information about a reactive node.
 * 
 * @param node - The reactive node to inspect
 * @returns NodeInfo with debugging details
 */
export function getNodeInfo(node: ReactiveNode): NodeInfo {
  return {
    node,
    state: node._state,
    version: node._version,
    subscriberCount: countLinks(node._subHead, 'nextSub'),
    dependencyCount: countLinks(node._depHead, 'nextDep'),
    isSignal: !('_compute' in node) && !('_execute' in node),
    isComputed: '_compute' in node,
    isEffect: '_execute' in node,
  };
}

/**
 * Traverse the entire reactive graph starting from a set of root nodes.
 * Returns a snapshot of all reachable nodes and their connections.
 * 
 * Useful for visualizing the reactive dependency graph in devtools.
 * 
 * @param roots - Starting nodes for the traversal
 * @returns A snapshot of the reactive graph
 */
export interface GraphSnapshot {
  nodes: NodeInfo[];
  edges: Array<{ from: ReactiveNode; to: ReactiveNode }>;
}

export function getGraphSnapshot(roots: ReactiveNode[]): GraphSnapshot {
  const visited = new Set<ReactiveNode>();
  const nodes: NodeInfo[] = [];
  const edges: Array<{ from: ReactiveNode; to: ReactiveNode }> = [];

  function traverse(node: ReactiveNode): void {
    if (visited.has(node)) return;
    visited.add(node);

    nodes.push(getNodeInfo(node));

    // Traverse subscribers (downstream)
    let subLink: Link | null = node._subHead;
    while (subLink !== null) {
      edges.push({ from: node, to: subLink.subscriber });
      traverse(subLink.subscriber);
      subLink = subLink.nextSub;
    }

    // Traverse dependencies (upstream)
    let depLink: Link | null = node._depHead;
    while (depLink !== null) {
      traverse(depLink.source);
      depLink = depLink.nextDep;
    }
  }

  for (const root of roots) {
    traverse(root);
  }

  return { nodes, edges };
}

/**
 * Count the number of links in a linked list.
 */
function countLinks(head: Link | null, nextProp: 'nextSub' | 'nextDep'): number {
  let count = 0;
  let link = head;
  while (link !== null) {
    count++;
    link = link[nextProp];
  }
  return count;
}

/**
 * Create a warning system for async signal access.
 * When enabled, warns when signals are read after an await boundary
 * inside an effect (which won't be tracked).
 * 
 * @returns Functions to enable/disable the warning system
 */
export function createAsyncAccessWarning(): {
  enable: () => void;
  disable: () => void;
} {
  let enabled = false;
  let originalConsoleWarn = console.warn;

  return {
    enable() {
      enabled = true;
      // In a real implementation, this would monkey-patch the tracking
      // system to detect when signals are read outside the synchronous
      // execution of an effect. For now, it's a stub that can be
      // expanded with Zone.js-style async tracking or AsyncLocalStorage.
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__RIPPLE_DEV__ = true;
      }
    },
    disable() {
      enabled = false;
      if (typeof globalThis !== 'undefined') {
        delete (globalThis as any).__RIPPLE_DEV__;
      }
    },
  };
}
