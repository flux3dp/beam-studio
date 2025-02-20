import { match, P } from 'ts-pattern';

import round from '@core/helpers/math/round';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IPoint } from '@core/interfaces/ISVGCanvas';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { isSameTarget } from './isSameTarget';
import { isValidMatch } from './isValidMatch';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

type By = { byX: IPoint; byY: IPoint; farthest?: Record<'x' | 'y', IPoint> };

export function getMatchedDiffFromBBox(currentBoundingBox: IPoint[], current: IPoint, start: IPoint): IPoint {
  const [dx, dy] = [current.x - start.x, current.y - start.y];

  if (!currentBoundingBox.length) return { x: dx, y: dy };

  const matchPoints = currentBoundingBox
    .map(({ x, y }) => svgCanvas.findMatchedAlignPoints(x + dx, y + dy) as any)
    .map(({ byX, byY }) => ({ byX: byX[0], byY: byY[0], farthest: { x: byX[1], y: byY[1] } })) as By[];
  const center = { x: currentBoundingBox[1].x + dx, y: currentBoundingBox[3].y + dy };
  const target: IPoint = { x: current.x, y: current.y };
  // map string is the matched point and matched by(dimension)
  const matchedMap = new Map<string, Array<[IPoint, By, number]>>();
  const targetMap = { x: new Map<string, number>(), y: new Map<string, number>() };

  for (const [index, point] of currentBoundingBox.entries()) {
    const setToTargetMap = (key: 'x' | 'y') => {
      const targetMatched = matchPoints[index]?.[`by${key.toUpperCase()}` as 'byX' | 'byY'];

      if (!targetMatched) return;

      const value = round(start[key] + targetMatched?.[key] - point[key], 3);
      const prev = targetMap[key].get(String(value)) ?? 0;

      targetMap[key].set(String(value), prev + 1);
    };

    if (!matchPoints[index]) continue;

    if (matchPoints[index].byX) setToTargetMap('x');

    if (matchPoints[index].byY) setToTargetMap('y');
  }

  console.log('tm', targetMap);

  target.x = Number.parseFloat([...targetMap.x.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) || current.x;
  target.y = Number.parseFloat([...targetMap.y.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) || current.y;

  for (const [index, point] of currentBoundingBox.entries()) {
    let matchedPoint: Record<'x' | 'y', null | number> = { x: null, y: null };

    if (!matchPoints[index]?.byX?.x && !matchPoints[index]?.byY?.y) continue;

    if (!isSameTarget(target, matchPoints[index], start, point, 'x')) continue;

    if (!isSameTarget(target, matchPoints[index], start, point, 'y')) continue;

    if (isValidMatch(matchPoints[index]?.byX, center, index, 'x')) matchedPoint.x = matchPoints[index].byX.x;

    if (isValidMatch(matchPoints[index]?.byY, center, index, 'y')) matchedPoint.y = matchPoints[index].byY.y;

    if (!matchedPoint.x && !matchedPoint.y) continue;

    const [key, value] = match(matchedPoint)
      .with({ x: P.number, y: P.number }, () => [
        //
        [matchedPoint.x, matchedPoint.y].join(','),
        matchPoints[index],
      ])
      .with({ x: P.number }, () => [
        [matchedPoint.x, matchPoints[index]?.byX.y].join(','),
        { byX: { x: matchedPoint.x, y: matchPoints[index]?.byX.y }, byY: null, farthest: matchPoints[index]?.farthest },
      ])
      .with({ y: P.number }, () => [
        [matchPoints[index]?.byY.x, matchedPoint.y].join(','),
        { byX: null, byY: { x: matchPoints[index]?.byY.x, y: matchedPoint.y }, farthest: matchPoints[index]?.farthest },
      ])
      .run() as [string, By];

    matchedMap.set(key, [...(matchedMap.get(key) ?? []), [point, value, index]]);
  }

  const drewLineSet = new Set<string>();
  const nearestLines: Array<[[number, number], By, number]> = [];
  let index = 0;

  console.log(matchedMap);

  for (const [, matched] of matchedMap) {
    let diff = Number.MAX_SAFE_INTEGER;
    let nearest: [number, number] = [0, 0];
    let nearestMatched: By = { byX: { x: 0, y: 0 }, byY: { x: 0, y: 0 } };
    let nearestBboxDiff: [number, number] = [0, 0];

    for (const [{ x, y }, { byX, byY, farthest }, i] of matched.values()) {
      const pos: [number, number] = [x + dx, y + dy];
      const currentDiff = Math.abs(pos[0] - (byX?.x ?? pos[0])) + Math.abs(pos[1] - (byY?.y ?? pos[1]));

      if (currentDiff < diff) {
        diff = currentDiff;
        nearest = pos;
        nearestBboxDiff = [x - start.x, y - start.y];
        nearestMatched = { byX, byY };
      }

      const startPoint = { x: byX?.x ?? byY?.x ?? x, y: byY?.y ?? byX?.y ?? y };

      svgCanvas.drawAlignLine(pos[0], pos[1], byX, byY, (index + 1) * 10 + i * 2);
      // farthest point
      svgCanvas.drawAlignLine(startPoint.x, startPoint.y, farthest?.x!, farthest?.y!, (index + 1) * 10 + i * 2 + 1);
    }

    // if aligned, move the nearest point to the target point by the difference of the bbox
    if (target.x !== current.x) nearest[0] = target.x + nearestBboxDiff[0];

    if (target.y !== current.y) nearest[1] = target.y + nearestBboxDiff[1];

    const xLine = nearestMatched.byY ? `${nearest[0]},${nearestMatched.byY.x}` : '';
    const yLine = nearestMatched.byX ? `${nearest[1]},${nearestMatched.byX.y}` : '';

    if ((xLine.length && drewLineSet.has(xLine)) || (yLine.length && drewLineSet.has(yLine))) continue;

    // make sure the line is always on top of the other lines
    nearestLines.push([nearest, nearestMatched, index]);

    if (xLine.length) drewLineSet.add(xLine);

    if (yLine.length) drewLineSet.add(yLine);

    index++;
  }

  nearestLines.forEach(([[x, y], { byX, byY }, i]) => {
    svgCanvas.drawAlignLine(x, y, byX, byY, i);
  });

  console.log('tp', target);
  console.log('sp', start);

  return { x: target.x - start.x, y: target.y - start.y };
}
