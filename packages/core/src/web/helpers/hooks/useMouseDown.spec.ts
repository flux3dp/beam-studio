import { renderHook } from '@testing-library/react';

import { useMouseDown } from './useMouseDown';

describe('test useMouseDown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when predicate return true', () => {
    const predicate = jest.fn().mockReturnValue(true);
    const mouseDown = jest.fn();
    const mouseUp = jest.fn();
    const addEventListener = jest.spyOn(document, 'addEventListener');
    const removeEventListener = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useMouseDown({ mouseDown, mouseUp, predicate }));

    expect(addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledTimes(0);

    const mouseDownEvent = new MouseEvent('mousedown');

    document.dispatchEvent(mouseDownEvent);
    expect(mouseDown).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenLastCalledWith(mouseDownEvent);

    const mouseUpEvent = new MouseEvent('mouseup');

    document.dispatchEvent(mouseUpEvent);
    expect(mouseUp).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenCalledTimes(2);
    expect(predicate).toHaveBeenLastCalledWith(mouseUpEvent);
    unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(2);
    document.dispatchEvent(mouseDownEvent);
    expect(mouseDown).toHaveBeenCalledTimes(1);
    document.dispatchEvent(mouseUpEvent);
    expect(mouseUp).toHaveBeenCalledTimes(1);
  });

  test('when predicate return false', () => {
    const predicate = jest.fn().mockReturnValue(false);
    const mouseDown = jest.fn();
    const mouseUp = jest.fn();
    const { unmount } = renderHook(() => useMouseDown({ mouseDown, mouseUp, predicate }));
    const mouseDownEvent = new MouseEvent('mousedown');

    document.dispatchEvent(mouseDownEvent);
    expect(mouseDown).toHaveBeenCalledTimes(0);
    expect(predicate).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenLastCalledWith(mouseDownEvent);

    const mouseUpEvent = new MouseEvent('mouseup');

    document.dispatchEvent(mouseUpEvent);
    expect(mouseUp).toHaveBeenCalledTimes(0);
    expect(predicate).toHaveBeenCalledTimes(2);
    expect(predicate).toHaveBeenLastCalledWith(mouseUpEvent);
    unmount();
  });
});
