import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IPoint } from '@core/interfaces/ISVGCanvas';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export function getMatchedDiffFromBBox(currentBoundingBox: IPoint[], current: IPoint, start: IPoint): IPoint {
  const [dx, dy] = [current.x - start.x, current.y - start.y];
  const matchPoints = currentBoundingBox.map(({ x, y }) => svgCanvas.findMatchedAlignPoints(x + dx, y + dy));
  const target = { x: current.x, y: current.y };

  currentBoundingBox.forEach((point, index) => {
    if (matchPoints[index].byX) {
      target.x = start.x + matchPoints[index].byX.x - point.x;
    }

    if (matchPoints[index].byY) {
      target.y = start.y + matchPoints[index].byY.y - point.y;
    }

    if (matchPoints[index].byX || matchPoints[index].byY) {
      svgCanvas.drawAlignLine(point.x + dx, point.y + dy, matchPoints[index].byX, matchPoints[index].byY, index);
    }

    // if (matchPoints[index].byX && matchPoints[index].byY) {
    //   svgCanvas.drawTracingLine(
    //     point.x + dx,
    //     point.y + dy,
    //     matchPoints[index].byX.x,
    //     matchPoints[index].byY.y,
    //     index + 5655,
    //     '#FF0000',
    //   );
    // } else if (matchPoints[index].byX) {
    //   svgCanvas.drawTracingLine(
    //     point.x + dx,
    //     point.y + dy,
    //     matchPoints[index].byX.x,
    //     matchPoints[index].byX.y,
    //     index + 5655,
    //     '#FF0000',
    //   );
    // } else {
    //   svgCanvas.drawTracingLine(
    //     point.x + dx,
    //     point.y + dy,
    //     matchPoints[index].byY.x,
    //     matchPoints[index].byY.y,
    //     index + 5655,
    //     '#FF0000',
    //   );
    // }
  });

  return { x: target.x - start.x, y: target.y - start.y };
}
