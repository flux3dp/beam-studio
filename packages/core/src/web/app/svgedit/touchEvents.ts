import Hammer from 'hammerjs';

import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import workareaManager from '@core/app/svgedit/workarea';

type Point = { x: number; y: number };
type TouchEventWithScale = TouchEvent & { scale?: number };

const calculateTouchCenter = (touches: TouchList): Point => {
  const center = { x: 0, y: 0 };

  if (touches.length > 0) {
    for (let i = 0; i < touches.length; i += 1) {
      center.x += touches[i].clientX;
      center.y += touches[i].clientY;
    }
    center.x /= touches.length;
    center.y /= touches.length;
  }

  return center;
};

const TOUCH_START_DELAY = 100; // ms
const SCALE_CHANGE_THRESHOLD = 1.05;
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
  let touchStartTimeout: ReturnType<typeof setTimeout>;
  let touchStartTimestamp: number;
  let firstTouchID: null | number = null;
  let panStartPosition: null | Point = null;
  let panStartScroll = { left: 0, top: 0 };
  let workareaOffset = { left: 0, top: 0 };
  let startZoom: null | number = null;
  let currentScale = 1;
  let startDist = 0;
  let pendingTouchMove: null | { center: Point; scale: number } = null;
  let touchMoveAnimationFrame: null | number = null;
  let isDoubleTap = false;
  const mc = new Hammer.Manager(container as HTMLElement);

  container.addEventListener('touchstart', (event) => {
    const e = event as TouchEvent;

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

      const { left, top } = workarea.getBoundingClientRect();

      workareaOffset = { left, top };

      const { scale } = e as TouchEventWithScale;

      if (scale === undefined) {
        startZoom = workareaManager.zoomRatio;
        startDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        currentScale = 1;
      } else if (scale === 1) {
        startZoom = workareaManager.zoomRatio;
        currentScale = 1;
      }
    }
  });

  container.addEventListener('touchmove', (event) => {
    const e = event as TouchEvent;

    e.preventDefault();

    if (e.touches.length === 1) {
      if (e.touches[0].identifier === firstTouchID && Date.now() > touchStartTimestamp + TOUCH_START_DELAY) {
        onMouseMove(e);
      }
    } else if (e.touches.length >= 2) {
      pendingTouchMove = {
        center: calculateTouchCenter(e.touches),
        scale:
          (e as TouchEventWithScale).scale ??
          Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) /
            startDist,
      };

      if (touchMoveAnimationFrame !== null) return;

      touchMoveAnimationFrame = requestAnimationFrame(() => {
        touchMoveAnimationFrame = null;

        const touchMove = pendingTouchMove;

        pendingTouchMove = null;

        if (!touchMove) return;

        const { center, scale } = touchMove;
        const shouldZoom =
          startZoom !== null && Math.abs(Math.log(currentScale / scale)) >= Math.log(SCALE_CHANGE_THRESHOLD);
        const newZoom = shouldZoom && startZoom !== null ? startZoom * scale ** 0.5 : workareaManager.zoomRatio;
        const wOrig = workarea.clientWidth;
        const hOrig = workarea.clientHeight;
        const canPan =
          wOrig < workareaManager.width * newZoom * multi && hOrig < workareaManager.height * newZoom * multi;

        if (canPan && panStartPosition) {
          workarea.scrollLeft = panStartScroll.left + panStartPosition.x - center.x;
          workarea.scrollTop = panStartScroll.top + panStartPosition.y - center.y;
        }

        if (shouldZoom) {
          setZoom(newZoom, {
            x: center.x - workareaOffset.left,
            y: center.y - workareaOffset.top,
          });
          currentScale = scale;
        }

        panStartPosition = center;
        panStartScroll = {
          left: workarea.scrollLeft,
          top: workarea.scrollTop,
        };
      });
    }
  });

  container.addEventListener('touchend', (event) => {
    const e = event as TouchEvent;

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
