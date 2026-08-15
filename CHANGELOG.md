# Changelog

All notable changes to Ripple.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-15

### Added

#### Core Primitives
- `signal(value)` — Writable reactive value with `.value` getter/setter and `.peek()`
- `signal.tuple(value)` — `[getter, setter]` destructuring API (SolidJS-style)
- `computed(fn, options?)` — Lazy, memoized derived values with custom equality support
- `effect(fn)` — Auto-tracking side effects with cleanup via `onCleanup()`
- `batch(fn)` — Coalesce multiple signal writes into a single update flush
- `untrack(fn)` — Read signals without registering dependencies
- `createScope()` — Lifecycle management with `.run()` and `.dispose()`
- `onDispose(fn)` — Register cleanup callbacks on scopes

#### Type Guards
- `isSignal(value)` — Runtime check for Signal instances
- `isComputed(value)` — Runtime check for Computed instances
- `isReactive(value)` — Check for any reactive primitive

#### Utilities
- `readonly(signal)` — Create a read-only view of a signal
- `watch(source, callback, options?)` — Vue-style watcher with old/new values
- `on(deps, callback, options?)` — Explicit dependency tracking
- `toJSON(value)` — Recursively unwrap reactive values to plain data
- `memo(fn)` — Semantic alias for `computed()`
- `derive({ key: fn })` — Create multiple computed values at once
- `subscribe(signal, callback)` — Simple value change listener
- `previous(signal)` — Track the previous value of a signal
- `debouncedEffect(fn, delay)` — Rate-limited effects (search-as-you-type)
- `debouncedSignal(value, delay)` — Signal with debounced writes
- `throttledEffect(fn, interval)` — Throttled effects (scroll handlers)
- `catchError(fn, onError)` — Error boundaries for effects
- `fromPromise(promise)` — Convert Promises to reactive signals

#### Framework Features
- `resource(source, fetcher, options?)` — Async data loading with auto-refetch
- `createStore({ state, getters, actions })` — Zustand/Pinia-style state management
- `createHistory(signal, options?)` — Undo/redo for any signal
- `persistedSignal(key, defaultValue, options?)` — localStorage-backed signals with cross-tab sync

#### DevTools
- `getSubscribers(node)` — Inspect downstream dependencies
- `getDependencies(node)` — Inspect upstream dependencies
- `getNodeInfo(node)` — Debug information about any reactive node
- `getGraphSnapshot(roots)` — Snapshot the entire reactive graph

### Architecture
- Push-pull hybrid reactive engine for glitch-free propagation
- Intrusive doubly-linked lists for memory-efficient dependency tracking
- Link pooling for reduced garbage collection pressure
- Dual output: ESM (`dist/ripple.esm.js`) + CJS (`dist/ripple.cjs.js`)
- Zero dependencies, < 2KB minified + gzipped
