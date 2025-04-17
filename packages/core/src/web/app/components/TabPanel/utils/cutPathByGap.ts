import paper from 'paper';

import { TARGET_PATH_NAME } from './constant';
import { removePerpendicularLineIfExist } from './removePerpendicularLineIfExist';

/**
 * Options for cutting paths into dashed segments.
 * @param gap - The length of the dash.
 * @param width - The length of the space after the dash, default is equal to gap.
 */
type CutPathOptions = {
  gap: number;
  width?: number;
};

/**
 * Creates a single dash segment from a cloned path.
 *
 * @param originalPath - The original path to clone from.
 * @param startOffset - The starting offset on the original path for the dash.
 * @param endOffset - The ending offset on the original path for the dash.
 * @param totalLength - The total length of the original path.
 * @param gap - The length of the dash.
 * @param width - The length of the space after the dash.
 * @returns The created dash Path item.
 */
function createDash(
  path: paper.Path,
  start: number,
  end: number,
  totalLength: number,
  gap: number,
  width: number,
): paper.Path {
  const cloned = path.clone({ insert: false });

  // if the dashEnd is near the end of the path, we don't need to split
  if (totalLength - end > width) cloned.splitAt(end);

  return cloned.splitAt(start);
}

function appendDashSegments(path: paper.Path, gap: number, width: number, minSegmentLength: number) {
  const totalLength = path.length;
  // initial position is -gap to ensure the first dash starts at 0
  let currentPosition = -gap;

  if (totalLength < minSegmentLength) return false;

  while (currentPosition < totalLength) {
    const dashEnd = Math.min(currentPosition + gap, totalLength);
    const segmentLength = dashEnd - currentPosition;

    // only split if it meets minimum length
    if (segmentLength >= minSegmentLength) {
      const dash = createDash(path, currentPosition, dashEnd, totalLength, gap, width);

      if (dash?.length) path.parent?.addChild(dash);
      else dash?.remove();
    }

    currentPosition = Math.min(dashEnd + width, totalLength);
  }

  return true;
}

function processPath(path: paper.Path, gap: number, width: number, minSegmentLength: number) {
  try {
    // if the path is closed, split it at the start to ensure we can cut it
    if (path.closed) path.splitAt(0);

    const result = appendDashSegments(path, gap, width, minSegmentLength);

    if (!result) {
      console.log(`Path is too short to be cut: `, path);

      return;
    }

    path.remove();
  } catch (error) {
    console.error('Error processing path:', error);
  }
}

/**
 * Cuts all Path children of a target CompoundPath into dashed segments.
 *
 * @param options - Configuration for the gap and width of dashes.
 * @returns The target CompoundPath containing the dashed segments.
 * @throws Error if the target CompoundPath is not found.
 */
export function cutPathByGap(options: CutPathOptions): paper.CompoundPath {
  const { gap, width = gap } = options;
  const minSegmentLength = gap * 0.1 + width;
  const compound = paper.project.getItem({ name: TARGET_PATH_NAME }) as paper.CompoundPath;

  if (!compound) throw new Error(`No compound path found with name ${TARGET_PATH_NAME}`);

  removePerpendicularLineIfExist();

  const childrenToProcess = [...compound.children];

  childrenToProcess
    .filter((child) => child instanceof paper.Path)
    .forEach((path) => processPath(path, gap, width, minSegmentLength));

  return compound;
}
