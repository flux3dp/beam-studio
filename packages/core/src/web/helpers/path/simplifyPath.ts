import NS from '@core/app/constants/namespaces';
import getClipperLib from '@core/helpers/clipper/getClipperLib';
import round from '@core/helpers/math/round';
import * as BezierFitCurve from '@core/helpers/path/bezier-fit-curve';

interface Point {
  x: number;
  y: number;
}

interface Rotation {
  angle: number;
  cx: number;
  cy: number;
}

type SegmentedPath = Array<{ points: Point[]; type: string }>;

/**
 * Bezier-fit a ring of points into a single `M…Z` SVG subpath. Output
 * coordinates are rounded to `roundFactor`; when fitting yields no segments the
 * ring is emitted as straight lines. Returns '' for an empty ring.
 */
export const simplifyPathPoints = (points: Point[], roundFactor: number): string => {
  if (points.length === 0) return '';

  const pointsToFit = points.map(({ x, y }) => ({
    x: Math.round(x * roundFactor) / roundFactor,
    y: Math.round(y * roundFactor) / roundFactor,
  }));
  const segments = BezierFitCurve.fitPath(pointsToFit);
  let pathData = 'M';

  if (segments.length === 0) {
    // Fallback: if fitPath yields no segments, draw straight lines
    pathData += `${pointsToFit[0].x},${pointsToFit[0].y}`;
    pathData += pointsToFit
      .slice(1)
      .map(({ x, y }) => `L${x},${y}`)
      .join('');
  } else {
    pathData += `${segments[0].points[0].x},${segments[0].points[0].y}`;
    segments.forEach((segment) => {
      const pointsString = segment.points
        .slice(1)
        .map(({ x, y }) => `${x},${y}`)
        .join(' ');

      pathData += `${segment.type}${pointsString}`;
    });
  }

  return pathData + 'Z';
};

/**
 * Bezier-fit every straight run in a path `d` string, leaving existing curve and
 * move/close commands untouched. `rotation` orients the segmentation; line runs
 * are fitted with `fitPath` (length measured per subpath), degenerate segments
 * dropped, and output coordinates rounded to 2 decimals. Returns the new `d`.
 */
export const simplifyPathD = (d: string, rotation: Rotation): string => {
  const _round = (val: number) => round(val, 2);
  const ClipperLib = getClipperLib();
  const measurer = document.createElementNS(NS.SVG, 'path');
  const dPaths = d.split(/(?=M)/);
  const result = Array.of<string>();
  let lastPoint: Point | undefined = undefined;

  dPaths.forEach((dPath) => {
    lastPoint = undefined;
    measurer.setAttribute('d', dPath);

    const dLength = measurer.getTotalLength();
    const path: SegmentedPath = ClipperLib.dPathToLineSegments(dPath, rotation);

    path.forEach(({ points, type }) => {
      if (type === 'Z') {
        result.push(type);
        lastPoint = undefined;
      } else if (type !== 'L') {
        result.push(`${type}${points.map((p) => `${_round(p.x)},${_round(p.y)}`).join(' ')}`);
        lastPoint = points.at(-1);
      } else {
        const segs = BezierFitCurve.fitPath(points, dLength);

        for (let j = 0; j < segs.length; j += 1) {
          // Note: points[0] is included in the last segment
          const { points, type } = segs[j];

          if (
            lastPoint &&
            type === 'L' &&
            _round(points[1].x - lastPoint.x) === 0 &&
            _round(points[1].y - lastPoint.y) === 0
          ) {
            continue;
          }

          const pointsString = points
            .slice(1)
            .map((p) => `${_round(p.x)},${_round(p.y)}`)
            .join(' ');

          lastPoint = points.at(-1);
          result.push(`${type}${pointsString}`);
        }
      }
    });
  });

  return result.join('');
};
