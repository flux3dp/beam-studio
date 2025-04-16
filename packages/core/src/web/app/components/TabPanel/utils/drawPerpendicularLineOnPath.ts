import paper from 'paper';

import { PERPENDICULAR_LINE_GROUP_NAME } from './constant';
import { getCuttingRange } from './getCuttingRange';

const HEIGHT = 20;

function drawPerpendicularLineOnGroup(path: paper.Path, group: paper.Group, offset: number, height: number) {
  const line = new paper.Path.Line({ strokeColor: '#1890FF', strokeWidth: 2 });

  group.addChild(line);

  const point = path.getPointAt(offset);
  const { normal } = path.getNearestLocation(point);
  const normalizedHeight = normal.normalize(height / 2);

  line.removeSegments();
  line.add(point, point.subtract(normalizedHeight));
  line.add(point, point.add(normalizedHeight));

  return line;
}

function highlightBetweenOffsets(path: paper.Path, group: paper.Group, offsetStart: number, offsetEnd: number) {
  if (path.closed) path.splitAt(0);

  const pathClone = path.clone({ insert: false });

  pathClone.splitAt(offsetEnd);

  const lineBetween = pathClone.splitAt(offsetStart);

  if (!lineBetween) {
    pathClone.remove();
    path.remove();

    return;
  }

  if (lineBetween.length) {
    lineBetween.strokeColor = new paper.Color('red');
    lineBetween.strokeWidth = 1;
    group.addChild(lineBetween);
  } else {
    lineBetween.remove();
  }

  pathClone.remove();

  return lineBetween;
}

/**
 * Draws perpendicular lines at the start and end of a calculated cutting range
 * on a path, and highlights the segment between them in red.
 *
 * @param path - The path to draw on.
 * @param point - The reference point to determine the center of the range.
 * @param width - The desired width of the range.
 * @param zoomScale - The current zoom scale (affects visual size of perpendicular lines).
 */
export function drawPerpendicularLineOnPath(
  path: paper.Path,
  point: paper.Point,
  width: number,
  zoomScale: number = 1,
): void {
  const location = path.getNearestLocation(point);

  if (!location) {
    console.error('No nearest location found on the path');

    return;
  }

  const [offsetStart, offsetEnd] = getCuttingRange(path, point, width);
  const perpendicularGroup = new paper.Group({ name: PERPENDICULAR_LINE_GROUP_NAME });

  highlightBetweenOffsets(path, perpendicularGroup, offsetStart, offsetEnd);

  [offsetStart, offsetEnd].forEach((offset) => {
    drawPerpendicularLineOnGroup(path, perpendicularGroup, offset, HEIGHT / zoomScale);
  });
}
