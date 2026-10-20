import paper from 'paper';

import NS from '@core/app/constants/namespaces';
import history from '@core/app/svgedit/history/history';
import { moveElements } from '@core/app/svgedit/operations/move';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * Scales an SVG path's `d` attribute by the given ratio using Paper.js.
 * Returns the scaled path data string.
 */
const scalePathData = (d: string, ratio: number): string => {
  const p = new paper.CompoundPath(d);

  p.scale(ratio, new paper.Point(0, 0));

  const scaled = p.pathData;

  p.remove();

  return scaled;
};

/**
 * Adds every <path> to the canvas, then moves the resulting
 * elements by (-bounds.x, -bounds.y) so the layer aligns to the canvas origin.
 * When sizeRatio ≠ 1, each path is scaled before adding.
 */
export const exportPathsToSvgCanvas = async (
  paths: SVGPathElement[],
  bounds: { x: number; y: number },
  batchCmd: IBatchCommand,
  sizeRatio: number = 1,
): Promise<void> => {
  const createdPaths: SVGPathElement[] = [];

  for (const path of paths) {
    let d = path.getAttribute('d');

    if (!d) continue;

    if (sizeRatio !== 1) {
      d = scalePathData(d, sizeRatio);
    }

    const fill = path.getAttribute('fill') ?? 'none';
    const stroke = path.getAttribute('stroke') ?? '#000';
    const pathEl = svgCanvas.addSvgElementFromJson({
      attr: {
        d,
        fill,
        'fill-opacity': fill === 'none' ? '0' : '1',
        id: svgCanvas.getNextId(),
        stroke,
        'stroke-width': 1,
        'vector-effect': 'non-scaling-stroke',
      },
      element: 'path',
    }) as SVGPathElement;

    pathEl.setAttribute('d', svgCanvas.pathActions.convertPath(pathEl, false));
    updateElementColor(pathEl);
    batchCmd.addSubCommand(new history.InsertElementCommand(pathEl));
    createdPaths.push(pathEl);
  }

  if (createdPaths.length > 0) {
    const dx = createdPaths.map(() => -bounds.x * sizeRatio);
    const dy = createdPaths.map(() => -bounds.y * sizeRatio);
    const moveCmd = moveElements(dx, dy, createdPaths, false);

    if (moveCmd && !moveCmd.isEmpty()) {
      batchCmd.addSubCommand(moveCmd);
    }
  }
};

/**
 * Builds a `<path>` element from a paper PathItem with the standard fill/stroke setup
 * used by the keychain export.
 */
export const pathItemToSvgPath = (item: paper.PathItem): SVGPathElement => {
  const path = document.createElementNS(NS.SVG, 'path') as SVGPathElement;

  path.setAttribute('d', item.pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#000');
  path.setAttribute('stroke-width', '1');
  path.setAttribute('vector-effect', 'non-scaling-stroke');

  return path;
};
