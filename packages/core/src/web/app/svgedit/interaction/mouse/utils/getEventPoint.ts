import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { IPoint } from '@core/interfaces/ISVGCanvas';

const { svgedit } = window;
let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const getEventPageXY = (e: MouseEvent | TouchEvent) => {
  if ('touches' in e) {
    const touch = e.touches[0] || e.changedTouches[0];

    return { x: touch.pageX, y: touch.pageY };
  }

  return { x: e.pageX, y: e.pageY };
};

export function getEventPoint(evt: MouseEvent | TouchEvent): IPoint {
  const matrix = svgCanvas?.getRootScreenMatrix();
  const { x, y } = getEventPageXY(evt);

  if (!matrix) {
    return { x, y };
  }

  return svgedit.math.transformPoint(x, y, matrix);
}
