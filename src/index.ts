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

// Core primitives
export { signal } from './core/signal.js';
export { computed } from './core/computed.js';
export { effect, onCleanup } from './core/effect.js';
export { batch } from './core/batch.js';
export { untrack } from './core/untrack.js';
export { createScope, onDispose } from './core/scope.js';

// Type guards
export { isSignal, isComputed, isReactive } from './core/is.js';

// Readonly wrapper
export { readonly } from './core/readonly.js';

// Utilities
export { watch } from './utils/watch.js';
export type { WatchOptions } from './utils/watch.js';
export { on } from './utils/on.js';
export type { OnOptions } from './utils/on.js';
export { toJSON } from './utils/toJSON.js';
export { memo } from './utils/memo.js';
export { derive } from './utils/derive.js';
export { subscribe } from './utils/subscribe.js';
export { previous } from './utils/previous.js';
export { debouncedEffect, debouncedSignal } from './utils/debounced.js';

// Async resources
export { resource } from './utils/resource.js';
export type { Resource, ResourceOptions } from './utils/resource.js';

// State management
export { createStore } from './utils/store.js';
export type { StoreDefinition, Store } from './utils/store.js';

// History / undo-redo
export { createHistory } from './utils/history.js';
export type { History, HistoryOptions } from './utils/history.js';

// Persistence
export { persistedSignal } from './utils/storage.js';
export type { PersistedSignalOptions } from './utils/storage.js';

// Error handling
export { catchError } from './utils/catchError.js';

// Throttled effect
export { throttledEffect } from './utils/throttled.js';

// Promise interop
export { fromPromise } from './utils/fromPromise.js';
export type { PromiseSignal } from './utils/fromPromise.js';

// Reactive collections
export { reactiveMap, reactiveArray } from './utils/collections.js';
export type { ReactiveMap, ReactiveArray } from './utils/collections.js';

// DevTools (tree-shaken in production)
export {
  getSubscribers,
  getDependencies,
  getNodeInfo,
  getGraphSnapshot,
  createAsyncAccessWarning,
} from './dev/debug.js';
export type { NodeInfo, GraphSnapshot } from './dev/debug.js';
