<div align="center">

# 🌊 Ripple.js

**A standalone, framework-agnostic reactive utility library.**

*One change ripples through all dependents.*

[![npm](https://img.shields.io/npm/v/ripple-reactive?color=orange)](https://www.npmjs.com/package/ripple-reactive)
[![Bundle Size](https://img.shields.io/badge/bundle-~3.5KB_gzip-brightgreen)]()
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-first-3178c6)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Tests](https://img.shields.io/badge/tests-102_passing-brightgreen)]()

</div>

---

## Why Ripple.js?

Most reactivity systems are **locked inside UI frameworks** (React, Vue, Solid). If you want signals and effects in a Node.js script, a game engine, a web worker, or a vanilla JS project — you're stuck importing a framework's internals.

**Ripple.js** is reactivity as a **utility**, not a framework byproduct. It gives you fine-grained reactive primitives that work **anywhere JavaScript runs**.

```ts
import { signal, computed, effect } from 'ripple-reactive';

const count = signal(0);
const double = computed(() => count.value * 2);

effect(() => {
  console.log(`Count: ${count.value}, Double: ${double.value}`);
});
// → "Count: 0, Double: 0"

count.value = 5;
// → "Count: 5, Double: 10"  ✨ automatic!
```

## Features

- 🎯 **Fine-grained reactivity** — signals, computed values, and effects
- 🔗 **Framework-agnostic** — works in browsers, Node.js, Deno, Bun, web workers
- 🪶 **~3.5KB** minified + gzipped — smaller than most alternatives
- ⚡ **Push-pull hybrid engine** — glitch-free, diamond-problem-safe
- 🧪 **Zero dependencies** — no bloat, no transitive surprises
- 📦 **Dual API** — `.value` property OR `[getter, setter]` tuple — your choice
- 📝 **TypeScript-first** — written in TS with full type inference
- ♻️ **Memory-safe** — scoped ownership with automatic cleanup
- 🔌 **Framework adapters** — first-class React, Vue 3, and Svelte hooks
- 🔍 **DevTools** — built-in graph inspection utilities
- 🏪 **Batteries included** — store, undo/redo, persistence, async resources, collections

## Installation

```bash
npm install ripple-reactive
```

```bash
# yarn
yarn add ripple-reactive

# pnpm
pnpm add ripple-reactive
```

## Quick Start

### Signals — Reactive State

```ts
import { signal } from 'ripple-reactive';

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
import { signal, computed } from 'ripple-reactive';

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
import { signal, effect } from 'ripple-reactive';

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
import { signal, effect, batch } from 'ripple-reactive';

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
import { signal, effect, untrack } from 'ripple-reactive';

const tracked = signal(0);
const ignored = signal(0);

effect(() => {
  console.log(
    tracked.value,                  // This IS tracked
    untrack(() => ignored.value)    // This is NOT tracked
  );
});

ignored.value = 99; // Effect does NOT re-run
tracked.value = 1;  // Effect re-runs
```

### Scopes — Lifecycle Management

```ts
import { signal, effect, createScope, onDispose } from 'ripple-reactive';

const scope = createScope();

scope.run(() => {
  const count = signal(0);
  effect(() => console.log(count.value));
  effect(() => console.log(count.value * 2));

  onDispose(() => console.log('Scope cleaned up!'));
});

scope.dispose(); // Stops ALL effects, runs cleanup
```

### Watch — Observe Changes

```ts
import { signal, watch } from 'ripple-reactive';

const temperature = signal(20);

watch(
  () => temperature.value,
  (newTemp, oldTemp) => {
    console.log(`Temperature: ${oldTemp}° → ${newTemp}°`);
  }
);

temperature.value = 25;
// → "Temperature: 20° → 25°"
```

### Store — State Management

```ts
import { createStore } from 'ripple-reactive';

const counter = createStore({
  state: { count: 0 },
  getters: {
    double: (state) => state.count.value * 2,
  },
  actions: {
    increment: (state) => state.count.value++,
    add: (state, amount: number) => state.count.value += amount,
  },
});

counter.increment();
console.log(counter.double.value); // 2
counter.$reset(); // Back to initial state
```

### History — Undo/Redo

```ts
import { signal, createHistory } from 'ripple-reactive';

const text = signal('Hello');
const history = createHistory(text, { limit: 50 });

text.value = 'Hello World';
text.value = 'Hello World!';

history.undo(); // "Hello World"
history.undo(); // "Hello"
history.redo(); // "Hello World"
```

### Persisted Signal — localStorage Sync

```ts
import { persistedSignal } from 'ripple-reactive';

const theme = persistedSignal('app-theme', 'light');
theme.value = 'dark'; // Saved to localStorage automatically
// Survives page refreshes and syncs across tabs
```

### Reactive Collections

```ts
import { reactiveMap, reactiveArray } from 'ripple-reactive';

const users = reactiveArray(['Alice', 'Bob']);
const cache = reactiveMap([['key', 'value']]);

// All mutations are reactive — effects track them automatically
users.push('Charlie');
cache.set('newKey', 'newValue');
```

## Framework Adapters

### React

```bash
npm install ripple-reactive react
```

```tsx
import { signal } from 'ripple-reactive';
import { useSignalValue, useSignal, useSignalEffect } from 'ripple-reactive/react';

const globalCount = signal(0);

function Counter() {
  const count = useSignalValue(globalCount); // re-renders on change
  return <button onClick={() => globalCount.value++}>{count}</button>;
}
```

### Vue 3

```bash
npm install ripple-reactive vue
```

```ts
import { signal } from 'ripple-reactive';
import { toVueRef } from 'ripple-reactive/vue';

const count = signal(0);
const countRef = toVueRef(count); // Use with v-model, template, etc.
```

### Svelte

```bash
npm install ripple-reactive svelte
```

```svelte
<script>
import { signal } from 'ripple-reactive';
import { toStore } from 'ripple-reactive/svelte';

const count = signal(0);
const count$ = toStore(count); // Use with $count$ syntax
</script>

<button on:click={() => count.value++}>{$count$}</button>
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
- **Link pooling** for reduced GC pressure (~60% less allocations)
- **Automatic stale dependency pruning** on re-evaluation

## Performance

Ripple.js wins **3 out of 6** benchmark categories against `@preact/signals-core` and `@vue/reactivity`:

| Benchmark | Winner |
|:---|:---|
| Signal Read + Write (1M ops) | 🏆 **Ripple.js** |
| Computed Evaluation (500K ops) | 🏆 **Ripple.js** |
| Batch Write (10×100K signals) | 🏆 **Ripple.js** (2.5× faster) |
| Signal Creation (100K) | Preact Signals |
| Effect Fan-out (100×50K) | Preact Signals |
| Diamond Dependencies (200K) | Preact Signals |

Run benchmarks yourself: `npm run bench`

## DevTools

```ts
import { signal, computed, effect } from 'ripple-reactive';
import { getSubscribers, getDependencies, getNodeInfo } from 'ripple-reactive';

const count = signal(0);
const double = computed(() => count.value * 2);
effect(() => console.log(double.value));

getSubscribers(count);  // [ComputedNode]
getDependencies(double); // [SignalNode]
getNodeInfo(count);     // { state, version, subscriberCount, ... }
```

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
| `onCleanup(fn)` | Register effect cleanup |
| `onDispose(fn)` | Register scope cleanup |
| `effectScope(fn)` | Convenience scope wrapper |

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
| `watch(source, cb, options?)` | Watch with old/new values |
| `on(deps, cb, options?)` | Explicit dependency tracking |
| `toJSON(value)` | Unwrap reactive values to plain data |
| `memo(fn)` | Alias for `computed()` |
| `derive({ key: fn })` | Create multiple computed values at once |
| `subscribe(signal, cb)` | Simple value change listener |
| `previous(signal)` | Track the previous value of a signal |

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

### Collections

| Function | Description |
|:---|:---|
| `reactiveMap(initial?)` | Reactive `Map` wrapper |
| `reactiveArray(initial?)` | Reactive `Array` wrapper |

### DevTools

| Function | Description |
|:---|:---|
| `getSubscribers(node)` | Get downstream dependencies |
| `getDependencies(node)` | Get upstream dependencies |
| `getNodeInfo(node)` | Debug info about a reactive node |
| `getGraphSnapshot(roots)` | Snapshot the entire reactive graph |

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
| Framework adapters | ✅ | ✅ | ❌ | ❌ |
| Store / State mgmt | ✅ | ❌ | ❌ | ❌ |
| Undo/Redo | ✅ | ❌ | ❌ | ❌ |
| Persistence | ✅ | ❌ | ❌ | ❌ |
| Reactive collections | ✅ | ❌ | ✅ | ❌ |
| DevTools | ✅ | ❌ | ✅ | ❌ |
| Link pooling | ✅ | ❌ | ❌ | ❌ |

## License

MIT © 2026
