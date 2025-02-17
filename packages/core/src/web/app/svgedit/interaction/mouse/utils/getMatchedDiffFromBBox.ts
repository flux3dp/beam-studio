import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IPoint } from '@core/interfaces/ISVGCanvas';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export function getMatchedDiffFromBBox(currentBoundingBox: IPoint[], current: IPoint, start: IPoint): IPoint {
  const [dx, dy] = [current.x - start.x, current.y - start.y];
  const matchPoints = currentBoundingBox.map(({ x, y }) => svgCanvas.findMatchedAlignPoints(x + dx, y + dy));
  const target: IPoint = { x: current.x, y: current.y };
  // map string is the matched point and matched by(dimension)
  const matchedMap = new Map<string, Array<[number, number, number]>>();
  const targetMap = { x: new Map<string, number>(), y: new Map<string, number>() };

  for (const [index, point] of currentBoundingBox.entries()) {
    if (!matchPoints[index]) continue;

    if (matchPoints[index].byX) {
      const x = start.x + matchPoints[index].byX.x - point.x;
      const prev = targetMap.x.get(String(x)) ?? 0;

      targetMap.x.set(String(x), prev + 1);
    }

    if (matchPoints[index].byY) {
      const y = start.y + matchPoints[index].byY.y - point.y;
      const prev = targetMap.y.get(String(y)) ?? 0;

      targetMap.y.set(String(y), prev + 1);
    }
  }

  target.x = Number.parseFloat([...targetMap.x.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) || current.x;
  target.y = Number.parseFloat([...targetMap.y.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) || current.y;

  for (const [index, point] of currentBoundingBox.entries()) {
    let matchedPoint: Record<'x' | 'y', null | number> = { x: null, y: null };

    if (!matchPoints[index]?.byX?.x && !matchPoints[index]?.byY?.y) continue;

    console.log(matchPoints[index], index);

    if (matchPoints[index].byX) {
      if (start.x + matchPoints[index].byX.x - point.x !== target.x) continue;

      matchedPoint.x = matchPoints[index].byX.x;
    }

    if (matchPoints[index].byY) {
      if (start.y + matchPoints[index].byY.y - point.y !== target.y) continue;

      matchedPoint.y = matchPoints[index].byY.y;
    }

    if (matchedPoint.x || matchedPoint.y) {
      let by = 'xy';

      // only matched x
      if (!matchedPoint.y) {
        let matchKey = [matchPoints[index].byX.x, matchPoints[index].byX.y].join(',');

        matchedMap.set(matchKey, [...(matchedMap.get(matchKey) ?? []), [point.x, point.y, index]]);
        // if ([3, 4].includes(index)) continue;

        // matchedPoint.y = matchPoints[index].byX.y;
        // by = 'x';
      } else if (!matchedPoint.x) {
        let matchKey = [matchPoints[index].byY.x, matchPoints[index].byY.y].join(',');

        matchedMap.set(matchKey, [...(matchedMap.get(matchKey) ?? []), [point.x, point.y, index]]);
        // if ([1, 6].includes(index)) continue;

        // matchedPoint.x = matchPoints[index].byY.x;
        // by = 'y';
      } else {
        let matchKey = [matchPoints[index].byX.x, matchPoints[index].byY.y].join(',');

        matchedMap.set(matchKey, [...(matchedMap.get(matchKey) ?? []), [point.x, point.y, index]]);
      }
    }
  }

  let outerIndex = 0;

  console.log('matchedMap', matchedMap);

  for (const [, matched] of matchedMap) {
    let diff = Number.MAX_SAFE_INTEGER;
    let nearest = [0, 0];
    let nearestMatched: { byX: IPoint; byY: IPoint } = { byX: { x: 0, y: 0 }, byY: { x: 0, y: 0 } };
    let nearestBboxDiff: [number, number] = [0, 0];

    console.log('matched', matched);

    for (const [x, y, index] of matched.values()) {
      const matchPoint = matchPoints[index]!;
      const pos = [x + dx, y + dy];
      const currentDiff =
        Math.abs(pos[0] - (matchPoint.byX?.x ?? pos[0])) + Math.abs(pos[1] - (matchPoint.byY?.y ?? pos[1]));

      if (currentDiff < diff) {
        diff = currentDiff;
        nearest = pos;
        nearestBboxDiff = [x - start.x, y - start.y];
        nearestMatched = matchPoint;
      }

      console.log('i', (outerIndex + 1) * 10 + index);
      svgCanvas.drawAlignLine(pos[0], pos[1], matchPoint.byX, matchPoint.byY, (outerIndex + 1) * 10 + index);
    }

    // if aligned, move the nearest point to the target point by the difference of the bbox
    if (target.x !== current.x) nearest[0] = target.x + nearestBboxDiff[0];

    if (target.y !== current.y) nearest[1] = target.y + nearestBboxDiff[1];

    console.log('oi', outerIndex);
    svgCanvas.drawAlignLine(nearest[0], nearest[1], nearestMatched.byX, nearestMatched.byY, outerIndex);
    outerIndex++;
  }

  return { x: target.x - start.x, y: target.y - start.y };
}
