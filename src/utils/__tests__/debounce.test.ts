import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../debounce';

describe('debounce utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delays execution by the specified delay (e.g. 500ms)', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('Dune');
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Dune');
  });

  it('coalesces rapid keystrokes into a single invocation with the latest argument', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('D');
    vi.advanceTimersByTime(100);
    debounced('Du');
    vi.advanceTimersByTime(150);
    debounced('Dun');
    vi.advanceTimersByTime(200);
    debounced('Dune');

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('Dune');
  });

  it('cancels pending invocation when cancel is called', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('Interstellar');
    vi.advanceTimersByTime(300);
    debounced.cancel();

    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });
});
