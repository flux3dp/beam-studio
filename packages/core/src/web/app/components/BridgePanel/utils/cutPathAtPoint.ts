import type paper from 'paper';
import { pipe } from 'remeda';

export function cutPathAtPoint(path: paper.Path, point: paper.Point, width: number) {
  const location = path.getNearestLocation(point);
  const [offsetStart, offsetEnd] = pipe(location, ({ offset }) => [
    Math.max(0, offset - width / 2),
    Math.min(path.length, offset + width / 2),
  ]);

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
  compound.addChild(pathClone);
  compound.addChild(part2);

  return compound;
}
