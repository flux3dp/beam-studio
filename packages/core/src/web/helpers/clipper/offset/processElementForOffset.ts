import { match } from 'ts-pattern';

import { getSVGAsync } from '@core/helpers/svg-editor-helper';

import type ClipperBase from '../clipper';

import type { OffsetMode, Path } from './constants';
import { SCALE_FACTOR, UNSUPPORTED_TAGS } from './constants';

let svgedit: any;

getSVGAsync(({ Edit }) => {
  svgedit = Edit;
});

export async function processElementForOffset(
  elem: SVGElement,
  clipperInstance: ClipperBase,
  ClipperLib: any,
  cornerType: 'round' | 'sharp',
  mode: OffsetMode,
): Promise<{ isUnsupported: boolean; success: boolean }> {
  if (!elem) {
    console.warn('Element is null or undefined in processElementForOffset.');

    return { isUnsupported: false, success: false };
  }

  // Check for unsupported tags
  if (UNSUPPORTED_TAGS.includes(elem.tagName as any)) {
    console.log(`Skipping unsupported element: ${elem.tagName}`);

    return { isUnsupported: true, success: true };
  }

  try {
    const dPath = svgedit.utilities.getPathDFromElement(elem);

    if (!dPath) {
      console.warn('Element has no path data:', elem);

      // Treat as unsupported if no path data, or could be an error depending on expectations
      return { isUnsupported: true, success: true };
    }

    const bbox = svgedit.utilities.getBBox(elem);
    const rotation = {
      angle: svgedit.utilities.getRotationAngle(elem),
      cx: bbox.x + bbox.width / 2,
      cy: bbox.y + bbox.height / 2,
    };
    const paths = ClipperLib.dPathToPointPathsAndScale(dPath, rotation, SCALE_FACTOR) as Path[];

    if (!paths || paths.length === 0 || paths.some((path) => !path || path.length === 0)) {
      console.warn('No scalable path points found or empty subpath for element:', elem);

      // Not strictly unsupported, but processing failed for this path
      return { isUnsupported: false, success: false };
    }

    // Determine if the path is closed
    let isPathClosed = paths.every((path: Array<{ X: number; Y: number }>) => {
      if (!path || path.length === 0) return false; // An empty subpath cannot be closed in this context

      const firstPoint = path[0];
      const lastPoint = path.at(-1)!;

      return firstPoint.X === lastPoint.X && firstPoint.Y === lastPoint.Y;
    });

    const { endType, joinType } = match({ cornerType, isPathClosed, mode })
      .with({ mode: 'inward' }, () =>
        match({ cornerType, isPathClosed })
          .with({ cornerType: 'round' }, () => ({
            endType: ClipperLib.EndType.etOpenRound,
            joinType: ClipperLib.JoinType.jtRound,
          }))
          .with({ isPathClosed: true }, () => ({
            endType: ClipperLib.EndType.etClosedLine,
            joinType: ClipperLib.JoinType.jtMiter,
          }))
          .otherwise(() => ({
            endType: ClipperLib.EndType.etOpenSquare,
            joinType: ClipperLib.JoinType.jtMiter,
          })),
      )
      .with({ isPathClosed: true }, ({ cornerType }) => ({
        endType: ClipperLib.EndType.etClosedPolygon,
        joinType: cornerType === 'round' ? ClipperLib.JoinType.jtRound : ClipperLib.JoinType.jtMiter,
      }))
      .with({ cornerType: 'round' }, () => ({
        endType: ClipperLib.EndType.etOpenRound,
        joinType: ClipperLib.JoinType.jtRound,
      }))
      .with({ cornerType: 'sharp' }, () => ({
        endType: ClipperLib.EndType.etOpenSquare,
        joinType: ClipperLib.JoinType.jtSquare,
      }))
      .exhaustive();

    await clipperInstance.addPaths(paths, joinType, endType);

    return { isUnsupported: false, success: true };
  } catch (error) {
    console.error('Error processing element for offset:', elem, error);

    return { isUnsupported: false, success: false };
  }
}
