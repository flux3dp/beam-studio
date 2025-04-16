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

  const perpendicularGroup = new paper.Group({ name: PERPENDICULAR_LINE_GROUP_NAME });

  getCuttingRange(path, point, width).forEach((offset) => {
    drawPerpendicularLineOnGroup(path, perpendicularGroup, offset, HEIGHT / zoomScale);
  });
}
