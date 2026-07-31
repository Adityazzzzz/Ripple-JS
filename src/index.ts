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
// export { effect } from './core/effect.js';
// export { batch } from './core/batch.js';
// export { untrack } from './core/untrack.js';
// export { createScope } from './core/scope.js';
