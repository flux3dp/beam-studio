import React from 'react';
import { render } from '@testing-library/react';

import touchEvents from './touchEvents';

const Workarea = () => (
  <div id="workarea" style={{ height: 100, width: 100 }}>
    <div id="svgcanvas" style={{ height: 300, width: 300 }}>
      <svg viewBox="0 0 100 100" />
    </div>
  </div>
);

const mouseDown = jest.fn();
const mouseMove = jest.fn();
const mouseUp = jest.fn();
const doubleClick = jest.fn();
const setZoom = jest.fn();

const mockGetWidth = jest.fn();
const mockGetHeight = jest.fn();
const mockGetZoomRatio = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  get height() {
    return mockGetHeight();
  },
  get width() {
    return mockGetWidth();
  },
  get zoomRatio() {
    return mockGetZoomRatio();
  },
}));

let container;
let canvas;

describe('test touchEvents', () => {
  beforeAll(() => {
    const { baseElement } = render(
      <div id="main">
        <Workarea />
      </div>,
    );

    container = baseElement.querySelector('#main>div');
    canvas = document.getElementById('svgcanvas');

    const workarea = document.getElementById('workarea')!;

    touchEvents.setupCanvasTouchEvents(canvas, workarea, mouseDown, mouseMove, mouseUp, doubleClick, setZoom);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('test one finger touchEvents', () => {
    jest.useFakeTimers();

    const onePointTouchStart = new TouchEvent('touchstart', {
      touches: [
        {
          clientX: 10,
          clientY: 10,
          identifier: 0,
        } as Touch,
      ],
    });

    canvas.dispatchEvent(onePointTouchStart);
    expect(mouseDown).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(mouseDown).toHaveBeenNthCalledWith(1, onePointTouchStart);
    jest.advanceTimersByTime(1);

    const onePointTouchMove = new TouchEvent('touchmove', {
      touches: [
        {
          clientX: 20,
          clientY: 20,
          identifier: 0,
        } as Touch,
      ],
    });

    canvas.dispatchEvent(onePointTouchMove);
    expect(mouseMove).toHaveBeenNthCalledWith(1, onePointTouchMove);

    const onePointTouchEnd = new TouchEvent('touchend', {
      changedTouches: [
        {
          clientX: 20,
          clientY: 20,
          identifier: 0,
        } as Touch,
      ],
    });

    canvas.dispatchEvent(onePointTouchEnd);
    expect(mouseUp).toHaveBeenNthCalledWith(1, onePointTouchEnd, false);

    expect(container).toMatchSnapshot();
  });

  test('test two finger touch', () => {
    const firstPointTouchStart = new TouchEvent('touchstart', {
      // @ts-expect-error scale is defined in chrome & safari
      scale: 1,
      touches: [
        {
          clientX: 10,
          clientY: 10,
          identifier: 0,
        } as Touch,
      ],
    });

    canvas.dispatchEvent(firstPointTouchStart);
    expect(mouseDown).not.toHaveBeenCalled();

    const twoPointTouchStart = new TouchEvent('touchstart', {
      // @ts-expect-error scale is defined in chrome & safari
      scale: 1,
      touches: [
        {
          clientX: 10,
          clientY: 10,
          identifier: 0,
        } as Touch,
        {
          clientX: 20,
          clientY: 20,
          identifier: 1,
        } as Touch,
      ],
    });

    canvas.dispatchEvent(twoPointTouchStart);

    const twoPointTouchMovePan = new TouchEvent('touchmove', {
      touches: [
        {
          clientX: 20,
          clientY: 20,
          identifier: 0,
        } as Touch,
        {
          clientX: 30,
          clientY: 30,
          identifier: 1,
        } as Touch,
      ],
    });

    canvas.dispatchEvent(twoPointTouchMovePan);
    expect(mouseMove).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();

    const twoPointTouchEnd = new TouchEvent('touchend', {
      touches: [
        {
          clientX: 20,
          clientY: 20,
          identifier: 0,
        } as Touch,
        {
          clientX: 30,
          clientY: 30,
          identifier: 1,
        } as Touch,
      ],
    });

    canvas.dispatchEvent(twoPointTouchEnd);
    expect(mouseUp).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  test('uses the latest workarea-relative touch center once per animation frame', () => {
    const animationFrames: Array<(timestamp: number) => void> = [];
    const requestAnimationFrameSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: (timestamp: number) => void) => {
        animationFrames.push(callback);

        return animationFrames.length;
      });
    const testWorkarea = document.createElement('div');
    const testCanvas = document.createElement('div');
    const scrollAtZoom: Array<{ left: number; top: number }> = [];
    const testSetZoom = jest.fn(() => {
      scrollAtZoom.push({ left: testWorkarea.scrollLeft, top: testWorkarea.scrollTop });
    });

    testWorkarea.appendChild(testCanvas);
    document.body.appendChild(testWorkarea);
    testWorkarea.scrollLeft = 300;
    testWorkarea.scrollTop = 200;

    const getBoundingClientRect = jest
      .spyOn(testWorkarea, 'getBoundingClientRect')
      .mockReturnValue({ left: 100, top: 40 } as DOMRect);

    mockGetHeight.mockReturnValue(1000);
    mockGetWidth.mockReturnValue(1000);
    mockGetZoomRatio.mockReturnValue(1);
    touchEvents.setupCanvasTouchEvents(
      testCanvas,
      testWorkarea,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      testSetZoom,
    );

    testCanvas.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ clientX: 120, clientY: 80 } as Touch, { clientX: 220, clientY: 80 } as Touch],
      }),
    );
    testCanvas.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ clientX: 120, clientY: 90 } as Touch, { clientX: 241, clientY: 90 } as Touch],
      }),
    );
    testCanvas.dispatchEvent(
      new TouchEvent('touchmove', {
        touches: [{ clientX: 130, clientY: 90 } as Touch, { clientX: 274, clientY: 90 } as Touch],
      }),
    );

    expect(animationFrames).toHaveLength(1);
    expect(getBoundingClientRect).toHaveBeenCalledTimes(1);
    animationFrames[0](0);
    expect(testSetZoom).toHaveBeenCalledTimes(1);
    // pinchScale = last distance / start distance = (274 - 130) / (220 - 120) = 1.44
    // newZoom = startZoom * sqrt(pinchScale) = 1 * sqrt(1.44) = 1.2
    // center = latest midpoint - workarea offset = {
    //   x: (130 + 274) / 2 - 100 = 102,
    //   y: (90 + 90) / 2 - 40 = 50,
    // }
    expect(testSetZoom).toHaveBeenCalledWith(1.2, { x: 102, y: 50 });
    // scroll before zoom = initial scroll + start center - latest center = {
    //   left: 300 + 170 - 202 = 268,
    //   top: 200 + 80 - 90 = 190,
    // }
    expect(scrollAtZoom).toEqual([{ left: 268, top: 190 }]);

    requestAnimationFrameSpy.mockRestore();
    testWorkarea.remove();
  });
});
