import { effect } from '../core/effect.js';
import { untrack } from '../core/untrack.js';
import type { EffectHandle } from '../core/types.js';

/**
 * Create a throttled effect that fires at most once per interval.
 * 
 * Unlike `debouncedEffect` which waits for inactivity, `throttledEffect`
 * guarantees the effect runs at most once every `interval` ms, but always
 * fires at least once for each burst of changes (trailing call).
 * 
 * Useful for scroll handlers, resize observers, or progress tracking.
 * 
 * @param fn - Effect function
 * @param interval - Minimum interval between executions in ms
 * @returns Dispose function
 * 
 * @example
 * ```ts
 * const scrollY = signal(0);
 * 
 * throttledEffect(() => {
 *   updateMinimap(scrollY.value);
 * }, 100);
 * 
 * // Even if scrollY changes 60 times/sec, updateMinimap runs at most 10 times/sec
 * ```
 */
export function throttledEffect(
  fn: () => void,
  interval: number
): EffectHandle {
  let lastRun = 0;
  let trailingTimer: ReturnType<typeof setTimeout> | null = null;
  let latestRun: (() => void) | null = null;

  return effect((onCleanup) => {
    // Read dependencies in tracked context
    const runFn = () => fn();
    
    const now = Date.now();
    const elapsed = now - lastRun;

    if (elapsed >= interval) {
      // Enough time has passed — run immediately
      lastRun = now;
      untrack(runFn);
    } else {
      // Too soon — schedule a trailing call
      latestRun = runFn;
      if (trailingTimer === null) {
        trailingTimer = setTimeout(() => {
          trailingTimer = null;
          lastRun = Date.now();
          if (latestRun) {
            untrack(latestRun);
            latestRun = null;
          }
        }, interval - elapsed);
      }
    }

    onCleanup(() => {
      if (trailingTimer !== null) {
        clearTimeout(trailingTimer);
        trailingTimer = null;
      }
    });
  });
}
