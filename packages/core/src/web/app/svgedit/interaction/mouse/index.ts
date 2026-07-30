/* eslint-disable no-case-declarations */
import { match, P } from 'ts-pattern';

import constant from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import { boundaryDrawer } from '@core/app/actions/canvas/boundaryDrawer';
import canvasEvents from '@core/app/actions/canvas/canvasEvents';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import * as TutorialController from '@core/app/components/tutorials/tutorialController';
import { MouseButtons } from '@core/app/constants/mouse-constants';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import { getMouseMode, setCursor, setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { templateModes, withinInteractionModes } from '@core/app/stores/interactionModeStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { contentLibraryManager } from '@core/helpers/contentLibrary/manager';
import { setupPreviewMode } from '@core/helpers/device/camera/previewMode';
import { ControlType } from '@core/helpers/element/editable/base';
import { parseEditableInfo } from '@core/helpers/element/editable/getter';
import { isElemLocked } from '@core/helpers/element/lock';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import isWeb from '@core/helpers/is-web';
import { checkSelectable } from '@core/helpers/layer/checkSelectable';
import * as LayerHelper from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { IPoint, IRect } from '@core/interfaces/ISVGCanvas';

import history from '../../history/history';
import undoManager from '../../history/undoManager';
import layerManager from '../../layer/layerManager';
import { cloneSelectedElements, hasClipboardData } from '../../operations/clipboard';
import { polygonMouseDown, polygonMouseMove, polygonMouseUp } from '../../polygon';
import selectionManager from '../../selection';
import { resizeSelector } from '../../selector';
import createNewText from '../../text/createNewText';
import {
  clearFitTextResizeRecords,
  createNewFitText,
  generateFitTextResizeCommand,
  handleFitTextTransform,
  recordFitTextAttributesBeforeResize,
  setFitTextBBox,
} from '../../text/fitText';
import textEdit, { isFitText } from '../../text/textedit';
import touchEvents from '../../touchEvents';
import { recalculateDimensions, setStartTransform } from '../../transform/recalculate';
import { setRotationAngle } from '../../transform/rotation';
import { getBBox } from '../../utils/getBBox';
import workareaManager from '../../workarea';
import wheelEventHandlerGenerator from '../wheelEventHandler';

import { getEventPoint } from './utils/getEventPoint';
import { getMatchedDiffFromBBox } from './utils/getMatchedDiffFromBBox';
import { initResizeTransform } from './utils/initResizeTransform';
import { setRubberBoxStart } from './utils/setRubberBoxStart';

let svgEditor: ISVGEditor;
let svgCanvas: ISVGCanvas;

const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');
const autoFocusEventEmitter = eventEmitterFactory.createEventEmitter('auto-focus');

getSVGAsync(({ Canvas, Editor }) => {
  svgCanvas = Canvas;
  svgEditor = Editor;
});

const { svgedit } = window;
const SENSOR_AREA_RADIUS = 10;

let startX = 0;
let startY = 0;
let moved = false;
// Record the bbox before resize to calculate desire transform matrix
let resizeInitBBox: { height: number; width: number; x: number; y: number } = { height: 0, width: 0, x: 0, y: 0 };
let startMouseX = 0;
let startMouseY = 0;
let selectedBBox: IRect | null = null;
let justSelected: null | SVGElement = null;
let angleOffset = 90;
let currentBoundingBox = Array.of<IPoint>();

/**
 * Whether `control` may still be exercised on `elem` through a canvas gesture.
 *
 * Only the template modes enforce the per-element locks here; 'editor' and 'project' keep their
 * previous unrestricted canvas behaviour, matching the drag / resize / rotate guards in this file.
 * Reads the element directly rather than `useSelectedElementStore`, because a double click can
 * target an element that is not (yet) the current selection.
 */
const isControlEditable = (elem: Element, control: ControlType): boolean =>
  !withinInteractionModes(templateModes) || parseEditableInfo(elem)[control] === true;

/**
 * Which axes the current selection may still be translated along.
 *
 * Mirrors the per-element position locks; outside the template modes nothing is locked. For a
 * `line` both endpoints must be free on an axis, otherwise dragging would deform it.
 */
const getMovableAxes = (selected?: Element | null): { x: boolean; y: boolean } => {
  if (!withinInteractionModes(templateModes)) return { x: true, y: true };

  const editableInfo = useSelectedElementStore.getState().editableInfo;
  const isLine = selected?.tagName === 'line';
  const isFree = (start: ControlType, end: ControlType) =>
    Boolean(editableInfo[start]?.value) && (!isLine || Boolean(editableInfo[end]?.value));

  return {
    x: isFree(ControlType.POSITION_X, ControlType.POSITION_X2),
    y: isFree(ControlType.POSITION_Y, ControlType.POSITION_Y2),
  };
};

const findAndDrawAlignPoints = (x: number, y: number) => {
  const {
    farthest: { x: fx, y: fy },
    nearest: { x: nx, y: ny },
  } = svgCanvas.findMatchedAlignPoints(x, y);

  if (!nx && !ny) return [x, y];

  svgCanvas.drawAlignLine(x, y, nx, ny);

  const startPoint = { x: nx?.x ?? ny?.x ?? x, y: ny?.y ?? nx?.y ?? y };

  svgCanvas.drawAlignLine(startPoint.x, startPoint.y, fx, fy, 10);

  return [nx?.x ?? x, ny?.y ?? y];
};

const mouseSelectModeCmds = Array.of<ICommand>();
// - when we are in a create mode, the element is added to the canvas
// but the action is not recorded until mousing up
// - when we are in select mode, select the element, remember the position
// and do nothing else
const mouseDown = async (evt: MouseEvent) => {
  if (svgCanvas.spaceKey || evt.button === MouseButtons.Mid) return;

  // Check if the element in the clipboard can be pasted
  hasClipboardData().then((paste) => {
    workareaEvents.emit('update-context-menu', { paste });
  });

  const currentShape = svgCanvas.getCurrentShape();
  const zoom = workareaManager.zoomRatio;
  let selectedElements = selectionManager.getSelectedElements();
  const started = svgCanvas.getStarted();
  const svgRoot = svgCanvas.getRoot();
  const rightClick = evt.button === MouseButtons.Right;
  let currentMode = getMouseMode();

  svgCanvas.setRootScreenMatrix(($('#svgcontent')[0] as any).getScreenCTM().inverse());

  const pt = getEventPoint(evt);
  let { x, y } = pt;

  startMouseX = x * zoom;
  startMouseY = y * zoom;
  moved = false;

  mouseSelectModeCmds.length = 0;

  startX = x;
  startY = y;

  evt.preventDefault();
  (document.activeElement as HTMLElement).blur();

  if (rightClick) {
    if (started) return;

    if (currentMode === 'path') {
      svgCanvas.pathActions.finishPath(false);
      setMouseMode('select');

      return;
    }

    svgEditor.clickSelect(false);
    svgCanvas.setLastClickPoint(pt);

    return;
  }

  let mouseTarget = svgCanvas.getMouseTarget(evt);

  if (mouseTarget.tagName === 'a' && mouseTarget.childNodes.length === 1) {
    mouseTarget = mouseTarget.firstChild as SVGElement;
  } else if (boundaryDrawer.checkMouseTarget(mouseTarget)) {
    mouseTarget = svgRoot;
  }

  if (mouseTarget === svgCanvas.selectorManager.selectorParentGroup && selectedElements[0]) {
    // if it is a selector grip, then it must be a single element selected,
    // set the mouseTarget to that and update the mode to rotate/resize
    const grip = evt.target as SVGElement;
    const gripType = $.data(grip, 'type');

    if (gripType === 'rotate') {
      // rotating
      angleOffset = +grip.getAttribute('data-angleOffset')! || 90;
      setMouseMode('rotate');
    } else if (gripType === 'resize') {
      // resizing
      let cx = +grip.getAttribute('cx')!;
      let cy = +grip.getAttribute('cy')!;

      const selectorGroup = grip.parentNode?.parentNode;

      if (selectorGroup) {
        const matrix = svgedit.math.getMatrix(selectorGroup);

        if (!svgedit.math.isIdentity(matrix)) ({ x: cx, y: cy } = svgedit.math.transformPoint(cx, cy, matrix));
      }

      startX = cx / zoom;
      startY = cy / zoom;

      setMouseMode('resize');
      svgCanvas.setCurrentResizeMode($.data(grip, 'dir'));
    }

    [mouseTarget] = selectedElements;

    console.log('svgCanvas gripping', getMouseMode(), svgCanvas.getCurrentResizeMode());
  } else if (svgCanvas.textActions.isEditing) {
    setMouseMode('textedit');
  }

  if (presprayArea.checkMouseTarget(mouseTarget)) setMouseMode('drag-prespray-area');

  if (rotaryAxis.checkMouseTarget(mouseTarget)) setMouseMode('drag-rotary-axis');

  setStartTransform(mouseTarget.getAttribute('transform'));
  currentMode = getMouseMode();

  switch (currentMode) {
    case 'pick': {
      setMouseMode('select');

      const pickTarget = svgCanvas.getMouseTarget(evt);

      if (pickTarget && pickTarget !== svgRoot) {
        // Same gate as every other selection path: never reach into a locked or hidden layer.
        const pickTargetLayer = LayerHelper.getObjectLayer(pickTarget as SVGElement);
        const pickable =
          pickTargetLayer?.elem && checkSelectable(pickTargetLayer.elem) && !isElemLocked(pickTarget as SVGElement);

        if (pickable) await contentLibraryManager.addContentFromCanvas(pickTarget as SVGGraphicsElement);
      }

      return;
    }
    case 'auto-focus':
      autoFocusEventEmitter.emit('pin', pt);

      return;
    case 'preview':
    case 'pre_preview':
      svgCanvas.unsafeAccess.setStarted(true);
      setRubberBoxStart(startMouseX, startMouseY);

      return;
    case 'select':
    case 'multiselect':
      svgCanvas.unsafeAccess.setStarted(true);
      svgCanvas.setCurrentResizeMode('none');

      if (rightClick) svgCanvas.unsafeAccess.setStarted(false);

      const mouseTargetObjectLayer = LayerHelper.getObjectLayer(mouseTarget);
      const isElemTempGroup = mouseTarget.getAttribute('data-tempgroup') === 'true';
      const layerSelectable =
        mouseTargetObjectLayer?.elem && checkSelectable(mouseTargetObjectLayer.elem) && !isElemLocked(mouseTarget);

      if (mouseTarget !== svgRoot && (isElemTempGroup || layerSelectable)) {
        // Mouse down on element
        if (!selectedElements.includes(mouseTarget)) {
          if (!evt.shiftKey) selectionManager.clearSelection(true);

          if (navigator.maxTouchPoints > 1 && ['MacOS', 'others'].includes(getOS())) {
            // in touchable mobiles, allow multiselect if click on non selected element
            // if user doesn't multiselect, select [justSelected] in mouseup
            setMouseMode('multiselect');
            setRubberBoxStart(startMouseX, startMouseY);
          } else {
            selectionManager.addToSelection([mouseTarget]);
            selectedElements = selectionManager.getSelectedElements();

            if (selectedElements.length > 1) {
              selectionManager.tempGroupSelectedElements();
              selectedElements = selectionManager.getSelectedElements();
            }
          }

          justSelected = mouseTarget;
          svgCanvas.pathActions.clear();
        } else if (evt.shiftKey) {
          if (selectionManager.isTempGroup(mouseTarget)) {
            const elemToRemove = svgCanvas.getMouseTarget(evt, false);

            selectionManager.removeFromTempGroup(elemToRemove);
            selectedElements = selectionManager.getSelectedElements();
          } else {
            selectionManager.clearSelection();
            selectedElements = selectionManager.getSelectedElements();
          }
        }

        if (!rightClick) {
          if (evt.altKey) {
            const cmd = (await cloneSelectedElements(0, 0, { addToHistory: false }))?.cmd;

            selectedElements = selectionManager.getSelectedElements();

            if (cmd && !cmd.isEmpty()) mouseSelectModeCmds.push(cmd);
          }

          for (const element of selectedElements) {
            // insert a dummy transform so if the element(s) are moved it will have
            // a transform to use for its translate
            if (!element) continue;

            const transforms = svgedit.transformlist.getTransformList(element);

            if (transforms.numberOfItems) transforms.insertItemBefore(svgRoot.createSVGTransform(), 0);
            else transforms.appendItem(svgRoot.createSVGTransform());
          }
        }

        // clear layer selection
        if (layerSelectable && !rightClick && !evt.shiftKey) {
          if (selectedElements.length && currentMode === 'select') {
            const targetLayer = LayerHelper.getObjectLayer(selectedElements[0]);
            const currentLayer = layerManager.getCurrentLayerElement();

            if (targetLayer && !selectedElements.includes(targetLayer.elem) && targetLayer.elem !== currentLayer) {
              layerManager.setCurrentLayer(targetLayer.title);
              useLayerStore.getState().setSelectedLayers([targetLayer.title]);
            }
          }
        }
      } else if (mouseTarget === svgRoot && !rightClick) {
        // Mouse down on svg root
        selectionManager.clearSelection();
        setMouseMode('multiselect');
        setRubberBoxStart(startMouseX, startMouseY);
      }

      currentBoundingBox = svgCanvas.getSelectedElementsAlignPoints();

      break;
    case 'curve-engraving':
      if (!rightClick) {
        svgCanvas.unsafeAccess.setStarted(true);
        setRubberBoxStart(startMouseX, startMouseY);
      }

      break;
    case 'resize':
      svgCanvas.unsafeAccess.setStarted(true);

      // Getting the BBox from the selection box, since we know we
      // want to orient around it
      resizeInitBBox = getBBox(mouseTarget);
      // append three dummy transforms to the tlist so that
      // we can translate,scale,translate in mousemove

      initResizeTransform(mouseTarget);

      const fitTexts = [mouseTarget, ...mouseTarget.querySelectorAll('text')].filter((e) =>
        isFitText(e),
      ) as SVGTextElement[];

      fitTexts.forEach(recordFitTextAttributesBeforeResize);

      if (svgedit.browser.supportsNonScalingStroke()) {
        const handleElementStrokeBeforeResize = (elem: SVGElement) => {
          if (elem.tagName === 'g' || elem.getAttribute('vector-effect') === 'non-scaling-stroke') {
            return;
          }

          const originalStrokeWidth = Number.parseFloat(elem.getAttribute('stroke-width') || '1');

          // need non-scaling-stroke for stroke width not to be scaled during resize
          // adjust the stroke-width based on zoom level to keep the visual stroke width unchanged
          elem.style.cssText =
            `vector-effect: non-scaling-stroke; stroke-width: ${originalStrokeWidth * zoom}px;` + elem.style.cssText;
        };

        handleElementStrokeBeforeResize(mouseTarget);

        const elements = mouseTarget.querySelectorAll('*');

        for (const element of elements) {
          handleElementStrokeBeforeResize(element as SVGElement);
        }
      }

      break;
    case 'rect':
      svgCanvas.unsafeAccess.setStarted(true);
      startX = x;
      startY = y;

      const newRect = svgCanvas.addSvgElementFromJson({
        attr: {
          fill: 'none',
          'fill-opacity': 0,
          height: 0,
          id: svgCanvas.getNextId(),
          opacity: currentShape.opacity,
          stroke: '#000',
          width: 0,
          x,
          y,
        },
        curStyles: false,
        element: 'rect',
      });

      updateElementColor(newRect);
      selectionManager.selectOnly([newRect], true);
      break;
    case 'line':
      svgCanvas.unsafeAccess.setStarted(true);

      const newLine = svgCanvas.addSvgElementFromJson<SVGLineElement>({
        attr: {
          fill: 'none',
          id: svgCanvas.getNextId(),
          opacity: currentShape.opacity,
          stroke: '#000',
          'stroke-dasharray': currentShape.stroke_dasharray,
          'stroke-linecap': currentShape.stroke_linecap,
          'stroke-linejoin': currentShape.stroke_linejoin,
          'stroke-width': 1,
          style: 'pointer-events:none',
          x1: x,
          x2: x,
          y1: y,
          y2: y,
        },
        curStyles: false,
        element: 'line',
      });

      updateElementColor(newLine);
      selectionManager.selectOnly([newLine], true);
      canvasEvents.addLine(newLine);
      break;
    case 'ellipse':
      svgCanvas.unsafeAccess.setStarted(true);

      const newEllipse = svgCanvas.addSvgElementFromJson({
        attr: {
          cx: x,
          cy: y,
          fill: 'none',
          'fill-opacity': 0,
          id: svgCanvas.getNextId(),
          opacity: currentShape.opacity,
          rx: 0,
          ry: 0,
          stroke: '#000',
        },
        curStyles: false,
        element: 'ellipse',
      });

      updateElementColor(newEllipse);
      selectionManager.selectOnly([newEllipse], true);
      break;
    case 'text':
      svgCanvas.unsafeAccess.setStarted(true);
      createNewText(x, y, { isToSelect: true });
      break;
    case 'fit-text':
      svgCanvas.unsafeAccess.setStarted(true);
      break;
    case 'polygon': {
      svgCanvas.unsafeAccess.setStarted(true);

      const poly = polygonMouseDown(startX, startY);

      updateElementColor(poly);
      selectionManager.selectOnly([poly], true);
      break;
    }
    case 'path':
    case 'pathedit':
      if (svgCanvas.isAutoAlign) {
        [startX, startY] = findAndDrawAlignPoints(startX, startY);
      }

      startX *= zoom;
      startY *= zoom;

      const res = svgCanvas.pathActions.mouseDown(evt, mouseTarget, startX, startY) as null | { x: number; y: number };

      if (res?.x) {
        const { x: newX, y: newY } = res;

        startX = newX;
        startY = newY;
        svgCanvas.unsafeAccess.setStarted(true);
        canvasEvents.addPath();
      }

      break;
    case 'textedit':
      startX *= zoom;
      startY *= zoom;
      svgCanvas.textActions.mouseDown(evt, mouseTarget, startX, startY);
      svgCanvas.unsafeAccess.setStarted(true);

      break;
    case 'rotate':
      svgCanvas.unsafeAccess.setStarted(true);

      // we are starting an undoable change (a drag-rotation)
      if (!selectionManager.isMultiSelecting) {
        svgCanvas.undoMgr.beginUndoableChange('transform', selectedElements);
      }

      break;
    case 'drag-prespray-area':
      svgCanvas.unsafeAccess.setStarted(true);
      selectionManager.clearSelection();
      presprayArea.startDrag();
      break;
    case 'drag-rotary-axis':
      svgCanvas.unsafeAccess.setStarted(true);
      selectionManager.clearSelection();
      rotaryAxis.mouseDown();
      break;
    default:
      break;
  }

  if (selectedElements?.[0]) selectedBBox = getBBox(selectedElements[0]);
  else selectedBBox = null;
};

const onResizeMouseMove = (evt: MouseEvent, selected: SVGElement, x: number, y: number) => {
  const svgRoot = svgCanvas.getRoot();
  const resizeMode = svgCanvas.getCurrentResizeMode();
  const transforms = svgedit.transformlist.getTransformList(selected);
  const hasMatrix = svgedit.math.hasMatrixTransform(transforms);
  const box = resizeInitBBox;
  const fitTexts = [selected, ...selected.querySelectorAll('text')].filter((e) => isFitText(e)) as SVGTextElement[];
  const fixedByFitText = resizeMode.length > 1 && fitTexts.length > 0;
  const isFreeResize = !fixedByFitText && ObjectPanelController.getDimensionValues('isRatioFixed') === evt.shiftKey;
  const angle = svgedit.utilities.getRotationAngle(selected);
  let { height, width, x: left, y: top } = box;
  const editableInfo = useSelectedElementStore.getState().editableInfo;

  if (svgCanvas.isAutoAlign && isFreeResize && !angle) {
    let [inputX, inputY] = [x, y];

    if (!resizeMode.includes('n') && !resizeMode.includes('s')) inputY = startY;

    if (!resizeMode.includes('e') && !resizeMode.includes('w')) inputX = startX;

    [x, y] = findAndDrawAlignPoints(inputX, inputY);
  }

  let dx = x - startX;
  let dy = y - startY;

  // if rotated, adjust the dx,dy values
  if (angle) {
    const r = Math.sqrt(dx * dx + dy * dy);
    const theta = Math.atan2(dy, dx) - angle * (Math.PI / 180.0);

    dx = r * Math.cos(theta);
    dy = r * Math.sin(theta);
  }

  // if not stretching in y direction, set dy to 0
  // if not stretching in x direction, set dx to 0
  if (!resizeMode.includes('n') && !resizeMode.includes('s')) dy = 0;

  if (!resizeMode.includes('e') && !resizeMode.includes('w')) dx = 0;

  let tx = 0;
  let ty = 0;
  let sy = height ? (height + dy) / height : 1;
  let sx = width ? (width + dx) / width : 1;

  // if we are dragging on the north side, then adjust the scale factor and ty
  if (resizeMode.includes('n')) {
    sy = height ? (height - dy) / height : 1;
    ty = height;
  }

  // if we dragging on the west side, then adjust the scale factor and tx
  if (resizeMode.includes('w')) {
    sx = width ? (width - dx) / width : 1;
    tx = width;
  }

  // Three rules can apply to the same drag and all of them have to survive, so they are layered in
  // a fixed order instead of any one of them overwriting the scale the others computed:
  //   1. anchor (here): in template modes a position-locked axis grows from its center, so that
  //      axis' delta counts double — both of its edges move. Free axes stay corner-anchored.
  //   2. ratio (below, after this block): a locked ratio — shift / `isRatioFixed`, and always when
  //      `fixedByFitText` — makes both axes share the scale of the axis the pointer is dragging.
  //      Sharing the (possibly doubled) factor is what keeps the aspect ratio exact; each axis
  //      still uses its own anchor.
  //   3. fit text: a one-direction resize of a fit text never reaches the transform at all — it
  //      goes to the setFitTextBBox branch, which applies the same center anchoring itself.
  if (withinInteractionModes(templateModes)) {
    if (!editableInfo[ControlType.POSITION_X]?.value) {
      tx = width / 2;
      sx = width ? (resizeMode.includes('w') ? (width - 2 * dx) / width : (width + 2 * dx) / width) : 1;
    }

    if (!editableInfo[ControlType.POSITION_Y]?.value) {
      ty = height / 2;
      sy = height ? (resizeMode.includes('n') ? (height - 2 * dy) / height : (height + 2 * dy) / height) : 1;
    }
  }

  // update the transform list with translate,scale,translate
  const translateOrigin = svgRoot.createSVGTransform();
  const scale = svgRoot.createSVGTransform();
  const translateBack = svgRoot.createSVGTransform();

  translateOrigin.setTranslate(-(left + tx), -(top + ty));

  if (!isFreeResize) {
    // Rule 2: drive the shared scale from the axis the pointer is actually dragging. Deciding by
    // the delta (and by a usable width) rather than by `sx === 1` keeps this right when rule 1
    // already rewrote sx — a center-anchored axis can legitimately sit at scale 1 mid-drag.
    if (dx === 0 || !width) sx = sy;
    else sy = sx;
  }

  scale.setScale(sx, sy);
  translateBack.setTranslate(left + tx, top + ty);

  if (resizeMode.length > 1 || !isFitText(selected)) {
    if (hasMatrix) {
      const diff = angle ? 1 : 0;

      transforms.replaceItem(translateOrigin, 2 + diff);
      transforms.replaceItem(scale, 1 + diff);
      transforms.replaceItem(translateBack, diff);
    } else {
      const N = transforms.numberOfItems;

      transforms.replaceItem(translateBack, N - 3);
      transforms.replaceItem(scale, N - 2);
      transforms.replaceItem(translateOrigin, N - 1);
    }
  } else {
    // Special Handle for Fit Text one-direction resize, we will directly update the bbox instead of applying a transform
    const newWidth = Math.abs(width * sx);
    const newHeight = Math.abs(height * sy);
    let newLeft = left;
    let newTop = top;
    // In template modes a locked position axis anchors the bbox at its center; every other case
    // (all editor/project resizing) uses the standard corner-anchored placement below.
    const inTemplateModes = withinInteractionModes(templateModes);

    if (inTemplateModes && !editableInfo[ControlType.POSITION_X]?.value) {
      newLeft = left + (width - newWidth) / 2;
    } else if (sx > 0) {
      if (resizeMode.includes('w')) newLeft = left + width - newWidth;
    } else {
      if (resizeMode.includes('w')) newLeft = left + width;
      else newLeft = left - newWidth;
    }

    if (inTemplateModes && !editableInfo[ControlType.POSITION_Y]?.value) {
      newTop = top + (height - newHeight) / 2;
    } else if (sy > 0) {
      if (resizeMode.includes('n')) newTop = top + height - newHeight;
    } else {
      if (resizeMode.includes('n')) newTop = top + height;
      else newTop = top - newHeight;
    }

    setFitTextBBox(
      selected as SVGTextElement,
      ['e', 'w'].includes(resizeMode) ? { width: newWidth, x: newLeft } : { height: newHeight, y: newTop },
      { addToHistory: false, oldBBox: box },
    );
  }

  const graphs = ['rect', 'path', 'use', 'polygon', 'image', 'ellipse', 'g'] as const;

  // Bounding box calculation
  match(selected.tagName)
    .with(P.union(...graphs), (tagName) => {
      const dCx = tx === 0 ? 0.5 * width * (sx - 1) : 0.5 * width * (1 - sx);
      const dCy = ty === 0 ? 0.5 * height * (sy - 1) : 0.5 * height * (1 - sy);
      const theta = angle * (Math.PI / 180);
      const cx = left + width / 2 + dCx * Math.cos(theta) - dCy * Math.sin(theta);
      const cy = top + height / 2 + dCx * Math.sin(theta) + dCy * Math.cos(theta);
      const newWidth = Math.abs(width * sx);
      const newHeight = Math.abs(height * sy);
      const newLeft = cx - 0.5 * newWidth;
      const newTop = cy - 0.5 * newHeight;

      if (tagName === 'ellipse') {
        ObjectPanelController.updateDimensionValues({ cx, cy, rx: newWidth / 2, ry: newHeight / 2 });
      } else {
        ObjectPanelController.updateDimensionValues({ height: newHeight, width: newWidth, x: newLeft, y: newTop });
      }
    })
    .otherwise(() => {});

  if (['path, ellipse', 'rect'].includes(selected.tagName)) {
    if ((width < 0.01 && Math.abs(width * sx) >= 0.01) || (height < 0.01 && Math.abs(height * sy) >= 0.01)) {
      console.log('recalculate', width, height, width * sx, height * sy);

      recalculateDimensions(selected);
      initResizeTransform(selected);

      startX = x;
      startY = y;
    }
  }

  svgCanvas.selectorManager.requestSelector(selected)?.resize();

  if (svgedit.utilities.getElem('text_cursor')) svgCanvas.textActions.init();
};

// in this function we do not record any state changes yet (but we do update
// any elements that are still being created, moved or resized on the svgCanvas)
const mouseMove = (evt: MouseEvent) => {
  if (evt.button === MouseButtons.Mid || svgCanvas.spaceKey) return;

  const started = svgCanvas.getStarted();
  const currentMode = getMouseMode();
  const zoom = workareaManager.zoomRatio;
  const selectedElements = selectionManager.getSelectedElements();
  const rubberBox = svgCanvas.getRubberBox();
  const svgRoot = svgCanvas.getRoot();

  svgCanvas.setRootScreenMatrix(($('#svgcontent')[0] as any).getScreenCTM().inverse());

  let cx;
  let cy;
  let dx: number;
  let dy: number;
  let angle;
  let box;
  let selected = selectedElements[0];
  const pt = getEventPoint(evt);
  const mouseX = pt.x * zoom;
  const mouseY = pt.y * zoom;
  const shape = svgedit.utilities.getElem(svgCanvas.getId());
  const realX = pt.x;
  const realY = pt.y;
  let x = realX;
  let y = realY;

  // Clamp movement on locked axes, for the drag path only. 'select' is the sole mode that reads
  // x/y as a translation of the selected element; every other mode must keep the raw coordinates:
  // - 'rotate' derives the angle from atan2(cy - y, cx - x) — a clamped x/y yields a wrong angle.
  // - 'resize' needs a non-zero delta for onResizeMouseMove's resize-from-center handling.
  // - the creation modes ('line'/'rect'/'ellipse'/'path'/'polygon') and the prespray/rotary drags
  //   build geometry unrelated to the selected element, so its lock flags must not apply.
  // The drag itself is enforced by the dx/dy clamp in `case 'select'`; clamping here as well keeps
  // shift-snap and auto-align from proposing movement along the locked axis in the first place.
  const movableAxes = getMovableAxes(selectedElements[0]);

  if (currentMode === 'select') {
    if (!movableAxes.x) x = startX;

    if (!movableAxes.y) y = startY;
  }

  svgCanvas.clearAlignLines();

  if (!started) {
    if (svgCanvas.isAutoAlign && currentMode === 'path') {
      // Use the raw pointer position, not the clamped x/y: the clamp above only makes sense while
      // dragging, and with `started === false` startX/startY still hold the previous mousedown's
      // values, which would draw the align points at a stale location in template modes.
      findAndDrawAlignPoints(realX, realY);
    }

    //
    if (svgCanvas.sensorAreaInfo) {
      if (currentMode === 'select') {
        const dist = Math.hypot(svgCanvas.sensorAreaInfo.x - mouseX, svgCanvas.sensorAreaInfo.y - mouseY);
        const workarea = document.getElementById('workarea');

        if (workarea) {
          if (dist < SENSOR_AREA_RADIUS) {
            setCursor('move');
          } else if (workarea.style.cursor === 'move') {
            setCursor('auto', 'move');
          }
        }
      }
    }

    return;
  }

  const updateRubberBox = () => {
    svgedit.utilities.assignAttributes(
      rubberBox,
      {
        height: Math.abs(mouseY - startMouseY),
        width: Math.abs(mouseX - startMouseX),
        x: Math.min(startMouseX, mouseX),
        y: Math.min(startMouseY, mouseY),
      },
      100,
    );
  };

  evt.preventDefault();

  let tlist;

  switch (currentMode) {
    case 'select':
      // we temporarily use a translate on the element(s) being dragged
      // this transform is removed upon mousing up and the element is
      // relocated to the new location
      if (selectedElements[0] !== null) {
        dx = x - startX;
        dy = y - startY;

        let current = { x, y };

        if (evt.shiftKey) {
          const xya = svgedit.math.snapToAngle(startX, startY, x, y);

          // update input coords for getMatchedDiffFromBBox
          current = xya;
          dx = xya.x - startX;
          dy = xya.y - startY;
        }

        // Auto-align proposes a new position and draws the align lines as a side effect, so skip it
        // outright once the element is locked on both axes — it can never follow the proposal and
        // the lines would just be misleading noise.
        if (svgCanvas.isAutoAlign && (movableAxes.x || movableAxes.y)) {
          const diff = getMatchedDiffFromBBox(currentBoundingBox, current, { x: startX, y: startY }, movableAxes);

          dx = diff.x;
          dy = diff.y;
        }

        if (!movableAxes.x) dx = 0;

        if (!movableAxes.y) dy = 0;

        if (dx !== 0 || dy !== 0) {
          // Emit once, only on the first actual movement of this gesture (`moved` flips to true
          // below). A plain click without movement never emits objectDragStart.
          if (!moved) workareaEvents.emit('objectDragStart');

          for (const selected of selectedElements) {
            if (!selected) break;

            // update the dummy transform in our transform list
            // to be a translate
            const xform = svgRoot.createSVGTransform();

            tlist = svgedit.transformlist.getTransformList(selected);
            // Note that if Webkit and there's no ID for this
            // element, the dummy transform may have gotten lost.
            // This results in unexpected behaviour

            xform.setTranslate(dx, dy);

            if (tlist.numberOfItems) tlist.replaceItem(xform, 0);
            else tlist.appendItem(xform);

            svgCanvas.selectorManager.requestSelector(selected)?.resize();
          }

          if (svgCanvas.sensorAreaInfo) {
            svgCanvas.sensorAreaInfo.dx = dx * zoom;
            svgCanvas.sensorAreaInfo.dy = dy * zoom;
          }

          if (selectedBBox) {
            if (selectedElements[0].tagName === 'ellipse') {
              ObjectPanelController.updateDimensionValues({
                cx: selectedBBox.x + selectedBBox.width / 2 + dx,
                cy: selectedBBox.y + selectedBBox.height / 2 + dy,
              });
            } else {
              ObjectPanelController.updateDimensionValues({ x: selectedBBox.x + dx, y: selectedBBox.y + dy });
            }
          }

          moved = true;
        }
      }

      break;
    case 'pre_preview':
    case 'preview':
    case 'multiselect':
    case 'curve-engraving':
      updateRubberBox();
      // Stop adding elements to selection when mouse moving
      // Select all intersected elements when mouse up
      break;
    case 'resize':
      // we track the resize bounding box and translate/scale the selected element
      // while the mouse is down, when mouse goes up, we use this to recalculate
      // the shape's coordinates
      onResizeMouseMove(evt, selected, x, y);
      break;
    case 'line':
      let x2 = x;
      let y2 = y;

      if (evt.shiftKey) {
        const xya = svgedit.math.snapToAngle(startX, startY, x2, y2, Math.PI / 4);

        x2 = xya.x;
        y2 = xya.y;
      } else if (svgCanvas.isAutoAlign) {
        [x2, y2] = findAndDrawAlignPoints(x2, y2);
      }

      svgCanvas.selectorManager.requestSelector(selected)?.resize();
      shape.setAttributeNS(null, 'x2', x2);
      shape.setAttributeNS(null, 'y2', y2);
      ObjectPanelController.updateDimensionValues({ x2, y2 });
      break;
    case 'rect':
      const isSquare = evt.shiftKey;
      let w = Math.abs(x - startX);
      let h = Math.abs(y - startY);
      let newX;
      let newY;

      if (isSquare) {
        w = Math.max(w, h);
        h = w;
        newX = startX < x ? startX : startX - w;
        newY = startY < y ? startY : startY - h;
      } else {
        newX = Math.min(startX, x);
        newY = Math.min(startY, y);
      }

      if (!isSquare && svgCanvas.isAutoAlign) {
        [newX, newY] = findAndDrawAlignPoints(newX, newY);

        // because we don't want to change the width and height of the element
        w = Math.max(Math.abs(newX - startX), Math.abs(newX - x));
        h = Math.max(Math.abs(newY - startY), Math.abs(newY - y));
      }

      svgedit.utilities.assignAttributes(shape, { height: h, width: w, x: newX, y: newY }, 1000);
      ObjectPanelController.updateDimensionValues({ height: h, width: w, x: newX, y: newY });
      svgCanvas.selectorManager.requestSelector(selected)?.resize();

      break;
    case 'ellipse':
      const c = $(shape).attr(['cx', 'cy']) as any;

      cx = c.cx;
      cy = c.cy;

      if (!evt.shiftKey && svgCanvas.isAutoAlign) {
        [x, y] = findAndDrawAlignPoints(x, y);
      }

      const rx = Math.abs(x - cx);
      const ry = Math.abs(evt.shiftKey ? x - cx : y - cy);

      shape.setAttributeNS(null, 'rx', rx);
      shape.setAttributeNS(null, 'ry', ry);

      ObjectPanelController.updateDimensionValues({ rx, ry });
      svgCanvas.selectorManager.requestSelector(selected)?.resize();
      break;
    // update path stretch line coordinates
    case 'path':
    case 'pathedit':
      if (evt.shiftKey) {
        const { path } = svgedit.path;
        const x1 = path?.dragging ? path.dragging[0] : startX;
        const y1 = path?.dragging ? path.dragging[1] : startY;
        const xya = svgedit.math.snapToAngle(x1, y1, x, y, Math.PI / 4);

        x = xya.x;
        y = xya.y;
      } else if (svgCanvas.isAutoAlign) {
        [x, y] = findAndDrawAlignPoints(x, y);
      }

      x *= zoom;
      y *= zoom;

      if (rubberBox && rubberBox.getAttribute('display') !== 'none') {
        updateRubberBox();
      }

      svgCanvas.pathActions.mouseMove(x, y);

      break;
    case 'textedit':
      svgCanvas.textActions.mouseMove(mouseX, mouseY);
      break;
    case 'rotate':
      // Rotation is lockable per element in template modes. Selector.updateNonEditableGripVisibility
      // already hides the rotate grips, but don't depend on grip visibility alone — mirror the
      // position/size clamps and refuse to apply the angle here as well. Bailing out (rather than
      // never entering 'rotate' mode in mouseDown) keeps the gesture from falling through to a drag,
      // and mouseUp's empty batch command is discarded by its own isEmpty() check.
      if (
        withinInteractionModes(templateModes) &&
        !useSelectedElementStore.getState().editableInfo[ControlType.ROTATION]?.value
      ) {
        break;
      }

      box = getBBox(selected, { ignoreTransform: true });

      cx = box.x + box.width / 2;
      cy = box.y + box.height / 2;

      const matrix = svgedit.math.getMatrix(selected);
      const center = svgedit.math.transformPoint(cx, cy, matrix);

      cx = center.x;
      cy = center.y;
      angle = (Math.atan2(cy - y, cx - x) * (180 / Math.PI) - angleOffset) % 360;

      if (evt.shiftKey) {
        // restrict rotations to nice angles (WRS)
        const snap = 45;

        angle = Math.round(angle / snap) * snap;
      }

      setRotationAngle(selected, angle < -180 ? 360 + angle : angle, { addToHistory: false });
      resizeSelector(selected);
      ObjectPanelController.updateDimensionValues({
        rotation: angle < -180 ? 360 + angle : angle,
      });

      if (svgedit.utilities.getElem('text_cursor')) {
        svgCanvas.textActions.init();
      }

      break;
    case 'drag-prespray-area':
      dx = x - startX;
      dy = y - startY;
      presprayArea.drag(dx, dy);
      break;
    case 'drag-rotary-axis':
      rotaryAxis.mouseMove(y);
      break;
    case 'polygon':
      polygonMouseMove(x, y, evt, selected as SVGPolygonElement);

      const bbox = getBBox(selected);

      ObjectPanelController.updateDimensionValues({ height: bbox.height, width: bbox.width, x: bbox.x, y: bbox.y });
      break;
    default:
      break;
  }
};

// - in create mode, the element's opacity is set properly, we create an InsertElementCommand
// and store it on the Undo stack
// - in move/resize mode, the element's attributes which were affected by the move/resize are
// identified, a ChangeElementCommand is created and stored on the stack for those attrs
// this is done in when we recalculate the selected dimensions()

const mouseUp = async (evt: MouseEvent, blocked = false) => {
  svgCanvas.clearAlignLines();

  // Pair with objectDragStart: only emit end if this gesture actually dragged (`moved`). A plain
  // click or a right-click that never moved emits neither.
  if (moved) workareaEvents.emit('objectDragEnd');

  const rightClick = evt.button === MouseButtons.Right;

  if (rightClick) return;

  const started = svgCanvas.getStarted();
  const currentMode = getMouseMode();
  const currentShape = svgCanvas.getCurrentShape();
  const zoom = workareaManager.zoomRatio;
  let selectedElements = selectionManager.getSelectedElements();
  const rubberBox = svgCanvas.getRubberBox();

  if (blocked) svgCanvas.unsafeAccess.setStarted(false);

  const tempJustSelected = justSelected;

  justSelected = null;

  if (!started) return;

  const pt = getEventPoint(evt);
  const { x, y } = pt;
  const realX = x;
  const realY = y;
  const mouseX = x * zoom;
  const mouseY = y * zoom;

  let element = svgedit.utilities.getElem(svgCanvas.getId());
  let keep = false;

  svgCanvas.unsafeAccess.setStarted(false);

  let attrs;
  let t;

  const isContinuousDrawing = useGlobalPreferenceStore.getState()['continuous_drawing'];

  const doPreview = () => {
    const callback = () => {
      if (TutorialController.getNextStepRequirement() === TutorialConstants.PREVIEW_PLATFORM) {
        TutorialController.handleNextStep();
      }
    };

    if (PreviewModeController.isPreviewMode) {
      if (startX === realX && startY === realY) {
        PreviewModeController.preview(realX, realY, { callback, last: true });
      } else {
        PreviewModeController.previewRegion(startX, startY, realX, realY, { callback });
      }
    }
  };

  const cleanUpRubberBox = () => {
    if (!rubberBox) return;

    rubberBox.setAttribute('display', 'none');
    svgCanvas.clearBoundingBox();
  };

  const getDrawnBBox = (inMM = false) => {
    const { dpmm } = constant;
    let bboxX = Math.min(startX, realX);
    let bboxY = Math.min(startY, realY);
    let width = Math.abs(startX - realX);
    let height = Math.abs(startY - realY);

    if (inMM) {
      bboxX /= dpmm;
      bboxY /= dpmm;
      width /= dpmm;
      height /= dpmm;
    }

    return { height, width, x: bboxX, y: bboxY };
  };

  switch (currentMode) {
    case 'curve-engraving': {
      cleanUpRubberBox();

      const { height, width, x: bboxX, y: bboxY } = getDrawnBBox(true);

      if (width > 0 && height > 0) {
        curveEngravingModeController.setArea({ height, width, x: bboxX, y: bboxY });
      }

      return;
    }
    case 'preview':
    case 'pre_preview':
      cleanUpRubberBox();
      setMouseMode('select');

      if (currentMode === 'pre_preview') setupPreviewMode({ callback: () => doPreview() });
      else doPreview();

      return;
    case 'resize':
    case 'multiselect':
      if (currentMode === 'multiselect') {
        let tempLayer: string | undefined;

        svgCanvas.clearBoundingBox();

        if (
          navigator.maxTouchPoints > 1 &&
          ['MacOS', 'others'].includes(getOS()) &&
          Math.hypot(mouseX - startMouseX, mouseY - startMouseY) < 1
        ) {
          // in touchable mobile, if almost not moved, select mousedown element
          selectedElements = [tempJustSelected].filter(Boolean);
        } else {
          const intersectedElements = svgCanvas.getIntersectionList().filter((elem) => {
            const layer = LayerHelper.getObjectLayer(elem);

            if (!layer) {
              return false;
            }

            const layerElem = layer.elem;

            return checkSelectable(layerElem) && !isElemLocked(elem);
          });

          selectedElements = intersectedElements;
        }

        if (selectedElements.length) {
          // if there are intersected elements, select one of them as current layer
          tempLayer = selectedElements.map((elem) => LayerHelper.getObjectLayer(elem)?.title).find(Boolean);
          layerManager.setCurrentLayer(tempLayer!);
        }

        selectionManager.selectOnly(selectedElements);

        if (selectedElements.length > 1) {
          selectionManager.tempGroupSelectedElements();
          svgEditor.updateContextPanel();
        } else if (tempLayer) {
          useLayerStore.getState().setSelectedLayers([tempLayer]);
        }
      }

      cleanUpRubberBox();

      if (selectedElements.length) {
        const targetLayer = LayerHelper.getObjectLayer(selectedElements[0]);
        const currentLayer = layerManager.getCurrentLayerElement();

        if (targetLayer && !selectedElements.includes(targetLayer.elem) && targetLayer.elem !== currentLayer) {
          layerManager.setCurrentLayer(targetLayer.title);
          useLayerStore.getState().setSelectedLayers([targetLayer.title]);
        }
      }
    // eslint-disable-next-line no-fallthrough
    case 'select':
      if (selectedElements[0]) {
        // if we only have one selected element
        if (!selectedElements[1]) {
          // set our current stroke/fill properties to the element's
          const selected = selectedElements[0];
          const updateCurrentStyle = (attrs: string[]) => {
            for (const attr of attrs) {
              const value = selected.getAttribute(attr);

              if (value !== null) svgCanvas.setCurrentStyleProperties(attr, value);
            }
          };

          match(selected.tagName)
            .with(P.union('g', 'use', 'image', 'foreignObject'), () => {})
            .otherwise(() => {
              updateCurrentStyle([
                'fill',
                'fill-opacity',
                'stroke',
                'stroke-opacity',
                'stroke-width',
                'stroke-dasharray',
                'stroke-linejoin',
                'stroke-linecap',
              ]);
            });

          if (selected.tagName === 'text') {
            const elem = selected as SVGTextElement;

            textEdit.updateCurText({
              font_family: textEdit.getFontFamily(elem),
              font_postscriptName: textEdit.getFontPostscriptName(elem),
              font_size: textEdit.getFontSize(elem),
            });
          }

          svgCanvas.selectorManager.requestSelector(selected)?.show(true);
        }

        // always recalculate dimensions to strip off stray identity transforms
        const cmd = svgCanvas.recalculateAllSelectedDimensions(true);

        if (cmd && !cmd.isEmpty()) {
          const noRedo = currentMode === 'multiselect' || (currentMode === 'select' && !moved);

          if (!noRedo) mouseSelectModeCmds.push(cmd);
        }

        // if it was being dragged/resized
        if (mouseX !== startMouseX || mouseY !== startMouseY) {
          if (currentMode === 'resize') {
            const allSelectedUses = Array.of<SVGUseElement>();

            selectedElements.forEach((e) => {
              if (e.tagName === 'use') {
                allSelectedUses.push(e as SVGUseElement);
              } else if (e.tagName === 'g') {
                allSelectedUses.push(...Array.from(e.querySelectorAll('use')));
              }
            });
            SymbolMaker.reRenderImageSymbolArray(allSelectedUses);

            const fitTexts = selectedElements
              .map((elem) => [elem, ...elem.querySelectorAll('text')])
              .flat()
              .filter((e) => isFitText(e)) as SVGTextElement[];

            // TODO: currently handle transform after `recalculateAllSelectedDimensions`, refactor recalculate and handle this in it in the future
            fitTexts.forEach((e) => {
              const resizeCmd = generateFitTextResizeCommand(e);

              if (resizeCmd) mouseSelectModeCmds.push(resizeCmd);

              const transformCmd = handleFitTextTransform(e as SVGTextElement, { addToHistory: false });

              if (transformCmd && !transformCmd.isEmpty()) mouseSelectModeCmds.push(transformCmd);
            });
            clearFitTextResizeRecords();
            ObjectPanelController.updateObjectPanel();
          }

          if (currentMode !== 'multiselect') {
            // Not sure if this is necessary, but multiselect does not need this
            for (const element of selectedElements) {
              if (!element?.firstChild && element?.tagName !== 'use') {
                // Not needed for groups (incorrectly resizes elems), possibly not needed at all?
                svgCanvas.selectorManager.requestSelector(element)?.resize();
              }
            }
          }

          setMouseMode('select');
        } else {
          // no change in position/size, so maybe we should move to pathedit
          setMouseMode('select');
          t = evt.target;

          if (
            selectedElements[0].nodeName === 'path' &&
            selectedElements[1] == null &&
            // Node editing reshapes the path, so it is gated on _SIZE. Without this, clicking a
            // size-locked path twice drops into pathedit, where dragging nodes bypasses every lock.
            isControlEditable(selectedElements[0], ControlType._SIZE)
          ) {
            // if it was a path
            svgCanvas.pathActions.select(selectedElements[0]);
          } else if (evt.shiftKey) {
            // else, if it was selected and this is a shift-click, remove it from selection
            if (tempJustSelected !== t) {
              selectionManager.removeFromSelection([t as SVGElement]);
            }
          }
        } // no change in mouse position

        // Remove non-scaling stroke
        if (svgedit.browser.supportsNonScalingStroke()) {
          const elem = selectedElements[0];

          if (elem) {
            elem.removeAttribute('style');

            for (const el of elem.querySelectorAll('*')) {
              el.removeAttribute('style');
            }
          }
        }

        if (svgCanvas.sensorAreaInfo) {
          svgCanvas.sensorAreaInfo.x += svgCanvas.sensorAreaInfo.dx;
          svgCanvas.sensorAreaInfo.y += svgCanvas.sensorAreaInfo.dy;
          svgCanvas.sensorAreaInfo.dx = 0;
          svgCanvas.sensorAreaInfo.dy = 0;
        }
      } else {
        setMouseMode('select');
      }

      if (mouseSelectModeCmds.length > 1) {
        const batchCmd = new history.BatchCommand('Mouse Event');

        for (const cmd of mouseSelectModeCmds) {
          batchCmd.addSubCommand(cmd);
        }

        undoManager.addCommandToHistory(batchCmd);
      } else if (mouseSelectModeCmds.length === 1) {
        undoManager.addCommandToHistory(mouseSelectModeCmds[0]);
      }

      return;
    case 'line':
      attrs = $(element).attr(['x1', 'x2', 'y1', 'y2']) as any;
      keep = attrs.x1 !== attrs.x2 || attrs.y1 !== attrs.y2;

      if (!isContinuousDrawing) setMouseMode('select');

      break;
    case 'rect':
      attrs = $(element).attr(['width', 'height']) as any;
      keep = attrs.width !== 0 && attrs.height !== 0;

      if (TutorialController.getNextStepRequirement() === TutorialConstants.DRAW_A_RECT && keep) {
        TutorialController.handleNextStep();
        setMouseMode('select');
      } else if (!isContinuousDrawing) {
        setMouseMode('select');
      }

      break;
    case 'ellipse':
      attrs = $(element).attr(['rx', 'ry']) as any;
      keep = attrs.rx > 0 && attrs.ry > 0;

      if (TutorialController.getNextStepRequirement() === TutorialConstants.DRAW_A_CIRCLE && keep) {
        TutorialController.handleNextStep();
        setMouseMode('select');
      } else if (!isContinuousDrawing) {
        setMouseMode('select');
      }

      break;
    case 'text':
      keep = true;
      selectionManager.selectOnly([element]);
      svgCanvas.textActions.start(element);
      break;
    case 'fit-text': {
      element = createNewFitText(x, y, { isToSelect: true });
      keep = true;
      svgCanvas.textActions.start(element);
      break;
    }
    case 'polygon': {
      const polyResult = polygonMouseUp(isContinuousDrawing);

      keep = polyResult.keep;
      element = polyResult.element;
      break;
    }
    case 'path':
      // set element to null here so that it is not removed nor finalized
      element = null;
      // continue to be set to true so that mouseMove happens
      svgCanvas.unsafeAccess.setStarted(true);

      const res = svgCanvas.pathActions.mouseUp(evt, element);

      if (res) {
        element = res.element;
        keep = res.keep;
      }

      break;
    case 'pathedit':
      keep = true;
      element = null;
      svgCanvas.pathActions.mouseUp(evt);
      break;
    case 'textedit':
      keep = false;
      element = null;
      svgCanvas.textActions.mouseUp(evt, mouseX, mouseY);
      break;
    case 'rotate':
      keep = true;
      element = null;
      setMouseMode('select');

      const batchCmd = new history.BatchCommand('Rotate Elements');

      if (selectionManager.isMultiSelecting) {
        const cmd = selectionManager.pushTempGroupProperties();

        if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      } else {
        const cmd = undoManager.finishUndoableChange();

        if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      }

      if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);

      // perform recalculation to weed out any stray identity transforms that might get stuck
      svgCanvas.recalculateAllSelectedDimensions(true);
      svgCanvas.call('changed', selectedElements);
      break;
    case 'drag-prespray-area':
      keep = true;
      element = null;
      setMouseMode('select');
      presprayArea.endDrag();
      break;
    case 'drag-rotary-axis':
      keep = true;
      element = null;
      rotaryAxis.mouseUp();
      setMouseMode('select');
      break;
    case 'preview_color':
      keep = true;
      element = null;
      break;
    default:
      break;
  }

  if (!keep && element) {
    svgCanvas.getCurrentDrawing().releaseId(svgCanvas.getId());
    svgedit.transformlist.removeElementFromListMap(element);
    svgCanvas.selectorManager.releaseSelector(element);
    element.parentNode.removeChild(element);
    element = null;
    t = evt.target;
    selectionManager.clearSelection();

    // if this element is in a group, go up until we reach the top-level group
    // just below the layer groups
    // TODO: once we implement links, we also would have to check for <a> elements
    try {
      while (t.parentNode.parentNode.tagName === 'g') {
        // @ts-expect-error type mismatch
        t = t?.parentNode;
      }
    } catch (err) {
      console.log(t, t?.id, 'has no g parent');
      console.log(err);

      return;
    }

    const isNeedToSelect =
      (currentMode !== 'path' || !svgCanvas.pathActions.hasDrawingPath()) &&
      t.parentNode.id !== 'selectorParentGroup' &&
      t.id !== 'svgcanvas' &&
      t.id !== 'svgRoot';

    // if we are not in the middle of creating a path, and we've clicked on some shape,
    // then go to Select mode.
    // WebKit returns <div> when the canvas is clicked, Firefox/Opera return <svg>
    if (isNeedToSelect) {
      // switch into "select" mode if we've clicked on an element
      setMouseMode('select');
      selectionManager.selectOnly([t], true);
    }
  } else if (element) {
    if (element.getAttribute('opacity') !== currentShape.opacity) element.setAttribute('opacity', currentShape.opacity);

    element.setAttribute('style', 'pointer-events:inherit');
    svgCanvas.cleanupElement(element);

    if (element.tagName !== 'text') {
      // text insert command is created when the text edit mode finishes, to make sure the text is really created (not empty string).
      undoManager.addCommandToHistory(new history.InsertElementCommand(element));
    }

    if (!isContinuousDrawing) {
      if (currentMode === 'textedit') {
        svgCanvas.selectorManager.requestSelector(element)?.show(true);
      } else if (element.parentNode) {
        selectionManager.selectOnly([element], true);
        svgCanvas.call('changed', [element]);
      }
    }
  }

  if (isContinuousDrawing && getMouseMode() !== 'textedit') selectionManager.clearSelection();

  setStartTransform(null);
};

