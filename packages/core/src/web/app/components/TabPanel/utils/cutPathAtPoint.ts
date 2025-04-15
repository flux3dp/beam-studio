import type paper from 'paper';

import { getCuttingRange } from './getCuttingRange';

export function cutPathAtPoint(path: paper.Path, point: paper.Point, width: number) {
  const location = path.getNearestLocation(point);

  if (!location) {
    console.error('No nearest location found on the path');

    return;
  }

  if (path.length === 0) {
    console.error('Path length is 0');
    path.remove();

    return;
  }

  const [offsetStart, offsetEnd] = getCuttingRange(path, point, width);

  // clone the original path so we don't lose the full shape
  const pathClone = path.clone({ insert: false });

  // if the path is closed, split it at the start to ensure we can cut it
  if (pathClone.closed) pathClone.splitAt(0);

  // split at offsetStart and offsetEnd
  const part1 = pathClone.splitAt(offsetStart);
  // extracted section
  const part2 = part1.splitAt(offsetEnd - offsetStart);
  const compound = path.parent as paper.CompoundPath;

  path.remove();

  // only add path if it has length
  if (pathClone?.length) compound.addChild(pathClone);

  if (part2?.length) compound.addChild(part2);

  return compound;
}
