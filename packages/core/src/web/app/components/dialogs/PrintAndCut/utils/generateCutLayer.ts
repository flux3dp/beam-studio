import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { moveElements } from '@core/app/svgedit/operations/move';
import selectionManager from '@core/app/svgedit/selection';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import { getBBox } from '@core/app/svgedit/utils/getBBox';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { deleteLayerByName } from '@core/helpers/layer/deleteLayer';
import { cloneLayerConfig } from '@core/helpers/layer/layer-config-helper';
import { createLayer, getLayerName } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { setPrintAndCutConfig } from '../configStore';
import { CUT_COLOR, PRINT_AND_CUT_LAYER_ATTR } from '../constants';
import type { AlignmentTransform } from '../store';
import { usePrintAndCutStore } from '../store';

import { getGeneratedCutLayers } from './contentsLayers';
import { getContourElements } from './contourElements';
import { getGridOffsets } from './layout';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

/** Rotations below this are treated as noise and only the translation is applied */
const ROTATION_EPSILON = (0.1 * Math.PI) / 180;

/** Move (and rotate, when needed) the elements by the fitted rigid transform */
const applyTransformToElements = (
  transform: AlignmentTransform,
  elements: SVGGraphicsElement[],
  batchCmd: IBatchCommand,
): void => {
  const { angle, tx, ty } = transform;

  if (elements.length === 0) return;

  if (Math.abs(angle) < ROTATION_EPSILON) {
    const moveCmd = moveElements(
      elements.map(() => tx),
      elements.map(() => ty),
      elements,
      false,
    );

    if (moveCmd) batchCmd.addSubCommand(moveCmd);

    return;
  }

  const angleDeg = (angle * 180) / Math.PI;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dxList: number[] = [];
  const dyList: number[] = [];

  // a rigid motion decomposes into rotating each element around its own center
  // (the center is invariant since elements rotate about their bbox center)
  // plus moving that center to its transformed position
  elements.forEach((element) => {
    const bbox = getBBox(element);
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    dxList.push(cos * cx - sin * cy + tx - cx);
    dyList.push(sin * cx + cos * cy + ty - cy);
    setRotationAngle(element, getRotationAngle(element) + angleDeg, { parentCmd: batchCmd });
  });

  const moveCmd = moveElements(dxList, dyList, elements, false);

  if (moveCmd) batchCmd.addSubCommand(moveCmd);
};

/**
 * Generate the final output of the print and cut flow as one undoable command:
 * a new cutting layer holding the cut lines moved by the stored alignment
 * transform, with all original layers hidden so a normal export only executes
 * the cut. The user's design layers are otherwise untouched — a single undo
 * restores the document exactly.
 */
export const generateAlignedCutLayer = (): void => {
  const lang = i18n.lang.print_and_cut;
  const state = usePrintAndCutStore.getState();
  const { alignmentTransform, contourElements, contourLayerName, contourPathD, contourSource } = state;
  const gridOffsets = getGridOffsets(state);
  const batchCmd = new history.BatchCommand('Print and Cut');

  selectionManager.clearSelection();

  // a repeat run re-aligns a new sheet: drop the previously generated cutting
  // layer(s) so exactly one remains, rather than stacking mis-aligned copies
  const previousCutLayers = getGeneratedCutLayers();

  previousCutLayers.forEach((layer) => {
    deleteLayerByName(getLayerName(layer), { parentCmd: batchCmd });
  });

  // removeGroup only detaches the dom node, so layerManager still maps the old
  // name; without this resync createLayer sees it as taken and appends " (1)"
  if (previousCutLayers.length > 0) layerManager.identifyLayers();

  const originalLayers = layerManager.getAllLayers();
  const insertedElements: SVGGraphicsElement[] = [];
  // layer-mode cut geometry serialized into the saved config, so a resumed run
  // is independent of later edits to the source layer
  let frozenContourElements: null | string[] = null;
  const offsetDxList: number[] = [];
  const offsetDyList: number[] = [];
  const { layer: newLayer, name: newLayerName } = createLayer(lang.cutting_layer_name, {
    hexCode: CUT_COLOR,
    initConfig: true,
    parentCmd: batchCmd,
  });

  // tag it so the next run can find and replace it, and the resume preview can exclude it
  newLayer.setAttribute(PRINT_AND_CUT_LAYER_ATTR, '1');

  const registerElement = (element: SVGGraphicsElement, dx: number, dy: number) => {
    batchCmd.addSubCommand(new history.InsertElementCommand(element));
    updateElementColor(element);
    insertedElements.push(element);
    offsetDxList.push(dx);
    offsetDyList.push(dy);
  };

  if (contourSource === 'outline' && contourPathD) {
    gridOffsets.forEach(({ dx, dy }) => {
      const cutPath = svgCanvas.addSvgElementFromJson({
        attr: { d: contourPathD, fill: 'none', 'fill-opacity': '0', id: svgCanvas.getNextId(), stroke: '#000' },
        curStyles: false,
        element: 'path',
      }) as SVGPathElement;

      svgCanvas.pathActions.fixEnd(cutPath);
      registerElement(cutPath, dx, dy);
    });
  } else if (contourSource === 'layer' && contourLayerName) {
    // the geometry frozen at the first Finish wins over the live layer: a
    // resumed run must cut what was printed, even if the layer changed since
    const sourceElements = getContourElements(contourElements, contourLayerName);

    frozenContourElements = contourElements ?? sourceElements.map((element) => element.outerHTML);

    gridOffsets.forEach(({ dx, dy }) => {
      sourceElements.forEach((element) => {
        const clone = element.cloneNode(true) as SVGGraphicsElement;

        clone.setAttribute('id', svgCanvas.getNextId());
        newLayer.appendChild(clone);
        registerElement(clone, dx, dy);
      });
    });
    // the cut runs with the source layer's parameters, not the defaults
    cloneLayerConfig(newLayerName, contourLayerName);
  }

  // move each copy to its grid position, then apply the sheet alignment
  if (offsetDxList.some((dx, index) => dx !== 0 || offsetDyList[index] !== 0)) {
    const moveCmd = moveElements(offsetDxList, offsetDyList, insertedElements, false);

    if (moveCmd) batchCmd.addSubCommand(moveCmd);
  }

  if (alignmentTransform) applyTransformToElements(alignmentTransform, insertedElements, batchCmd);

  // hide the originals so a normal export only executes the cutting layer;
  // setVisible is a no-op for layers that are already hidden
  originalLayers.forEach((layer) => {
    layer.setVisible(false, { parentCmd: batchCmd });
  });

  layerManager.identifyLayers();
  useLayerStore.getState().forceUpdate();
  selectionManager.clearSelection();

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);

  // persist the reusable configuration so the next printed sheet can skip the
  // PDF-generation steps and resume straight at camera alignment (also written
  // into the .beam file's miscData on save)
  if (state.fullBBox) {
    const { gridColumns, gridGapMm, gridRows, markPositions, offsetDistance, orientation, paperKey } = state;

    setPrintAndCutConfig({
      contourElements: frozenContourElements,
      contourLayerName,
      contourPathD,
      contourSource,
      // the laid out box (design plus the cut layer), so a resumed run reproduces
      // the same sheet without re-reading a layer that may have changed since
      fullBBox: state.fullBBox,
      gridColumns,
      gridGapMm,
      gridRows,
      markPositions,
      offsetDistance,
      orientation,
      paperKey,
      // captured when the flow was entered, while the design was still visible;
      // a resumed run carries the original snapshot through unchanged
      printingContentsElements: state.printingContentsElements,
    });
  }
};
