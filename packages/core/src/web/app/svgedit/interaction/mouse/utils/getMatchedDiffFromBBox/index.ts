import { match, P } from 'ts-pattern';

import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IPoint } from '@core/interfaces/ISVGCanvas';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { isValidMatch } from './isValidMatch';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

type By = { byX: IPoint; byY: IPoint };

export function getMatchedDiffFromBBox(currentBoundingBox: IPoint[], current: IPoint, start: IPoint): IPoint {
  const [dx, dy] = [current.x - start.x, current.y - start.y];
  const matchPoints = currentBoundingBox.map(({ x, y }) => svgCanvas.findMatchedAlignPoints(x + dx, y + dy));
  const center = { x: currentBoundingBox[1].x + dx, y: currentBoundingBox[3].y + dy };
  const target: IPoint = { x: current.x, y: current.y };
  // map string is the matched point and matched by(dimension)
  const matchedMap = new Map<string, Array<[IPoint, By, number]>>();
  const targetMap = { x: new Map<string, number>(), y: new Map<string, number>() };

  for (const [index, point] of currentBoundingBox.entries()) {
    const setToTargetMap = (key: 'x' | 'y') => {
      const targetMatched = matchPoints[index]?.[`by${key.toUpperCase()}` as 'byX' | 'byY'];

      if (!targetMatched) return;

      const value = start[key] + targetMatched?.[key] - point[key];
      const prev = targetMap[key].get(String(value)) ?? 0;

      targetMap[key].set(String(value), prev + 1);
    };

    if (!matchPoints[index]) continue;

    if (matchPoints[index].byX) setToTargetMap('x');

    if (matchPoints[index].byY) setToTargetMap('y');
  }

  target.x = Number.parseFloat([...targetMap.x.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) || current.x;
  target.y = Number.parseFloat([...targetMap.y.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) || current.y;

  for (const [index, point] of currentBoundingBox.entries()) {
    let matchedPoint: Record<'x' | 'y', null | number> = { x: null, y: null };

    if (!matchPoints[index]?.byX?.x && !matchPoints[index]?.byY?.y) continue;

    if (isValidMatch(matchPoints[index]?.byX, center, index, 'x')) {
      if (start.x + matchPoints[index].byX.x - point.x !== target.x) continue;

      matchedPoint.x = matchPoints[index].byX.x;
    }

    if (isValidMatch(matchPoints[index]?.byY, center, index, 'y')) {
      if (start.y + matchPoints[index].byY.y - point.y !== target.y) continue;

      matchedPoint.y = matchPoints[index].byY.y;
    }

    if (!matchedPoint.x && !matchedPoint.y) continue;

    const [key, value] = match(matchedPoint)
      .with({ x: P.number, y: P.number }, () => [
        //
        [matchedPoint.x, matchedPoint.y].join(','),
        matchPoints[index],
      ])
      .with({ x: P.number }, () => [
        [matchedPoint.x, matchPoints[index]?.byX.y].join(','),
        { byX: { x: matchedPoint.x, y: matchPoints[index]?.byX.y }, byY: null },
      ])
      .with({ y: P.number }, () => [
        [matchPoints[index]?.byY.x, matchedPoint.y].join(','),
        { byX: null, byY: { x: matchPoints[index]?.byY.x, y: matchedPoint.y } },
      ])
      .run() as [string, By];

    matchedMap.set(key, [...(matchedMap.get(key) ?? []), [point, value, index]]);
  }

  const drewLineSet = new Set<string>();
  let index = 0;

  for (const [, matched] of matchedMap) {
    let diff = Number.MAX_SAFE_INTEGER;
    let nearest = [0, 0];
    let nearestMatched: By = { byX: { x: 0, y: 0 }, byY: { x: 0, y: 0 } };
    let nearestBboxDiff: [number, number] = [0, 0];

    for (const [{ x, y }, { byX, byY }, i] of matched.values()) {
      const pos = [x + dx, y + dy];
      const currentDiff = Math.abs(pos[0] - (byX?.x ?? pos[0])) + Math.abs(pos[1] - (byY?.y ?? pos[1]));

      if (currentDiff < diff) {
        diff = currentDiff;
        nearest = pos;
        nearestBboxDiff = [x - start.x, y - start.y];
        nearestMatched = { byX, byY };
      }

      svgCanvas.drawAlignLine(pos[0], pos[1], byX, byY, (index + 1) * 10 + i);
    }

    // if aligned, move the nearest point to the target point by the difference of the bbox
    if (target.x !== current.x) nearest[0] = target.x + nearestBboxDiff[0];

    if (target.y !== current.y) nearest[1] = target.y + nearestBboxDiff[1];

    const xLine = nearestMatched.byY ? `${nearest[0]},${nearestMatched.byY.x}` : '';
    const yLine = nearestMatched.byX ? `${nearest[1]},${nearestMatched.byX.y}` : '';

    if ((xLine.length && drewLineSet.has(xLine)) || (yLine.length && drewLineSet.has(yLine))) continue;

    svgCanvas.drawAlignLine(nearest[0], nearest[1], nearestMatched.byX, nearestMatched.byY, index);

    if (xLine.length) drewLineSet.add(xLine);

    if (yLine.length) drewLineSet.add(yLine);

    index++;
  }

  return { x: target.x - start.x, y: target.y - start.y };
}
