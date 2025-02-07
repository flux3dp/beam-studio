import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IPoint } from '@core/interfaces/ISVGCanvas';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export function chooseCurrentDimensions(currentBoundingBox: IPoint[], dx: number, dy: number): IPoint {
  const matchPoints = currentBoundingBox.map((point) => svgCanvas.findMatchPoint(point.x + dx, point.y + dy));
  const center = {
    x: (currentBoundingBox[0].x + currentBoundingBox[currentBoundingBox.length - 1].x) / 2,
    y: (currentBoundingBox[0].y + currentBoundingBox[currentBoundingBox.length - 1].y) / 2,
  };
  const target = { x: 0, y: 0 };

  console.log(currentBoundingBox, matchPoints);
  console.log(center, dx, dy);

  currentBoundingBox.forEach((point, index) => {
    if (matchPoints[index].byX) {
      console.log('byX', matchPoints[index].byX);
      target.x = center.x + (matchPoints[index].byX.x - (point.x + dx));
    }

    if (matchPoints[index].byY) {
      console.log('byY', matchPoints[index].byY);
      target.y = center.y + (matchPoints[index].byY.y - (point.y + dy));
    }

    svgCanvas.drawTracingLine(
      point.x + dx,
      point.y + dy,
      matchPoints[index].byX?.x ?? point.x,
      matchPoints[index].byY?.y ?? point.y,
      index + 5655,
      '#FF0000',
    );
  });

  console.log(target);

  return target;
}
