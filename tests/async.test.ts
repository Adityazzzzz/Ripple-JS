import { describe, it, expect, vi } from 'vitest';
import { signal, effect, catchError, fromPromise } from '../src/index.js';

describe('catchError', () => {
  it('should catch errors thrown in effects', () => {
    const count = signal(0);
    const errorFn = vi.fn();

    catchError(
      () => {
        if (count.value > 0) {
          throw new Error('boom');
        }
      },
      errorFn
    );

    expect(errorFn).not.toHaveBeenCalled();

    count.value = 1;
    expect(errorFn).toHaveBeenCalledTimes(1);
    expect(errorFn).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should return a dispose function', () => {
    const count = signal(0);
    const errorFn = vi.fn();

    const stop = catchError(
      () => { count.value; },
      errorFn
    );

    stop();
    count.value = 1;
    // Should not throw or call error handler after disposed
  });
});

describe('fromPromise', () => {
  it('should start in loading state', () => {
    const p = fromPromise(new Promise(() => {})); // never resolves
    expect(p.loading.value).toBe(true);
    expect(p.data.value).toBeUndefined();
    expect(p.error.value).toBeUndefined();
  });

  it('should resolve to data', async () => {
    const p = fromPromise(Promise.resolve(42));
    
    // Wait for microtask
    await new Promise(r => setTimeout(r, 10));
    
    expect(p.loading.value).toBe(false);
    expect(p.data.value).toBe(42);
    expect(p.error.value).toBeUndefined();
  });

  it('should capture rejection as error', async () => {
    const p = fromPromise(Promise.reject(new Error('fail')));
    
    await new Promise(r => setTimeout(r, 10));
    
    expect(p.loading.value).toBe(false);
    expect(p.data.value).toBeUndefined();
    expect(p.error.value).toBeInstanceOf(Error);
    expect(p.error.value?.message).toBe('fail');
  });

  it('should convert non-Error rejections to Error', async () => {
    const p = fromPromise(Promise.reject('string error'));
    
    await new Promise(r => setTimeout(r, 10));
    
    expect(p.error.value).toBeInstanceOf(Error);
    expect(p.error.value?.message).toBe('string error');
  });
});
