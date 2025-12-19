import { getOS } from '@core/helpers/getOS';

const wheelEventHandlerGenerator = (
  getCurrentRatio: () => number,
  zoomFunction: (ratio: number, center: { x: number; y: number }) => void,
  opts?: {
    getCenter?: (e: WheelEvent) => { x: number; y: number };
    maxZoom?: number;
    minZoom?: number;
    zoomInterval?: number;
  },
): ((evt: WheelEvent) => void) => {
  let targetRatio: number;
  let timer: NodeJS.Timeout | null = null;
  let trigger: number;

  const handler = (e: WheelEvent) => {
    // @ts-expect-error use wheelDelta if exists
    const { ctrlKey, deltaX, detail, wheelDelta } = e;
    const { getCenter, maxZoom, minZoom, zoomInterval = 20 } = opts ?? {};

    let isMouse = getOS() !== 'MacOS';

    if (Math.abs(deltaX) > 0) isMouse = false;

    const zoomProcess = () => {
      const currentRatio = getCurrentRatio();

      if (targetRatio === currentRatio && timer) {
        clearTimeout(timer);
        timer = null;

        return;
      }

      const center = getCenter ? getCenter(e) : { x: e.clientX, y: e.clientY };

      trigger = Date.now();
      zoomFunction(targetRatio, center);
    };

    const zoom = () => {
      const delta = wheelDelta ?? -detail;

      targetRatio = getCurrentRatio();

      if (maxZoom && targetRatio >= maxZoom && delta > 0) return;

      if (minZoom && targetRatio <= minZoom && delta < 0) return;

      targetRatio *= 1.02 ** (delta / (isMouse ? 50 : 100));

      if (maxZoom) targetRatio = Math.min(targetRatio, maxZoom);

      if (minZoom) targetRatio = Math.max(targetRatio, minZoom);

      if (Date.now() - trigger < zoomInterval) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(zoomProcess, zoomInterval);
      } else {
        zoomProcess();
      }
    };

    if (isMouse || (!isMouse && ctrlKey)) {
      // mouse
      e.preventDefault();
      e.stopPropagation();
    } else if (!ctrlKey) {
      return;
    }

    zoom();
  };

  return handler;
};

export default wheelEventHandlerGenerator;
