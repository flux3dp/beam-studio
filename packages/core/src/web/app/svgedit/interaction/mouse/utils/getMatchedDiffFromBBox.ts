/* eslint-disable ts/no-unused-vars */
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
  const target: Record<'x' | 'y', number> = { x: current.x, y: current.y };
  // first map string is the target point,
  // second map string is the matched point and matched by(dimension)
  const potentialPointMap = new Map<string, Map<string, Array<[number, number, { byX: IPoint; byY: IPoint }]>>>();
  const needUpdateTargetList: [string[], string[]] = [[], []];

  for (const [index, point] of currentBoundingBox.entries()) {
    let matchedPoint: Record<'x' | 'y', null | number> = { x: null, y: null };

    if (!matchPoints[index]) continue;

    if (matchPoints[index].byX) {
      matchedPoint.x = matchPoints[index].byX.x;
      target.x = start.x + matchPoints[index].byX.x - point.x;
    }

    if (matchPoints[index].byY) {
      matchedPoint.y = matchPoints[index].byY.y;
      target.y = start.y + matchPoints[index].byY.y - point.y;
    }

    if (matchedPoint.x || matchedPoint.y) {
      let by = 'xy';

      if (!matchedPoint.x) {
        matchedPoint.x = matchPoints[index].byY.x;
        by = 'y';
      } else if (!matchedPoint.y) {
        matchedPoint.y = matchPoints[index].byX.y;
        by = 'x';
      }

      // svgCanvas.drawTracingLine(
      //   //
      //   point.x + dx,
      //   point.y + dy,
      //   target.x,
      //   target.y,
      //   index + 5655,
      //   '#FF0000',
      // );

      // svgCanvas.drawTracingLine(
      //   //
      //   point.x + dx,
      //   point.y + dy,
      //   matchedPoint.x,
      //   matchedPoint.y!,
      //   index + 5655,
      //   '#0000FF',
      // );

      const targetKey = [target.x, target.y].join(',');

      if (target.x === current.x) needUpdateTargetList[0].push(targetKey);
      else if (target.y === current.y) needUpdateTargetList[1].push(targetKey);

      const matchKey = [matchedPoint.x, matchedPoint.y, by].join(',');
      let matched = potentialPointMap.get(targetKey);

      if (!matched) {
        matched = new Map<string, Array<[number, number, { byX: IPoint; byY: IPoint }]>>();
        potentialPointMap.set(targetKey, matched);
      }

      matched.set(matchKey, [...(matched.get(matchKey) ?? []), [point.x, point.y, matchPoints[index]]]);
    }
  }

  for (const [index, needToUpdate] of needUpdateTargetList.entries()) {
    if (!needToUpdate.length) continue;

    const isUpdateX = index === 0;

    for (const key of needToUpdate) {
      const [x, y] = key.split(',').map((v) => Number.parseFloat(v));
      const targetKey = isUpdateX ? [target.x, y].join(',') : [x, target.y].join(',');
      const matched = potentialPointMap.get(key);

      if (key === targetKey || !matched) continue;

      const mergedInnerKeys = matched.keys();
      const targetMatched = potentialPointMap.get(targetKey) ?? new Map();

      for (const innerKey of mergedInnerKeys) {
        targetMatched.set(innerKey, [...(matched.get(innerKey) ?? []), ...(targetMatched.get(innerKey) ?? [])]);
      }

      potentialPointMap.delete(key);
    }
  }

  let maxMatched = 0;
  let needToDrawMap: [] | Map<string, Array<[number, number, { byX: IPoint; byY: IPoint }]>> = [];
  const colors = [
    '#00FF00',
    '#FF00FF',
    '#00FFFF',
    '#FFFF00',
    '#FF0000',
    '#0000FF',
    '#FFA500',
    '#800080',
    '#008000',
    '#800000',
    '#008080',
    '#808000',
    '#808080',
    '#C0C0C0',
    '#FFD700',
    '#FF4500',
    '#FF6347',
    '#FF69B4',
    '#FF7F50',
    '#FF8C00',
    '#FFA07A',
    '#FFA500',
    '#FFB6C1',
    '#FFC0CB',
    '#FFD700',
    '#FFDAB9',
    '#FFDEAD',
    '#FFE4B5',
    '#FFE4C4',
    '#FFE4E1',
    '#FFEBCD',
    '#FFEFD5',
    '#FFFAF0',
    '#FFFAFA',
    '#FFFF00',
    '#FFFFE0',
    '#FFFFF0',
  ];
  let colorIndex = 0;

  for (const [targetKey, matchedMap] of potentialPointMap) {
    const [targetX, targetY] = targetKey.split(',').map((v) => Number.parseFloat(v));
    let matchedCount = 0;

    for (const [, matched] of matchedMap) {
      matchedCount += matched.length;

      // for (const [index, [x, y]] of matched.entries()) {
      //   // svgCanvas.drawAlignLine(x + dx, y + dy, matchPoints.byX, matchPoints.byY, index);
      //   svgCanvas.drawTracingLine(
      //     //
      //     x + dx,
      //     y + dy,
      //     targetX,
      //     targetY,
      //     index + 15655 * (colorIndex + 1),
      //     colors[colorIndex],
      //   );
      // }
    }

    if (matchedCount > maxMatched) {
      maxMatched = matchedCount;
      [target.x, target.y] = [targetX, targetY];
      needToDrawMap = matchedMap;
    }

    colorIndex++;
  }

  // random magic number to prevent index conflict
  let outerIndex = 100;

  for (const [_, matched] of needToDrawMap) {
    for (const [index, [x, y, matchPoints]] of matched.entries()) {
      svgCanvas.drawAlignLine(x + dx, y + dy, matchPoints.byX, matchPoints.byY, outerIndex * 10 + index);
    }
    outerIndex++;
  }

  return { x: target.x - start.x, y: target.y - start.y };
}
