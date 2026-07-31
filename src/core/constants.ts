/**
 * Reactive node state flags for the push-pull dirty tracking algorithm.
 * 
 * These flags drive the core reactivity engine:
 * - CLEAN: Node value is current and up-to-date
 * - CHECK_DIRTY: An indirect dependency may have changed; verify upstream before re-evaluating
 * - DIRTY: A direct dependency changed; node must be re-evaluated
 */

/** Node value is current — no re-evaluation needed */
export const CLEAN = 0 as const;

/** Indirect dependency may have changed — check upstream first */
export const CHECK_DIRTY = 1 as const;

/** Direct dependency changed — must re-evaluate */
export const DIRTY = 2 as const;

export type NodeState = typeof CLEAN | typeof CHECK_DIRTY | typeof DIRTY;
