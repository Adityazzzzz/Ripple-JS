import { describe, it, expect } from 'vitest';
import { signal } from '../src/index.js';

describe('signal', () => {
  it('should create a signal with initial value', () => {
    const s = signal(0);
    expect(s.value).toBe(0);
  });

  it('should update value on write', () => {
    const s = signal('hello');
    s.value = 'world';
    expect(s.value).toBe('world');
  });

  it('should return current value via peek() without tracking', () => {
    const s = signal(42);
    expect(s.peek()).toBe(42);
    s.value = 100;
    expect(s.peek()).toBe(100);
  });

  it('should not trigger update when set to same value (Object.is)', () => {
    const s = signal(NaN);
    s.value = NaN; // NaN === NaN via Object.is
    expect(s.value).toBeNaN();
  });

  it('should distinguish 0 and -0', () => {
    const s = signal(0);
    s.value = -0;
    expect(Object.is(s.value, -0)).toBe(true);
  });

  it('should handle null and undefined', () => {
    const s = signal<string | null>(null);
    expect(s.value).toBeNull();
    s.value = 'test';
    expect(s.value).toBe('test');
  });

  it('should handle object values', () => {
    const obj = { a: 1, b: 2 };
    const s = signal(obj);
    expect(s.value).toBe(obj);
    
    const newObj = { a: 3 };
    s.value = newObj;
    expect(s.value).toBe(newObj);
  });
});

describe('signal.tuple', () => {
  it('should create a getter/setter pair', () => {
    const [count, setCount] = signal.tuple(0);
    expect(count()).toBe(0);
    setCount(5);
    expect(count()).toBe(5);
  });

  it('should support updater function', () => {
    const [count, setCount] = signal.tuple(10);
    setCount(prev => prev + 5);
    expect(count()).toBe(15);
  });

  it('should support multiple updates', () => {
    const [val, setVal] = signal.tuple(0);
    setVal(1);
    setVal(2);
    setVal(3);
    expect(val()).toBe(3);
  });
});
