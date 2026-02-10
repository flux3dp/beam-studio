import { match } from 'ts-pattern';

import { getRotationAngle } from '@core/app/svgedit/transform/rotation';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';

import type ClipperBase from '../clipper';

import type { CornerType, OffsetMode, Path } from './constants';
import { SCALE_FACTOR } from './constants';

let svgedit: any;

getSVGAsync(({ Edit }) => {
  svgedit = Edit;
});

export async function processElementForOffset(
  elem: SVGElement,
  clipperInstance: ClipperBase,
  ClipperLib: any,
  cornerType: CornerType,
  mode: OffsetMode,
): Promise<{ isUnsupported: boolean; success: boolean }> {
  if (!elem) {
    console.warn('Element is null or undefined in processElementForOffset.');

    return { isUnsupported: false, success: false };
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
      angle: getRotationAngle(elem),
      cx: bbox.x + bbox.width / 2,
      cy: bbox.y + bbox.height / 2,
    };
    const paths = ClipperLib.dPathToPointPathsAndScale(dPath, rotation, SCALE_FACTOR) as Path[];

    if (!paths || paths.length === 0 || paths.some((path) => !path || path.length === 0)) {
      console.warn('No scalable path points found or empty subpath for element:', elem);

      // Not strictly unsupported, but processing failed for this path
      return { isUnsupported: false, success: false };
    }

    const uniquePaths = paths
      .map((path) => {
        if (path.length === 0) return [];

        const result: Path = [{ X: ~~path[0].X, Y: ~~path[0].Y }]; // Start with the first point

        for (let i = 1; i < path.length; i++) {
          const prev = path[i - 1];
          const curr = { X: ~~path[i].X, Y: ~~path[i].Y };

          if (Math.abs(prev.X - curr.X) < 1 && Math.abs(prev.Y - curr.Y) < 1) {
            continue; // Skip points that are too close to the previous point
          }

          result.push(curr);
        }

        return result;
      })
      .filter((path) => path.length > 1);

    const cleanedPaths = uniquePaths.map((path) => {
      const firstPoint = path[0];
      const lastPoint = path.at(-1)!;

      if (cornerType === 'round' || firstPoint.X !== lastPoint.X || firstPoint.Y !== lastPoint.Y) {
        return { isClosed: false, paths: [path] };
      }

      // ref: https://sourceforge.net/p/jsclipper/wiki/Home%206/#h-b4-simplifying-and-cleaning
      const simplifiedPaths = ClipperLib.Clipper.SimplifyPolygon(path, ClipperLib.PolyFillType.pftEvenOdd) as Path[];
      const cleanedPaths = ClipperLib.Clipper.CleanPolygons(simplifiedPaths, 0.05 * SCALE_FACTOR) as Path[];

      return { isClosed: true, paths: cleanedPaths };
    });

    await Promise.allSettled(
      cleanedPaths.map(async ({ isClosed, paths }) => {
        const { endType, joinType } = match({ cornerType, isClosed, mode })
          .with({ mode: 'inward' }, () =>
            match({ cornerType, isClosed })
              .with({ cornerType: 'round' }, () => ({
                endType: ClipperLib.EndType.etOpenRound,
                joinType: ClipperLib.JoinType.jtRound,
              }))
              .with({ isClosed: true }, () => ({
                endType: ClipperLib.EndType.etClosedLine,
                joinType: ClipperLib.JoinType.jtMiter,
              }))
              .otherwise(() => ({ endType: ClipperLib.EndType.etOpenSquare, joinType: ClipperLib.JoinType.jtMiter })),
          )
          .with({ isClosed: true }, ({ cornerType, mode }) =>
            match(mode)
              .with('shrink', () => ({
                endType: ClipperLib.EndType.etClosedPolygon,
                joinType: cornerType === 'round' ? ClipperLib.JoinType.jtRound : ClipperLib.JoinType.jtMiter,
              }))
              .otherwise(() => ({
                endType: ClipperLib.EndType.etClosedLine,
                joinType: cornerType === 'round' ? ClipperLib.JoinType.jtRound : ClipperLib.JoinType.jtMiter,
              })),
          )
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
      }),
    );

    return { isUnsupported: false, success: true };
  } catch (error) {
    console.error('Error processing element for offset:', elem, error);

    return { isUnsupported: false, success: false };
  }
}
