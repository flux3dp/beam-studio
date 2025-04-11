import paper from 'paper';

import { TARGET_PATH_NAME } from './constant';

export function cutPathByGap(gap: number, width?: number) {
  const compound = paper.project.getItem({ name: TARGET_PATH_NAME }) as paper.CompoundPath;

  if (!compound) throw new Error(`No compound path found with name ${TARGET_PATH_NAME}`);

  width ??= gap;

  compound.children
    .filter((child) => child instanceof paper.Path)
    .forEach((path) => {
      try {
        // if the path is closed, split it at the start to ensure we can cut it
        if (path.closed) path.splitAt(0);

        const totalLength = path.length;
        let currentPosition = 0;

        while (currentPosition < totalLength) {
          // create dash segment
          const dashEnd = Math.min(currentPosition + width, totalLength);

          // only split if it meets minimum length
          if (dashEnd - currentPosition >= width * 0.1) {
            const pathCopy = path.clone({ insert: false });
            // split at the dashStart(currentPosition) to get the rest path
            const dashSegment = pathCopy.splitAt(currentPosition);

            // split at the dashEnd to get the dash segment
            dashSegment.splitAt(dashEnd - currentPosition);
            compound.addChild(dashSegment);
            pathCopy.remove();
          }

          currentPosition = Math.min(dashEnd + gap, totalLength);
        }

        path.remove();
      } catch (error) {
        console.error('Error processing path:', error);
      }
    });

  return compound;
}
