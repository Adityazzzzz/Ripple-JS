import { describe, it, expect } from 'vitest';
import { signal } from '../src/index.js';
import { createHistory } from '../src/utils/history.js';

describe('createHistory', () => {
  it('should track changes and support undo', () => {
    const text = signal('a');
    const h = createHistory(text);

    text.value = 'b';
    text.value = 'c';

    expect(text.value).toBe('c');

    h.undo();
    expect(text.value).toBe('b');

    h.undo();
    expect(text.value).toBe('a');
  });

  it('should support redo', () => {
    const text = signal('a');
    const h = createHistory(text);

    text.value = 'b';
    text.value = 'c';

    h.undo();
    h.undo();
    expect(text.value).toBe('a');

    h.redo();
    expect(text.value).toBe('b');

    h.redo();
    expect(text.value).toBe('c');
  });

  it('should report canUndo/canRedo', () => {
    const s = signal(0);
    const h = createHistory(s);

    expect(h.canUndo.value).toBe(false);
    expect(h.canRedo.value).toBe(false);

    s.value = 1;
    expect(h.canUndo.value).toBe(true);
    expect(h.canRedo.value).toBe(false);

    h.undo();
    expect(h.canUndo.value).toBe(false);
    expect(h.canRedo.value).toBe(true);
  });

  it('should clear redo history on new change after undo', () => {
    const s = signal(0);
    const h = createHistory(s);

    s.value = 1;
    s.value = 2;

    h.undo(); // back to 1
    s.value = 3; // branch — redo history cleared

    expect(h.canRedo.value).toBe(false);
    h.undo();
    expect(s.value).toBe(1);
  });

  it('should respect limit option', () => {
    const s = signal(0);
    const h = createHistory(s, { limit: 3 });

    s.value = 1;
    s.value = 2;
    s.value = 3;
    s.value = 4;

    expect(h.count.value).toBeLessThanOrEqual(3);
  });

  it('should support clear()', () => {
    const s = signal(0);
    const h = createHistory(s);

    s.value = 1;
    s.value = 2;

    h.clear();
    expect(h.canUndo.value).toBe(false);
    expect(h.count.value).toBe(1);
  });
});
