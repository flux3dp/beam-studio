import Hammer from 'hammerjs';

import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import workareaManager from '@core/app/svgedit/workarea';

const calculateTouchCenter = (touches: TouchList) => {
  const center = { x: 0, y: 0 };

  if (touches.length > 0) {
    for (let i = 0; i < touches.length; i += 1) {
      center.x += touches[i].pageX;
      center.y += touches[i].pageY;
    }
    center.x /= touches.length;
    center.y /= touches.length;
  }

  return center;
};

const TOUCH_START_DELAY = 100; // ms
const multi = 3;

const setupCanvasTouchEvents = (
  container: Element,
  workarea: Element,
  onMouseDown: (e: Event) => void,
  onMouseMove: (e: Event) => void,
  onMouseUp: (e: Event, blocked?: boolean) => void,
  onDoubleClick: (e: Event) => void,
  setZoom: (zoom: number, staticPoint: { x: number; y: number }) => void,
): void => {
  let touchStartTimeout: NodeJS.Timeout;
  let touchStartTimestamp: number;
  let firstTouchID = null;
  let panStartPosition = null;
  let panStartScroll = { left: 0, top: 0 };
  let startZoom = null;
  let currentScale = 1;
  let startDist = 0;
  let lastMoveEventTimestamp = 0;
  let isDoubleTap = false;
  const mc = new Hammer.Manager(container as HTMLElement);

  container.addEventListener('touchstart', (e: TouchEvent) => {
    clearTimeout(touchStartTimeout);

    if (e.touches.length === 1) {
      firstTouchID = e.touches[0].identifier;
      touchStartTimestamp = Date.now();
      touchStartTimeout = setTimeout(() => onMouseDown(e), TOUCH_START_DELAY);
    } else if (e.touches.length >= 2) {
      panStartPosition = calculateTouchCenter(e.touches);
      panStartScroll = {
        left: workarea.scrollLeft,
        top: workarea.scrollTop,
      };

      // @ts-expect-error scale is defined in chrome & safari
      if (e.scale === undefined) {
        startZoom = workareaManager.zoomRatio;
        startDist = Math.hypot(
          e.touches[0].screenX - e.touches[1].screenX,
          e.touches[0].screenY - e.touches[1].screenY,
        );
        currentScale = 1;
        // @ts-expect-error scale is defined in chrome & safari
      } else if (e.scale === 1) {
        startZoom = workareaManager.zoomRatio;
        currentScale = 1;
      }
    }
  });

  container.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1) {
      if (e.touches[0].identifier === firstTouchID && Date.now() > touchStartTimestamp + TOUCH_START_DELAY) {
        onMouseMove(e);
      }
    } else if (e.touches.length >= 2) {
      const center = calculateTouchCenter(e.touches);

      requestAnimationFrame(() => {
        const { timeStamp } = e;

        if (timeStamp < lastMoveEventTimestamp) return;

        const scale =
          // @ts-expect-error scale is defined in chrome & safari
          e.scale ??
          Math.hypot(e.touches[0].screenX - e.touches[1].screenX, e.touches[0].screenY - e.touches[1].screenY) /
            startDist;
        let newZoom = workareaManager.zoomRatio;

        if (startZoom && Math.abs(Math.log(currentScale / scale)) >= Math.log(1.05)) {
          newZoom = startZoom * scale ** 0.5;
          setZoom(newZoom, center);
          panStartPosition = center;
          panStartScroll = {
            left: workarea.scrollLeft,
            top: workarea.scrollTop,
          };
          currentScale = scale;
        }

        const wOrig = workarea.clientWidth;
        const hOrig = workarea.clientHeight;

        if (wOrig >= workareaManager.width * newZoom * multi || hOrig >= workareaManager.height * newZoom * multi) {
          lastMoveEventTimestamp = timeStamp;

          return;
        }

        workarea.scrollLeft = panStartScroll.left + panStartPosition.x - center.x;

        workarea.scrollTop = panStartScroll.top + panStartPosition.y - center.y;
        lastMoveEventTimestamp = timeStamp;
      });
    }
  });

  container.addEventListener('touchend', (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i += 1) {
      if (e.changedTouches[i].identifier === firstTouchID) {
        firstTouchID = null;

        if (Date.now() > touchStartTimestamp + TOUCH_START_DELAY) {
          onMouseUp(e, isDoubleTap);
        } else {
          clearTimeout(touchStartTimeout);
          onMouseDown(e);
          onMouseUp(e, isDoubleTap);
          setTimeout(() => ObjectPanelController.updateActiveKey(null), 100);
        }

        isDoubleTap = false;
      }
    }

    if (e.touches.length >= 2) {
      panStartPosition = calculateTouchCenter(e.touches);
      panStartScroll = {
        left: workarea.scrollLeft,
        top: workarea.scrollTop,
      };
    }
  });

  mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
  mc.on('doubletap', (e) => {
    isDoubleTap = true;
    onDoubleClick(e as unknown as Event);
  });
};

export default {
  setupCanvasTouchEvents,
};
