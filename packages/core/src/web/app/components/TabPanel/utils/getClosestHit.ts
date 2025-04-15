import paper from 'paper';

import { compareDistance } from './compareDistance';
import { TARGET_PATH_NAME, TOLERANCE } from './constant';

export function getClosestHit(point: paper.Point): null | paper.HitResult {
  const hits = Array.of<paper.HitResult>();

  paper.project.hitTest(point, {
    // ensure we only hit test paths
    class: paper.Path,
    fill: false,
    match: (hit: paper.HitResult) => {
      // ensure the path is the target compound path's child
      if (hit.item.parent?.name === TARGET_PATH_NAME) hits.push(hit);

      // always return false to continuously check the next hit
      return false;
    },
    segments: true,
    stroke: true,
    tolerance: TOLERANCE,
  });

  if (!hits.length) return null;

  return hits.sort(compareDistance(point))[0];
}
