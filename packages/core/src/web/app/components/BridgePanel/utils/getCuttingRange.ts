import type paper from 'paper';

export function getCuttingRange(path: paper.Path, point: paper.Point, desiredWidth: number): [number, number] {
  const location = path.getNearestLocation(point);

  if (!location) return [0, 1];

  // Calculate maximum allowed offsets for each side separately
  const maxStartOffset = location.offset; // How much we can go backward
  const maxEndOffset = path.length - location.offset; // How much we can go forward

  // Calculate desired offsets for each side
  const desiredStartOffset = Math.min(desiredWidth / 2, maxStartOffset);
  const desiredEndOffset = Math.min(desiredWidth / 2, maxEndOffset);

  return [
    Math.max(0, location.offset - desiredStartOffset), // Start offset (left/before side)
    Math.min(location.offset + desiredEndOffset, path.length), // End offset (right/after side)
  ];
}
