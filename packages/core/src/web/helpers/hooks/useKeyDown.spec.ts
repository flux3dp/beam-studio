import { renderHook } from '@testing-library/react';

import { useKeyDown } from './useKeyDown';

describe('test useKeyDown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when predicate return true', () => {
    const predicate = jest.fn().mockReturnValue(true);
    const keyDown = jest.fn();
    const keyUp = jest.fn();
    const addEventListener = jest.spyOn(document, 'addEventListener');
    const removeEventListener = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyDown({ keyDown, keyUp, predicate }));

    expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledTimes(0);

    const keyDownEvent = new KeyboardEvent('keydown');

    document.dispatchEvent(keyDownEvent);
    expect(keyDown).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenLastCalledWith(keyDownEvent);

    const keyUpEvent = new KeyboardEvent('keyup');

    document.dispatchEvent(keyUpEvent);
    expect(keyUp).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenCalledTimes(2);
    expect(predicate).toHaveBeenLastCalledWith(keyUpEvent);
    unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(2);
    document.dispatchEvent(keyDownEvent);
    expect(keyDown).toHaveBeenCalledTimes(1);
    document.dispatchEvent(keyUpEvent);
    expect(keyUp).toHaveBeenCalledTimes(1);
  });

  test('when predicate return false', () => {
    const predicate = jest.fn().mockReturnValue(false);
    const keyDown = jest.fn();
    const keyUp = jest.fn();
    const { unmount } = renderHook(() => useKeyDown({ keyDown, keyUp, predicate }));
    const keyDownEvent = new KeyboardEvent('keydown');

    document.dispatchEvent(keyDownEvent);
    expect(keyDown).toHaveBeenCalledTimes(0);
    expect(predicate).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenLastCalledWith(keyDownEvent);

    const keyUpEvent = new KeyboardEvent('keyup');

    document.dispatchEvent(keyUpEvent);
    expect(keyUp).toHaveBeenCalledTimes(0);
    expect(predicate).toHaveBeenCalledTimes(2);
    expect(predicate).toHaveBeenLastCalledWith(keyUpEvent);
    unmount();
  });
});
