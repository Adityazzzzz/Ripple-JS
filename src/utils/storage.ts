import { signal } from '../core/signal.js';
import { effect } from '../core/effect.js';
import type { Signal } from '../core/types.js';

/**
 * Create a signal that persists its value to localStorage.
 * 
 * The signal is initialized from localStorage if a stored value exists,
 * otherwise uses the provided default. Changes are automatically
 * synced back to localStorage.
 * 
 * Also handles cross-tab synchronization via the `storage` event.
 * 
 * @param key - localStorage key
 * @param defaultValue - Default value if no stored value exists
 * @param options - Optional serialization config
 * @returns A Signal that persists to localStorage
 * 
 * @example
 * ```ts
 * const theme = persistedSignal('app-theme', 'light');
 * 
 * console.log(theme.value); // 'light' (or stored value)
 * theme.value = 'dark';     // Saves to localStorage
 * 
 * // On page reload, theme.value will be 'dark'
 * ```
 * 
 * @example
 * ```ts
 * // Custom serialization
 * const settings = persistedSignal('settings', { volume: 80 }, {
 *   serialize: JSON.stringify,
 *   deserialize: JSON.parse,
 * });
 * ```
 */
export interface PersistedSignalOptions<T> {
  /** Custom serialization function. Defaults to JSON.stringify */
  serialize?: (value: T) => string;
  /** Custom deserialization function. Defaults to JSON.parse */
  deserialize?: (value: string) => T;
}

export function persistedSignal<T>(
  key: string,
  defaultValue: T,
  options?: PersistedSignalOptions<T>
): Signal<T> {
  const serialize = options?.serialize ?? JSON.stringify;
  const deserialize = options?.deserialize ?? JSON.parse;

  // Try to load from localStorage
  let initialValue = defaultValue;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        initialValue = deserialize(stored);
      }
    }
  } catch {
    // localStorage unavailable or corrupted data — use default
  }

  const s = signal<T>(initialValue);

  // Sync changes to localStorage
  effect(() => {
    const value = s.value;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, serialize(value));
      }
    } catch {
      // localStorage full or unavailable
    }
  });

  // Cross-tab sync via storage event
  if (typeof window !== 'undefined') {
    const handler = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          s.value = deserialize(event.newValue);
        } catch {
          // Invalid data
        }
      }
    };
    window.addEventListener('storage', handler);
  }

  return s;
}
