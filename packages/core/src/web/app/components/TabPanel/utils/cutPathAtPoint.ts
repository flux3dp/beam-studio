import paper from 'paper';

import { getCuttingRange } from './getCuttingRange';

export function cutPathAtPoint(path: paper.Path, point: paper.Point, width: number): null | paper.CompoundPath {
  const location = path.getNearestLocation(point);

  if (!location) {
    console.error('cutPathAtPoint failed: No nearest location found on the path for the given point.');

    return null;
  }

  if (path.length === 0) {
    console.warn('cutPathAtPoint skipped: Path has zero length. Removing path.');
    path.remove();

    return null;
  }

  // Ensure the parent is a CompoundPath before proceeding.
  if (!(path.parent instanceof paper.CompoundPath)) {
    console.error('Cut operation failed: Path parent is not a CompoundPath.');

    return null;
  }

  const compound = path.parent;

  // if the path is closed, split it at the start to ensure we can cut it
  if (path.closed) path.splitAt(0);

  const [offsetStart, offsetEnd] = getCuttingRange(path, point, width);

  // warn if the offsets are invalid
  if (offsetStart >= offsetEnd) {
    console.warn(`Cut operation skipped: Invalid cutting range [${offsetStart}, ${offsetEnd}]. No cut performed.`);

    return compound; // Return the parent unmodified
  }

  const pathClone = path.clone({ insert: false });
  // cut the end of the offset, this will be the rest path we will add to the compound
  const restPath = pathClone.splitAt(offsetEnd);

  // then cut the start of the offset, the resulting path will be removed
  pathClone.splitAt(offsetStart);

  // only add path if it has length
  if (pathClone?.length) compound.addChild(pathClone);
  else pathClone?.remove();

  if (restPath?.length) compound.addChild(restPath);
  else restPath?.remove();

  // remove original path
  path.removeSegments();
  path.remove();

  return compound;
}
