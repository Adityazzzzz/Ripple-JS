/**
 * Ripple.js — A standalone, framework-agnostic reactive utility library.
 * 
 * One change ripples through all dependents.
 * 
 * @packageDocumentation
 */

// Core types (re-exported for library consumers)
export type {
  Signal,
  ReadonlySignal,
  EffectHandle,
  CleanupFn,
  Scope,
  SignalGetter,
  SignalSetter,
  ComputedOptions,
} from './core/types.js';

export { SignalBrand, ComputedBrand } from './core/types.js';

// Core primitives will be added as they're implemented:
export { signal } from './core/signal.js';
export { computed } from './core/computed.js';
export { effect, onCleanup } from './core/effect.js';
export { batch } from './core/batch.js';
export { untrack } from './core/untrack.js';
export { createScope, onDispose } from './core/scope.js';

// Utilities
export { watch } from './utils/watch.js';
export type { WatchOptions } from './utils/watch.js';
export { on } from './utils/on.js';
export type { OnOptions } from './utils/on.js';
export { toJSON } from './utils/toJSON.js';
// DevTools (tree-shaken in production)
export {
  getSubscribers,
  getDependencies,
  getNodeInfo,
  getGraphSnapshot,
  createAsyncAccessWarning,
} from './dev/debug.js';
export type { NodeInfo, GraphSnapshot } from './dev/debug.js';
