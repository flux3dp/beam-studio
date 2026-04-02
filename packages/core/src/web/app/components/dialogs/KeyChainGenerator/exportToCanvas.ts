import fontFuncs, { convertTextToPathByFontkit, getFontObj } from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { moveElements } from '@core/app/svgedit/operations/move';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getCategoryById } from './categories';
import useKeychainShapeStore from './useKeychainShapeStore';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * Converts all <text> elements in the SVG to <path> elements using fontkit.
 * The SVG is temporarily mounted to the DOM for SVG position methods to work.
 */
const convertTextsToPath = async (svg: SVGSVGElement): Promise<void> => {
  const textElements = Array.from(svg.querySelectorAll('text'));

  if (textElements.length === 0) return;

  // Mount to DOM so getStartPositionOfChar / getNumberOfChars work
  svg.style.visibility = 'hidden';
  svg.style.position = 'absolute';
  document.body.appendChild(svg);

  try {
    for (const textEl of textElements) {
      const postscriptName = textEl.getAttribute('font-postscript');
      const family = textEl.getAttribute('font-family') ?? '';

      let fontDesc;

      if (postscriptName) {
        fontDesc = fontFuncs.getFontOfPostscriptName(postscriptName);
      }

      if (!fontDesc) {
        if (!family) continue;

        const fonts = fontFuncs.requestFontsOfTheFontFamily(family.slice(1, -1)); // remove quotes

        if (!fonts.length) {
          console.warn(`No fonts found for family: ${family}`);
          continue;
        }

        fontDesc = fonts[0];
      }

      const fontObj = await getFontObj(fontDesc);
      const result = convertTextToPathByFontkit(textEl, fontObj, false);

      if (!result?.d) continue;

      const pathEl = document.createElementNS(NS.SVG, 'path');

      pathEl.setAttribute('d', result.d as string);
      pathEl.setAttribute('fill', textEl.getAttribute('fill') ?? '#000');

      if (result.transform) {
        pathEl.setAttribute('transform', result.transform);
      }

      textEl.replaceWith(pathEl);
    }
  } finally {
    svg.remove();
    svg.style.removeProperty('visibility');
    svg.style.removeProperty('position');
  }
};

/**
 * Exports the keychain SVG to the Beam Studio canvas as a new layer.
 * Reads the already-computed shape from the store (no recomputation).
 */
export const exportToCanvas = async (): Promise<void> => {
  let shape = useKeychainShapeStore.getState().shape;

  if (!shape) {
    const categoryId = useKeychainShapeStore.getState().categoryId;
    const category = getCategoryById(categoryId!);

    shape = useKeychainShapeStore.getState().buildShape(category);
  }

  const { bounds, svgElement } = shape;
  const outSvg = svgElement.cloneNode(true) as SVGSVGElement;

  // Convert text elements to paths before adding to canvas
  await convertTextsToPath(outSvg);

  const batchCmd = new history.BatchCommand('Export Keychain');
  const { layers: tLayers } = i18n.lang.keychain_generator;
  const { name } = createLayer(tLayers.keychain, { parentCmd: batchCmd });

  useLayerStore.getState().setSelectedLayers([name]);

  // Add each path element directly to the canvas
  const srcPaths = Array.from(outSvg.querySelectorAll('path'));
  const createdPaths: SVGPathElement[] = [];

  for (const srcPath of srcPaths) {
    const d = srcPath.getAttribute('d');

    if (!d) continue;

    const fill = srcPath.getAttribute('fill') ?? 'none';
    const pathEl = svgCanvas.addSvgElementFromJson({
      attr: {
        d,
        fill,
        'fill-opacity': fill === 'none' ? '0' : '1',
        id: svgCanvas.getNextId(),
        stroke: '#000',
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

  // Move elements to top-left by offsetting the shape bounds origin
  if (createdPaths.length > 0) {
    const dx = createdPaths.map(() => -bounds.x);
    const dy = createdPaths.map(() => -bounds.y);
    const moveCmd = moveElements(dx, dy, createdPaths, false);

    if (moveCmd && !moveCmd.isEmpty()) {
      batchCmd.addSubCommand(moveCmd);
    }
  }

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};
