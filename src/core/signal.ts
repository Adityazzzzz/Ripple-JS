import { CLEAN, DIRTY } from './constants.js';
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

/**
 * Create a new reactive signal with an initial value.
 * 
 * @param initialValue - The initial value of the signal
 * @returns A Signal object with .value getter/setter and .peek()
 * 
 * @example
 * ```ts
 * const count = signal(0);
 * console.log(count.value); // 0
 * count.value = 5;
 * console.log(count.value); // 5
 * ```
 */
export function signal<T>(initialValue: T): SignalType<T> {
  return new SignalNode(initialValue) as unknown as SignalType<T>;
}

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
 * ```ts
 * const [count, setCount] = signal.tuple(0);
 * console.log(count());       // 0
 * setCount(5);                // direct set
 * setCount(prev => prev + 1); // updater function
 * ```
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
