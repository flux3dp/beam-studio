import paper from 'paper';

import { TARGET_PATH_NAME } from './constant';
import { removePerpendicularLineIfExist } from './removePerpendicularLineIfExist';

type CutPathOptions = { gap: number; width?: number };

function createDash(
  path: paper.Path,
  start: number,
  end: number,
  totalLength: number,
  gap: number,
  width: number,
): paper.Path {
  const cloned = path.clone({ insert: false });
  const dash = cloned.splitAt(start);

  // if the dashEnd is near the end of the path, we don't need to split
  if (totalLength - end >= width + gap) dash.splitAt(end - start);

  return dash;
}

function appendDashSegments(path: paper.Path, gap: number, width: number, minSegmentLength: number) {
  const totalLength = path.length;
  let currentPosition = 0;

  while (currentPosition < totalLength) {
    const dashEnd = Math.min(currentPosition + gap, totalLength);
    const segmentLength = dashEnd - currentPosition;

    // only split if it meets minimum length
    if (segmentLength >= minSegmentLength) {
      const dash = createDash(path, currentPosition, dashEnd, totalLength, gap, width);

      path.parent?.addChild(dash);
    }

    currentPosition = Math.min(dashEnd + width, totalLength);
  }
}

function processPath(path: paper.Path, gap: number, width: number, minSegmentLength: number) {
  try {
    // if the path is closed, split it at the start to ensure we can cut it
    if (path.closed) path.splitAt(0);

    appendDashSegments(path, gap, width, minSegmentLength);
    path.remove();
  } catch (error) {
    console.error('Error processing path:', error);
  }
}

export function cutPathByGap(options: CutPathOptions): paper.CompoundPath {
  const { gap, width = gap } = options;
  const minSegmentLength = gap * 0.1;
  const compound = paper.project.getItem({ name: TARGET_PATH_NAME }) as paper.CompoundPath;

  if (!compound) throw new Error(`No compound path found with name ${TARGET_PATH_NAME}`);

  removePerpendicularLineIfExist();

  compound.children
    .filter((child) => child instanceof paper.Path)
    .forEach((path) => processPath(path, gap, width, minSegmentLength));

  return compound;
}