const mouseEnter = (evt: MouseEvent) => {
  if (svgCanvas.getStarted() && (evt.buttons & MouseButtons.Mid) === 0) mouseUp(evt);
};

const dblClick = (evt: MouseEvent) => {
  const currentMode = getMouseMode();
  const mouseTarget: Element = svgCanvas.getMouseTarget(evt);
  const { tagName } = mouseTarget;

  if (!['preview_color', 'text', 'textedit'].includes(currentMode)) {
    if (tagName === 'text') {
      // A locked TEXT_CONTENT disables the panel's text input; without this the same text is still
      // freely editable by double clicking it on the canvas.
      if (!isControlEditable(mouseTarget, ControlType.TEXT_CONTENT)) return;

      svgCanvas.textActions.select(mouseTarget as SVGTextElement);
    } else if (mouseTarget.getAttribute('data-textpath-g')) {
      const clickOnText = ['text', 'textPath'].includes((evt.target as SVGElement).tagName);
      const text = mouseTarget.querySelector('text');
      const path = mouseTarget.querySelector('path');

      // The editable flags live on the textpath <g> (that is what gets selected), not on its
      // inner <text>/<path>.
      if (text && clickOnText) {
        if (!isControlEditable(mouseTarget, ControlType.TEXT_CONTENT)) return;

        svgCanvas.selectorManager.releaseSelector(mouseTarget);
        svgCanvas.textActions.select(text);
      } else if (path) {
        if (!isControlEditable(mouseTarget, ControlType._SIZE)) return;

        svgCanvas.pathActions.toEditMode(path);
      }
    } else if (currentMode === 'pathedit' && mouseTarget.getAttribute('id') === 'svgroot') {
      svgCanvas.pathActions.toSelectMode();
    }
  } else if (currentMode === 'textedit') {
    const curtext = svgCanvas.textActions.getCurtext();

    if (
      curtext === mouseTarget ||
      (mouseTarget?.getAttribute('data-textpath-g') && mouseTarget?.querySelector('text') === curtext)
    ) {
      svgCanvas.textActions.dbClickSelectAll();
    }
  }
};

