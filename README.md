<div align="center">

# 🌊 Ripple.js

**A standalone, framework-agnostic reactive utility library.**

*One change ripples through all dependents.*

[![Bundle Size](https://img.shields.io/badge/bundle-3.5KB_gzip-brightgreen)]()
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-first-3178c6)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()

</div>

---

## Why Ripple.js?

Most reactivity systems are **locked inside UI frameworks** (React, Vue, Solid). If you want signals and effects in a Node.js script, a game engine, a web worker, or a vanilla JS project — you’re stuck importing a framework’s internals.

**Ripple.js** is reactivity as a **utility**, not a framework byproduct. It gives you fine-grained reactive primitives that work **anywhere JavaScript runs**.

```ts
import { signal, computed, effect } from 'ripple-js';

const count = signal(0);
const double = computed(() => count.value * 2);

effect(() => {
  console.log(`Count: ${count.value}, Double: ${double.value}`);
});
// → "Count: 0, Double: 0"

count.value = 5;
// → "Count: 5, Double: 10"
```

## Features

- 🎯 **Fine-grained reactivity** — signals, computed values, and effects
- 🔗 **Framework-agnostic** — works in browsers, Node.js, Deno, Bun, web workers
- 🪧 **< 2KB** minified + gzipped — smaller than most alternatives
- ⚡ **Push-pull hybrid engine** — glitch-free, diamond-problem-safe
- 🧪 **Zero dependencies** — no bloat, no transitive surprises
- 📦 **Dual API** — `.value` property OR `[getter, setter]` tuple — your choice
- 📝 **TypeScript-first** — written in TS with full type inference
- ♻️ **Memory-safe** — scoped ownership with automatic cleanup
- 🔍 **DevTools** — built-in graph inspection utilities

## Installation

```bash
npm install ripple-js
```

## Quick Start

### Signals — Reactive State

```ts
import { signal } from 'ripple-js';

// Object API
const count = signal(0);
console.log(count.value); // 0
count.value = 5;
console.log(count.value); // 5
count.peek();             // Read without tracking

// Tuple API (like SolidJS)
const [name, setName] = signal.tuple('Alice');
console.log(name());      // 'Alice'
setName('Bob');
setName(prev => prev + '!'); // Updater function
```

### Computed — Derived Values

```ts
import { signal, computed } from 'ripple-js';

const price = signal(10);
const quantity = signal(3);
const total = computed(() => price.value * quantity.value);

console.log(total.value); // 30
price.value = 20;
console.log(total.value); // 60 (auto-updates!)
```

Computed values are **lazy** (only evaluate when read) and **memoized** (skip downstream updates if the result hasn't changed).

```ts
// Custom equality for objects
const point = computed(
  () => ({ x: xSignal.value, y: ySignal.value }),
  { equals: (a, b) => a.x === b.x && a.y === b.y }
);
```

### Effects — Side Effects

```ts
import { signal, effect } from 'ripple-js';

const user = signal('Alice');

const stop = effect(() => {
  console.log(`Hello, ${user.value}!`);
});
// → "Hello, Alice!"

user.value = 'Bob';
// → "Hello, Bob!"

stop(); // Dispose the effect
```

#### Cleanup

```ts
effect((onCleanup) => {
  const id = setInterval(() => tick(), 1000);
  onCleanup(() => clearInterval(id));
});
```

### Batch — Coalesce Updates

```ts
import { signal, effect, batch } from 'ripple-js';

const first = signal('John');
const last = signal('Doe');

effect(() => console.log(`${first.value} ${last.value}`));

batch(() => {
  first.value = 'Jane';
  last.value = 'Smith';
});
// Effect runs ONCE: "Jane Smith" (not twice)
```

### Untrack — Opt Out of Tracking

```ts
import { signal, effect, untrack } from 'ripple-js';

const tracked = signal(0);
const untracked = signal(0);

effect(() => {
  console.log(
    tracked.value,                    // This IS tracked
    untrack(() => untracked.value)    // This is NOT tracked
  );
});

untracked.value = 99; // Effect does NOT re-run
tracked.value = 1;    // Effect re-runs
```

### Scopes — Lifecycle Management

```ts
import { signal, effect, createScope, onDispose } from 'ripple-js';

const scope = createScope();

scope.run(() => {
  const count = signal(0);
  effect(() => console.log(count.value));
  effect(() => console.log(count.value * 2));

  onDispose(() => console.log('Scope cleaned up!'));
});

scope.dispose(); // Stops ALL effects, runs cleanup
```

Scopes nest automatically:

```ts
const parent = createScope();
parent.run(() => {
  const child = createScope();
  child.run(() => {
    effect(() => { /* ... */ });
  });
});
parent.dispose(); // Disposes child scope and its effects too
```

### Watch — Observe Changes

```ts
import { signal, watch } from 'ripple-js';

const temperature = signal(20);

watch(
  () => temperature.value,
  (newTemp, oldTemp) => {
    console.log(`Temperature changed: ${oldTemp}° → ${newTemp}°`);
  }
);

temperature.value = 25;
// → "Temperature changed: 20° → 25°"
```

### On — Explicit Dependencies

```ts
import { signal, on } from 'ripple-js';

const x = signal(0);
const y = signal(0);

on([x, y], ([xVal, yVal]) => {
  console.log(`Position: (${xVal}, ${yVal})`);
});
```

### toJSON — Serialize Reactive State

```ts
import { signal, toJSON } from 'ripple-js';

const user = {
  name: signal('Alice'),
  age: signal(30),
  role: 'admin',
};

JSON.stringify(toJSON(user));
// '{"name":"Alice","age":30,"role":"admin"}'
```

## Architecture

Ripple.js uses a **push-pull hybrid** reactive engine:

1. **Push Phase**: When a signal changes, dirty flags propagate downstream instantly
2. **Pull Phase**: Computed values evaluate lazily only when read

This ensures **glitch-free propagation** — no intermediate stale values, even in diamond dependency graphs:

```
       [ count ]
        /      \
   [ left ]   [ right ]
        \      /
       [ bottom ]
```

When `count` changes, `bottom` recomputes **exactly once** with both `left` and `right` already updated.

### Memory Efficiency

- **Intrusive doubly-linked lists** for dependency tracking (no `Set` or `Array` allocations)
- **Link pooling** for reduced GC pressure
- **Automatic stale dependency pruning** on re-evaluation

## DevTools

```ts
import { signal, computed, effect, getSubscribers, getDependencies, getNodeInfo } from 'ripple-js';

const count = signal(0);
const double = computed(() => count.value * 2);
effect(() => console.log(double.value));

// Inspect the graph
getSubscribers(count);  // [ComputedNode]
getDependencies(double); // [SignalNode]
getNodeInfo(count);     // { state, version, subscriberCount, ... }
```

## Comparison

| Feature | Ripple.js | @preact/signals | @vue/reactivity | solid-js |
|:---|:---:|:---:|:---:|:---:|
| Standalone | ✅ | ✅ | ⚠️ | ❌ |
| Bundle size | ~3.5KB | ~1.6KB | ~4.5KB | ~2KB |
| Zero deps | ✅ | ✅ | ✅ | ❌ |
| Dual API (.value + tuple) | ✅ | ❌ | ❌ | ❌ |
| Scope/ownership | ✅ | ❌ | ✅ | ✅ |
| Glitch-free | ✅ | ✅ | ✅ | ✅ |
| TypeScript-first | ✅ | ✅ | ✅ | ✅ |
| DevTools | ✅ | ❌ | ✅ | ❌ |
| Link pooling | ✅ | ❌ | ❌ | ❌ |

## API Reference

### Core Primitives

| Function | Description |
|:---|:---|
| `signal(value)` | Create a writable reactive signal |
| `signal.tuple(value)` | Create a `[getter, setter]` signal pair |
| `computed(fn, options?)` | Create a lazy, memoized derived value |
| `effect(fn)` | Create an auto-tracking side effect |
| `batch(fn)` | Batch multiple writes into one update |
| `untrack(fn)` | Read signals without tracking |
| `createScope()` | Create a disposal scope |

### Type Guards

| Function | Description |
|:---|:---|
| `isSignal(value)` | Check if a value is a Signal |
| `isComputed(value)` | Check if a value is a Computed |
| `isReactive(value)` | Check if a value is any reactive primitive |

### Utilities

| Function | Description |
|:---|:---|
| `readonly(signal)` | Create a read-only view of a signal |
| `watch(source, callback, options?)` | Watch with old/new values |
| `on(deps, callback, options?)` | Explicit dependency tracking |
| `toJSON(value)` | Unwrap reactive values to plain data |
| `memo(fn)` | Semantic alias for `computed()` |
| `derive({ key: fn })` | Create multiple computed values at once |
| `subscribe(signal, callback)` | Simple value change listener |
| `previous(signal)` | Track the previous value of a signal |
| `onCleanup(fn)` | Register effect cleanup |
| `onDispose(fn)` | Register scope cleanup |

### Rate Limiting

| Function | Description |
|:---|:---|
| `debouncedEffect(fn, delay)` | Debounced side effect |
| `debouncedSignal(value, delay)` | Signal with debounced writes |
| `throttledEffect(fn, interval)` | Throttled side effect |

### Async & Error Handling

| Function | Description |
|:---|:---|
| `resource(source, fetcher)` | Reactive async data loading |
| `fromPromise(promise)` | Convert a Promise to reactive signals |
| `catchError(fn, onError)` | Error boundary for effects |

### State Management

| Function | Description |
|:---|:---|
| `createStore({ state, getters, actions })` | Zustand/Pinia-style store |
| `createHistory(signal, options?)` | Undo/redo for any signal |
| `persistedSignal(key, value)` | localStorage-backed signal |

### DevTools

| Function | Description |
|:---|:---|
| `getSubscribers(node)` | Get nodes that depend on this source |
| `getDependencies(node)` | Get nodes this subscriber depends on |
| `getNodeInfo(node)` | Get debugging info about a node |
| `getGraphSnapshot(roots)` | Snapshot the entire reactive graph |

## License

MIT © 2026
