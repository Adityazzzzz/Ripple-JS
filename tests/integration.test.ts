import { describe, it, expect, vi } from 'vitest';
import {
  signal, computed, effect, batch, untrack,
  createScope, watch, on
} from '../src/index.js';

describe('integration', () => {
  it('should handle a reactive todo list', () => {
    const todos = signal<Array<{ text: string; done: boolean }>>([
      { text: 'Learn Ripple.js', done: false },
      { text: 'Build something', done: false },
    ]);

    const completed = computed(() => todos.value.filter(t => t.done).length);
    const remaining = computed(() => todos.value.length - completed.value);

    expect(completed.value).toBe(0);
    expect(remaining.value).toBe(2);

    // Mark first todo as done
    todos.value = todos.value.map((t, i) =>
      i === 0 ? { ...t, done: true } : t
    );

    expect(completed.value).toBe(1);
    expect(remaining.value).toBe(1);
  });

  it('should handle form state management', () => {
    const firstName = signal('');
    const lastName = signal('');
    const fullName = computed(() => `${firstName.value} ${lastName.value}`.trim());
    const isValid = computed(() => firstName.value.length > 0 && lastName.value.length > 0);

    const submissions = vi.fn();
    effect(() => {
      if (isValid.value) {
        submissions(fullName.value);
      }
    });

    batch(() => {
      firstName.value = 'John';
      lastName.value = 'Doe';
    });

    expect(fullName.value).toBe('John Doe');
    expect(isValid.value).toBe(true);
    expect(submissions).toHaveBeenCalledWith('John Doe');
  });

  it('should handle complex dependency chains', () => {
    const x = signal(1);
    const y = signal(2);
    const sum = computed(() => x.value + y.value);
    const product = computed(() => x.value * y.value);
    const result = computed(() => `Sum: ${sum.value}, Product: ${product.value}`);

    expect(result.value).toBe('Sum: 3, Product: 2');

    batch(() => {
      x.value = 3;
      y.value = 4;
    });

    expect(result.value).toBe('Sum: 7, Product: 12');
  });

  it('should handle scope-based component pattern', () => {
    const fn = vi.fn();

    function createCounter() {
      const scope = createScope();
      const count = signal(0);

      scope.run(() => {
        effect(() => fn(count.value));
      });

      return {
        increment: () => { count.value++; },
        dispose: () => scope.dispose(),
      };
    }

    const counter = createCounter();
    expect(fn).toHaveBeenCalledWith(0);

    counter.increment();
    expect(fn).toHaveBeenCalledWith(1);

    counter.dispose();
    counter.increment();
    expect(fn).toHaveBeenCalledTimes(2); // No new call after dispose
  });

  it('should handle watch + batch interaction', () => {
    const a = signal(0);
    const b = signal(0);
    const fn = vi.fn();

    watch(
      () => a.value + b.value,
      (newVal, oldVal) => fn(newVal, oldVal)
    );

    batch(() => {
      a.value = 1;
      b.value = 2;
    });

    expect(fn).toHaveBeenCalledWith(3, 0);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
