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

type Matched = Record<'farthest' | 'nearest', Record<'x' | 'y', IPoint | null>>;
type PointSet = Record<'x' | 'y', IPoint | null>;

export function getMatchedDiffFromBBox(currentBoundingBox: IPoint[], current: IPoint, start: IPoint): IPoint {
  const [dx, dy] = [current.x - start.x, current.y - start.y];

  if (!currentBoundingBox.length) return { x: dx, y: dy };

  const matchPoints = currentBoundingBox.map(({ x, y }) => svgCanvas.findMatchedAlignPoints(x + dx, y + dy));
  const center = { x: currentBoundingBox[1].x + dx, y: currentBoundingBox[3].y + dy };
  const target: IPoint = { x: current.x, y: current.y };
  // map string is the matched point and matched by(dimension)
  const matchedMap = new Map<string, Array<[IPoint, Matched, number]>>();
  const targetMap = { x: new Map<string, number>(), y: new Map<string, number>() };

  for (const [index, point] of currentBoundingBox.entries()) {
    const setToTargetMap = (key: 'x' | 'y') => {
      const targetMatched = matchPoints[index].nearest[key];

      if (!targetMatched) return;

      const value = round(start[key] + targetMatched?.[key] - point[key], 3);
      const prev = targetMap[key].get(String(value)) ?? 0;

      targetMap[key].set(String(value), prev + 1);
    };

    if (matchPoints[index].nearest.x) setToTargetMap('x');

    if (matchPoints[index].nearest.y) setToTargetMap('y');
  }

  target.x = Number.parseFloat([...targetMap.x.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) || current.x;
  target.y = Number.parseFloat([...targetMap.y.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]) || current.y;

  for (const [index, point] of currentBoundingBox.entries()) {
    const { farthest, nearest } = matchPoints[index];
    let matchedPoint: Record<'x' | 'y', null | number> = { x: null, y: null };

    if (
      (!nearest.x?.x && !nearest.y?.y) ||
      !isSameTarget(target, nearest, start, point, 'x') ||
      !isSameTarget(target, nearest, start, point, 'y')
    ) {
      continue;
    }

    if (isValidMatch(nearest.x, center, index, 'x')) matchedPoint.x = nearest.x!.x;

    if (isValidMatch(nearest.y, center, index, 'y')) matchedPoint.y = nearest.y!.y;

    if (!matchedPoint.x && !matchedPoint.y) continue;

    const [key, value] = match(matchedPoint)
      .with({ x: P.number, y: P.number }, () => [[matchedPoint.x, matchedPoint.y].join(','), matchPoints[index]])
      .with({ x: P.number }, () => [
        [matchedPoint.x, nearest.x?.y].join(','),
        { farthest, nearest: { x: { x: matchedPoint.x, y: nearest.x?.y }, y: null } },
      ])
      .with({ y: P.number }, () => [
        [nearest.y?.x, matchedPoint.y].join(','),
        { farthest, nearest: { x: null, y: { x: nearest.y?.x, y: matchedPoint.y } } },
      ])
      .otherwise(() => ({ farthest: null, nearest: null })) as [
      string,
      Record<'farthest' | 'nearest', Record<'x' | 'y', IPoint | null>>,
    ];

    matchedMap.set(key, [...(matchedMap.get(key) ?? []), [point, value, index]]);
  }

  const drewLineSet = new Set<string>();
  const nearestLines: Array<[[number, number], PointSet, number]> = [];
  let index = 0;

  for (const [, matched] of matchedMap) {
    let diff = Number.MAX_SAFE_INTEGER;
    let currentNearest: [number, number] = [0, 0];
    let nearestMatched: PointSet = { x: { x: 0, y: 0 }, y: { x: 0, y: 0 } };
    let nearestBboxDiff: [number, number] = [0, 0];

    for (const [{ x, y }, { farthest, nearest }, i] of matched.values()) {
      const pos: [number, number] = [x + dx, y + dy];
      const currentDiff = Math.abs(pos[0] - (nearest.x?.x ?? pos[0])) + Math.abs(pos[1] - (nearest.y?.y ?? pos[1]));

      if (currentDiff < diff) {
        diff = currentDiff;
        currentNearest = pos;
        nearestBboxDiff = [x - start.x, y - start.y];
        nearestMatched = nearest;
      }

      const startPoint = { x: nearest.x?.x ?? nearest.y?.x ?? x, y: nearest.y?.y ?? nearest.x?.y ?? y };

      svgCanvas.drawAlignLine(pos[0], pos[1], nearest.x, nearest.y, (index + 1) * 10 + i * 2);
      // farthest point
      svgCanvas.drawAlignLine(startPoint.x, startPoint.y, farthest.x, farthest.y, (index + 1) * 10 + i * 2 + 1);
    }

    // if aligned, move the nearest point to the target point by the difference of the bbox
    if (target.x !== current.x) currentNearest[0] = target.x + nearestBboxDiff[0];

    if (target.y !== current.y) currentNearest[1] = target.y + nearestBboxDiff[1];

    const xLine = nearestMatched.y ? `${currentNearest[0]},${nearestMatched.y.x}` : '';
    const yLine = nearestMatched.x ? `${currentNearest[1]},${nearestMatched.x.y}` : '';

    if ((xLine.length && drewLineSet.has(xLine)) || (yLine.length && drewLineSet.has(yLine))) continue;

    // make sure the line is always on top of the other lines
    nearestLines.push([currentNearest, nearestMatched, index]);

    if (xLine.length) drewLineSet.add(xLine);

    if (yLine.length) drewLineSet.add(yLine);

    index++;
  }

  nearestLines.forEach(([[px, py], { x, y }, i]) => {
    svgCanvas.drawAlignLine(px, py, x, y, i);
  });

  return { x: target.x - start.x, y: target.y - start.y };
}