const registerEvents = () => {
  // Added mouseup to the container here.
  // TODO(codedread): Figure out why after the Closure compiler, the window mouseup is ignored.
  const container = svgCanvas.getContainer();

  // prevent links from being followed in the canvas
  container.addEventListener('click', (e) => e.preventDefault());

  // iPad or other pads
  if (navigator.maxTouchPoints > 1) {
    window.addEventListener('gesturestart', (e) => e.preventDefault());
    window.addEventListener('gesturechange', (e) => e.preventDefault());
    window.addEventListener('gestureend', (e) => e.preventDefault());

    const workarea = document.getElementById('workarea')!;

    touchEvents.setupCanvasTouchEvents(
      container,
      workarea,
      // @ts-expect-error type mismatch
      mouseDown,
      mouseMove,
      mouseUp,
      dblClick,
      (zoom, staticPoint) => workareaManager.zoom(zoom, staticPoint),
    );
  }

  container.addEventListener('mousedown', mouseDown);
  container.addEventListener('mousemove', mouseMove);
  container.addEventListener('mouseup', mouseUp);
  container.addEventListener('mouseenter', mouseEnter);
  container.addEventListener('dblclick', dblClick);

  // Capture context menu position for paste support (especially mobile).
  // On desktop, mouseDown (button=2) already sets lastClickPoint before contextmenu
  // fires; this listener harmlessly overwrites it with the same position.
  // On mobile (iOS synthetic / Android native), there's no preceding mousedown,
  // so this listener is the only source of the position.
  const workarea = document.getElementById('workarea')!;

  workarea.addEventListener('contextmenu', (evt: MouseEvent) => {
    const pt = getEventPoint(evt);

    svgCanvas.setLastClickPoint(pt);
  });

  if (isWeb()) {
    const onWindowScroll = (e: any) => {
      if (e.ctrlKey) e.preventDefault();
    };

    window.addEventListener('wheel', onWindowScroll, { passive: false });
    window.addEventListener('DOMMouseScroll', onWindowScroll, { passive: false });
  }

  if (svgedit.browser.isSafari()) {
    window.addEventListener('gesturestart', (e) => e.preventDefault());
    window.addEventListener('gesturechange', (e) => e.preventDefault());
    window.addEventListener('gestureend', (e) => e.preventDefault());

    let startZoom: number;
    let currentScale = 1;

    container.addEventListener('gesturestart', (e: any) => {
      startZoom = workareaManager.zoomRatio;
      currentScale = e.scale;
    });
    container.addEventListener('gesturechange', ({ clientX, clientY, scale }: any) => {
      if (startZoom && Math.abs(Math.log(currentScale / scale)) >= Math.log(1.05)) {
        workareaManager.zoom(startZoom * scale ** 0.5, { x: clientX, y: clientY });
        currentScale = scale;
      }
    });
  }

  const wheelEventHandler = wheelEventHandlerGenerator(
    () => workareaManager.zoomRatio,
    (ratio, center) => workareaManager.zoom(ratio, center),
    { maxZoom: 20 },
  );

  container.addEventListener('wheel', wheelEventHandler);
};

export const MouseInteraction = {
  register: (canvas: ISVGCanvas): void => {
    svgCanvas = canvas;
    registerEvents();
  },
};
