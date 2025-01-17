import React from 'react';
import { render } from '@testing-library/react';

import touchEvents from './touchEvents';

const Workarea = () => (
  <div id="workarea" style={{ width: 100, height: 100 }}>
    <div id="svgcanvas" style={{ width: 300, height: 300 }}>
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
jest.mock('app/svgedit/workarea', () => ({
  get width() {
    return mockGetWidth();
  },
  get height() {
    return mockGetHeight();
  },
  get zoomRatio() {
    return mockGetZoomRatio();
  },
}))


let container;
let canvas;

describe('test touchEvents', () => {
  beforeAll(() => {
    const { baseElement } = render(
      <div id="main">
        <Workarea />
      </div>
    );
    container = baseElement.querySelector('#main>div');
    canvas = document.getElementById('svgcanvas');
    const workarea = document.getElementById('workarea');
    touchEvents.setupCanvasTouchEvents(
      canvas,
      workarea,
      mouseDown,
      mouseMove,
      mouseUp,
      doubleClick,
      setZoom
    );
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
          identifier: 0,
          pageX: 10,
          pageY: 10,
        } as Touch,
      ],
    });
    canvas.dispatchEvent(onePointTouchStart);
    expect(mouseDown).not.toBeCalled();
    jest.runOnlyPendingTimers();
    expect(mouseDown).toHaveBeenNthCalledWith(1, onePointTouchStart);

    const onePointTouchMove = new TouchEvent('touchmove', {
      touches: [
        {
          identifier: 0,
          pageX: 20,
          pageY: 20,
        } as Touch,
      ],
    });
    canvas.dispatchEvent(onePointTouchMove);
    expect(mouseDown).toHaveBeenNthCalledWith(1, onePointTouchMove);

    const onePointTouchEnd = new TouchEvent('touchend', {
      changedTouches: [
        {
          identifier: 0,
          pageX: 20,
          pageY: 20,
        } as Touch,
      ],
    });
    canvas.dispatchEvent(onePointTouchEnd);
    expect(mouseUp).toHaveBeenNthCalledWith(1, onePointTouchEnd, false);

    expect(container).toMatchSnapshot();
  });

  test('test two finger touch', () => {
    const firstPointTouchStart = new TouchEvent('touchstart', {
      touches: [
        {
          identifier: 0,
          pageX: 10,
          pageY: 10,
        } as Touch,
      ],
      // @ts-expect-error scale is defined in chrome & safari
      scale: 1,
    });
    canvas.dispatchEvent(firstPointTouchStart);
    expect(mouseDown).not.toBeCalled();

    const twoPointTouchStart = new TouchEvent('touchstart', {
      touches: [
        {
          identifier: 0,
          pageX: 10,
          pageY: 10,
        } as Touch,
        {
          identifier: 1,
          pageX: 20,
          pageY: 20,
        } as Touch,
      ],
      // @ts-expect-error scale is defined in chrome & safari
      scale: 1,
    });
    canvas.dispatchEvent(twoPointTouchStart);

    const twoPointTouchMovePan = new TouchEvent('touchmove', {
      touches: [
        {
          identifier: 0,
          pageX: 20,
          pageY: 20,
        } as Touch,
        {
          identifier: 1,
          pageX: 30,
          pageY: 30,
        } as Touch,
      ],
    });
    canvas.dispatchEvent(twoPointTouchMovePan);
    expect(mouseMove).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();

    const twoPointTouchEnd = new TouchEvent('touchend', {
      touches: [
        {
          identifier: 0,
          pageX: 20,
          pageY: 20,
        } as Touch,
        {
          identifier: 1,
          pageX: 30,
          pageY: 30,
        } as Touch,
      ],
    });
    canvas.dispatchEvent(twoPointTouchEnd);
    expect(mouseUp).toHaveBeenCalledTimes(0);
    expect(container).toMatchSnapshot();
  });
});
