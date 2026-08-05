import { describe, it, expect, vi } from 'vitest';
import { signal, effect, createScope, onDispose } from '../src/index.js';

describe('createScope', () => {
  it('should create a scope and run functions within it', () => {
    const scope = createScope();
    const result = scope.run(() => 42);
    expect(result).toBe(42);
  });

  it('should dispose all effects when scope is disposed', () => {
    const count = signal(0);
    const fn = vi.fn();
    const scope = createScope();

    scope.run(() => {
      effect(() => fn(count.value));
    });
    expect(fn).toHaveBeenCalledTimes(1);

    scope.dispose();
    count.value = 1;
    expect(fn).toHaveBeenCalledTimes(1); // Effect no longer active
  });

  it('should support nested scopes with cascading disposal', () => {
    const count = signal(0);
    const outerFn = vi.fn();
    const innerFn = vi.fn();

    const parent = createScope();
    parent.run(() => {
      effect(() => outerFn(count.value));

      const child = createScope();
      child.run(() => {
        effect(() => innerFn(count.value));
      });
    });

    expect(outerFn).toHaveBeenCalledTimes(1);
    expect(innerFn).toHaveBeenCalledTimes(1);

    parent.dispose(); // Should dispose both parent and child effects
    count.value = 1;
    expect(outerFn).toHaveBeenCalledTimes(1);
    expect(innerFn).toHaveBeenCalledTimes(1);
  });

  it('should report disposed state', () => {
    const scope = createScope();
    expect(scope.disposed).toBe(false);
    scope.dispose();
    expect(scope.disposed).toBe(true);
  });

  it('should support onDispose callback', () => {
    const fn = vi.fn();
    const scope = createScope();
    scope.run(() => {
      onDispose(fn);
    });

    expect(fn).not.toHaveBeenCalled();
    scope.dispose();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
