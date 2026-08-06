import { signal } from '../core/signal.js';
import { computed } from '../core/computed.js';
import { effect } from '../core/effect.js';
import type { Signal, ReadonlySignal } from '../core/types.js';

/**
 * A reactive history tracker for undo/redo functionality.
 * 
 * Tracks changes to a signal and provides undo/redo capabilities.
 * 
 * @example
 * ```ts
 * const text = signal('hello');
 * const h = createHistory(text, { limit: 50 });
 * 
 * text.value = 'hello world';
 * text.value = 'hello world!';
 * 
 * h.undo(); // text.value === 'hello world'
 * h.undo(); // text.value === 'hello'
 * h.redo(); // text.value === 'hello world'
 * 
 * console.log(h.canUndo.value); // true
 * console.log(h.canRedo.value); // true
 * ```
 */
export interface History<T> {
  /** Whether undo is available */
  readonly canUndo: ReadonlySignal<boolean>;
  /** Whether redo is available */
  readonly canRedo: ReadonlySignal<boolean>;
  /** Number of entries in history */
  readonly count: ReadonlySignal<number>;
  /** Undo the last change */
  undo(): void;
  /** Redo the last undone change */
  redo(): void;
  /** Clear all history */
  clear(): void;
  /** Dispose the history tracker */
  dispose(): void;
}

export interface HistoryOptions {
  /** Maximum number of history entries. Defaults to 100. */
  limit?: number;
}

export function createHistory<T>(
  source: Signal<T>,
  options?: HistoryOptions
): History<T> {
  const limit = options?.limit ?? 100;

  const _entries = signal<T[]>([source.peek()]);
  const _index = signal(0);
  let _ignoreNext = false;

  // Track changes
  const stopEffect = effect(() => {
    const value = source.value;

    if (_ignoreNext) {
      _ignoreNext = false;
      return;
    }

    const entries = [..._entries.peek()];
    const idx = _index.peek();

    // Discard any redo history
    entries.length = idx + 1;

    // Add new entry
    entries.push(value);

    // Enforce limit
    if (entries.length > limit) {
      entries.shift();
    }

    _entries.value = entries;
    _index.value = entries.length - 1;
  });

  const canUndo = computed(() => _index.value > 0);
  const canRedo = computed(() => _index.value < _entries.value.length - 1);
  const count = computed(() => _entries.value.length);

  return {
    canUndo,
    canRedo,
    count,
    undo() {
      if (_index.peek() > 0) {
        _ignoreNext = true;
        _index.value = _index.peek() - 1;
        source.value = _entries.peek()[_index.peek()];
      }
    },
    redo() {
      const entries = _entries.peek();
      if (_index.peek() < entries.length - 1) {
        _ignoreNext = true;
        _index.value = _index.peek() + 1;
        source.value = entries[_index.peek()];
      }
    },
    clear() {
      _entries.value = [source.peek()];
      _index.value = 0;
    },
    dispose() {
      stopEffect();
    },
  };
}
