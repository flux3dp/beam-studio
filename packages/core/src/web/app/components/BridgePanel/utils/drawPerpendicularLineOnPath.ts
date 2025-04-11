import paper from 'paper';

import { PERPENDICULAR_LINE_GROUP_NAME } from './constant';
import { getCuttingRange } from './getCuttingRange';

export function drawPerpendicularLineOnPath(
  path: paper.Path,
  point: paper.Point,
  width: number,
  height: number = 20,
): void {
  const location = path.getNearestLocation(point);

  if (!location) {
    console.error('No nearest location found on the path');

    return;
  }

  const [offsetStart, offsetEnd] = getCuttingRange(path, point, width);

  const perpendicularGroup = new paper.Group({ name: PERPENDICULAR_LINE_GROUP_NAME });
  const line1 = new paper.Path.Line({ strokeColor: '#1890FF', strokeWidth: 2 });
  const line2 = new paper.Path.Line({ strokeColor: '#1890FF', strokeWidth: 2 });

  perpendicularGroup.addChildren([line1, line2]);

  const start1 = path.getPointAt(offsetStart);
  const { normal: normal1 } = path.getNearestLocation(start1);
  const start2 = path.getPointAt(offsetEnd);
  const { normal: normal2 } = path.getNearestLocation(start2);
  const normalizedHeight1 = normal1.normalize(height / 2);
  const normalizedHeight2 = normal2.normalize(height / 2);

  // Draw the perpendicular lines
  line1.removeSegments();
  line2.removeSegments();
  line1.add(start1, start1.subtract(normalizedHeight1));
  line1.add(start1, start1.add(normalizedHeight1));
  line2.add(start2, start2.subtract(normalizedHeight2));
  line2.add(start2, start2.add(normalizedHeight2));
}
