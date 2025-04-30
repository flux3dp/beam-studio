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

function createDash(path: paper.Path, start: number, end: number): null | paper.Path {
  const tolerance = 1e-9;

  // Skip if the start/end are out of bounds or the length is too small
  if (start < -tolerance || end > path.length + tolerance || end - start < tolerance) {
    return null;
  }

  const validStart = Math.max(0, start);
  const validEnd = Math.min(path.length, end);

  if (validEnd - validStart < tolerance) return null;

  const cloned = path.clone({ insert: false });

  if (validEnd < path.length - tolerance) cloned.splitAt(validEnd);

  return validStart > tolerance ? cloned.splitAt(validStart) : cloned;
}

/**
 * Appends dash segments to the parent of a given path, replacing the original path.
 *
 * @param path - The original path to create dashes from.
 * @param gap - The desired length of the dash segments.
 * @param width - The desired length of the space between dashes.
 * @param minSegmentLength - The minimum length a dash segment must have to be created, *unless* it's the final segment reaching the end.
 * @returns True if dashing was attempted, false otherwise.
 */
function appendDashSegments(path: paper.Path, gap: number, width: number, minSegmentLength: number): boolean {
  const totalLength = path.length;
  const tolerance = 1e-9; // Small tolerance for floating point comparisons
  let currentPosition = -gap; // Initialize to -gap to start the first dash at 0
  let segmentCreated = false; // Flag to track if any segment was added

  // Cannot dash a zero-length path or with zero/negative gap length
  if (totalLength <= tolerance || gap <= tolerance) return segmentCreated;

  while (currentPosition < totalLength - tolerance) {
    const dashEnd = Math.min(currentPosition + gap, totalLength);
    let segmentLength = dashEnd - currentPosition;

    // Avoid issues with tiny negative lengths due to float precision near the end
    if (segmentLength < tolerance) segmentLength = 0;

    // Determine if this segment reaches the very end of the path
    const isLastPotentialSegment = Math.abs(dashEnd - totalLength) < tolerance;

    // Create the dash if:
    // 1. Its length is >= minSegmentLength OR
    // 2. It's the very last segment reaching the end (and has some length)
    if (segmentLength >= minSegmentLength || (isLastPotentialSegment && segmentLength > tolerance)) {
      // Ensure createDash can handle start/end precisely (use the corrected version)
      const dash = createDash(path, currentPosition, dashEnd);

      // Add the dash only if it's valid and has a length greater than the tolerance
      if (dash && dash.length > tolerance) {
        path.parent?.addChild(dash);
        segmentCreated = true;
      } else {
        // Clean up null/empty dash object
        dash?.remove();
      }
    }

    // Update position for the start of the next dash
    currentPosition = dashEnd + width;

    // Safety break for zero/negative width to prevent infinite loop if no progress
    if (width <= tolerance && segmentLength <= tolerance) {
      console.warn('Potential infinite loop detected: gap and width might be too small or zero.');
      break;
    }
  }

  // Only remove if dashes were actually added
  if (segmentCreated) {
    path.remove();
  }

  // Return true if at least one dash was made
  return segmentCreated;
}

function processPath(path: paper.Path, gap: number, width: number, minSegmentLength: number) {
  try {
    // if the path is closed, split it at the start to ensure we can cut it
    if (path.closed) path.splitAt(0);

    appendDashSegments(path, gap, width, minSegmentLength);
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
