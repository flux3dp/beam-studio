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
import { MouseButtons } from '@core/app/constants/mouse-constants';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import { getMouseMode, setCursor, setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { cloneSelectedElements, hasClipboardData } from '@core/app/svgedit/operations/clipboard';
import createNewText from '@core/app/svgedit/text/createNewText';
import textEdit from '@core/app/svgedit/text/textedit';
import touchEvents from '@core/app/svgedit/touchEvents';
import workareaManager from '@core/app/svgedit/workarea';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import TopBarHintsController from '@core/app/views/beambox/TopBar/contexts/TopBarHintsController';
import * as TutorialController from '@core/app/views/tutorials/tutorialController';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { setupPreviewMode } from '@core/helpers/device/camera/previewMode';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isWeb from '@core/helpers/is-web';
import * as LayerHelper from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { IPoint, IRect } from '@core/interfaces/ISVGCanvas';

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
let initBBox = {};
let startMouseX = 0;
let startMouseY = 0;
let selectedBBox: IRect | null = null;
let justSelected: null | SVGElement = null;
let angleOffset = 90;
let currentBoundingBox = Array.of<IPoint>();

const checkShouldIgnore = () => ObjectPanelController.getActiveKey() && navigator.maxTouchPoints > 1;
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
  if (checkShouldIgnore() || svgCanvas.spaceKey || evt.button === MouseButtons.Mid) return;

  // Check if the element in the clipboard can be pasted
  hasClipboardData().then((paste) => {
    workareaEvents.emit('update-context-menu', { paste });
  });

  const currentShape = svgCanvas.getCurrentShape();
  const zoom = workareaManager.zoomRatio;
  let selectedElements = svgCanvas.getSelectedElems();
  const started = svgCanvas.getStarted();
  const svgRoot = svgCanvas.getRoot();
  const rightClick = evt.button === MouseButtons.Right;
  let currentMode = getMouseMode();
  let extensionResult = null;

  svgCanvas.setRootScreenMatrix(($('#svgcontent')[0] as any).getScreenCTM().inverse());

  const pt = getEventPoint(evt);
  let { x, y } = pt;

  startMouseX = x * zoom;
  startMouseY = y * zoom;
  moved = false;

  mouseSelectModeCmds.length = 0;

  if (svgCanvas.getCurrentConfig().gridSnapping) {
    x = svgedit.utilities.snapToGrid(x);
    y = svgedit.utilities.snapToGrid(y);
  }

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

  extensionResult = svgCanvas.runExtensions('checkMouseTarget', { mouseTarget }, true);

  if (extensionResult) {
    let currentStarted = svgCanvas.getStarted();

    $.each(extensionResult, (_, r) => {
      currentStarted = currentStarted || r?.started;
    });
    svgCanvas.unsafeAccess.setStarted(currentStarted);

    if (currentStarted && currentMode !== 'path') {
      console.log('extension ate the mouseDown event');

      return;
    }
  }

  if (presprayArea.checkMouseTarget(mouseTarget)) setMouseMode('drag-prespray-area');

  if (rotaryAxis.checkMouseTarget(mouseTarget)) setMouseMode('drag-rotary-axis');

  svgCanvas.unsafeAccess.setStartTransform(mouseTarget.getAttribute('transform'));
  currentMode = getMouseMode();

  switch (currentMode) {
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
        mouseTargetObjectLayer?.elem &&
        mouseTargetObjectLayer?.elem?.getAttribute('display') !== 'none' &&
        !mouseTargetObjectLayer.elem.getAttribute('data-lock');

      if (mouseTarget !== svgRoot && (isElemTempGroup || layerSelectable)) {
        // Mouse down on element
        if (!selectedElements.includes(mouseTarget)) {
          if (!evt.shiftKey) svgCanvas.clearSelection(true);

          if (navigator.maxTouchPoints > 1 && ['MacOS', 'others'].includes(window.os)) {
            // in touchable mobiles, allow multiselect if click on non selected element
            // if user doesn't multiselect, select [justSelected] in mouseup
            setMouseMode('multiselect');
            setRubberBoxStart(startMouseX, startMouseY);
          } else {
            svgCanvas.addToSelection([mouseTarget]);
            selectedElements = svgCanvas.getSelectedElems();

            if (selectedElements.length > 1) {
              svgCanvas.tempGroupSelectedElements();
              selectedElements = svgCanvas.getSelectedElems();
            }
          }

          justSelected = mouseTarget;
          svgCanvas.pathActions.clear();
        } else if (evt.shiftKey) {
          if (mouseTarget === svgCanvas.getTempGroup()) {
            const elemToRemove = svgCanvas.getMouseTarget(evt, false);

            svgCanvas.removeFromTempGroup(elemToRemove);
            selectedElements = svgCanvas.getSelectedElems();
          } else {
            svgCanvas.clearSelection();
            selectedElements = svgCanvas.getSelectedElems();
          }
        }

        if (!rightClick) {
          if (evt.altKey) {
            const cmd = (await cloneSelectedElements(0, 0, { addToHistory: false }))?.cmd;

            selectedElements = svgCanvas.getSelectedElems();

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
              LayerPanelController.setSelectedLayers([targetLayer.title]);
            }
          }
        }
      } else if (mouseTarget === svgRoot && !rightClick) {
        // Mouse down on svg root
        svgCanvas.clearSelection();
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
      const selectBox = document.getElementById(`selectedBox_${mouseTarget.id}`);

      initBBox = svgedit.utilities.getBBox(selectBox);

      const bb: Record<string, number> = {};

      $.each(initBBox, (key, val) => {
        bb[key] = val / workareaManager.zoomRatio;
      });
      initBBox = mouseTarget.tagName === 'use' ? svgCanvas.getSvgRealLocation(mouseTarget) : bb;
      // append three dummy transforms to the tlist so that
      // we can translate,scale,translate in mousemove

      initResizeTransform(mouseTarget);

      if (svgedit.browser.supportsNonScalingStroke()) {
        const delayedStroke = (ele: SVGElement) => {
          const strokeValue = ele.getAttributeNS(null, 'stroke');

          ele.removeAttributeNS(null, 'stroke');

          // Re-apply stroke after delay. Anything higher than 1 seems to cause flicker
          if (strokeValue !== null) {
            setTimeout(() => {
              ele.setAttributeNS(null, 'stroke', strokeValue);
            }, 0);
          }
        };

        mouseTarget.style.vectorEffect = 'non-scaling-stroke';
        delayedStroke(mouseTarget);

        const elements = mouseTarget.getElementsByTagName('*') as HTMLCollectionOf<SVGElement>;

        for (const element of elements) {
          element.style.vectorEffect = 'non-scaling-stroke';
          delayedStroke(element);
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
      svgCanvas.selectOnly([newRect], true);
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
      svgCanvas.selectOnly([newLine], true);
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
      svgCanvas.selectOnly([newEllipse], true);
      break;
    case 'text':
      svgCanvas.unsafeAccess.setStarted(true);
      createNewText(x, y, { isToSelect: true });
      break;
    case 'polygon':
      // Polygon is created in ext-polygon.js
      TopBarHintsController.setHint('POLYGON');
      break;
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
      if (!svgCanvas.getTempGroup()) {
        svgCanvas.undoMgr.beginUndoableChange('transform', selectedElements);
      }

      break;
    case 'drag-prespray-area':
      svgCanvas.unsafeAccess.setStarted(true);
      svgCanvas.clearSelection();
      presprayArea.startDrag();
      break;
    case 'drag-rotary-axis':
      svgCanvas.unsafeAccess.setStarted(true);
      svgCanvas.clearSelection();
      rotaryAxis.mouseDown();
      break;
    default:
      // This could occur in an extension
      break;
  }

  extensionResult = svgCanvas.runExtensions(
    'mouseDown',
    { event: evt, ObjectPanelController, selectedElements, start_x: startX, start_y: startY },
    true,
  );

  if (selectedElements?.[0]) selectedBBox = svgCanvas.getSvgRealLocation(selectedElements[0]);
  else selectedBBox = null;

  $.each(extensionResult, (_, r) => {
    if (r?.started) svgCanvas.unsafeAccess.setStarted(true);
  });
};

const onResizeMouseMove = (evt: MouseEvent, selected: SVGElement, x: number, y: number) => {
  const currentConfig = svgCanvas.getCurrentConfig();
  const svgRoot = svgCanvas.getRoot();
  const resizeMode = svgCanvas.getCurrentResizeMode();
  const transforms = svgedit.transformlist.getTransformList(selected);
  const hasMatrix = svgedit.math.hasMatrixTransform(transforms);
  const box = hasMatrix ? initBBox : svgedit.utilities.getBBox(selected);
  const isUnfixedResize = (selected.getAttribute('data-ratiofixed') === 'true') === evt.shiftKey;
  const angle = svgedit.utilities.getRotationAngle(selected);
  let { height, width, x: left, y: top } = box;

  if (currentConfig.gridSnapping) {
    x = svgedit.utilities.snapToGrid(x);
    y = svgedit.utilities.snapToGrid(y);
    height = svgedit.utilities.snapToGrid(height);
    width = svgedit.utilities.snapToGrid(width);
  }

  if (svgCanvas.isAutoAlign && isUnfixedResize && !angle) {
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

  // update the transform list with translate,scale,translate
  const translateOrigin = svgRoot.createSVGTransform();
  const scale = svgRoot.createSVGTransform();
  const translateBack = svgRoot.createSVGTransform();

  if (currentConfig.gridSnapping) {
    left = svgedit.utilities.snapToGrid(left);
    top = svgedit.utilities.snapToGrid(top);
    tx = svgedit.utilities.snapToGrid(tx);
    ty = svgedit.utilities.snapToGrid(ty);
  }

  const isRatioFixed = ObjectPanelController.getDimensionValues('isRatioFixed') ? 1 : 0;

  translateOrigin.setTranslate(-(left + tx), -(top + ty));

  if (isRatioFixed ^ (evt.shiftKey ? 1 : 0)) {
    if (sx === 1) sx = sy;
    else sy = sx;
  }

  scale.setScale(sx, sy);
  translateBack.setTranslate(left + tx, top + ty);

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

      svgedit.recalculate.recalculateDimensions(selected);
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
  const currentConfig = svgCanvas.getCurrentConfig();
  const selectedElements = svgCanvas.getSelectedElems();
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

  svgCanvas.clearAlignLines();

  if (!started) {
    if (svgCanvas.isAutoAlign && currentMode === 'path') {
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

  if (currentConfig.gridSnapping) {
    x = svgedit.utilities.snapToGrid(x);
    y = svgedit.utilities.snapToGrid(y);
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

        if (currentConfig.gridSnapping) {
          dx = svgedit.utilities.snapToGrid(dx);
          dy = svgedit.utilities.snapToGrid(dy);
        }

        let current = { x, y };

        if (evt.shiftKey) {
          const xya = svgedit.math.snapToAngle(startX, startY, x, y);

          // update input coords for getMatchedDiffFromBBox
          current = xya;
          dx = xya.x - startX;
          dy = xya.y - startY;
        }

        if (svgCanvas.isAutoAlign) {
          const diff = getMatchedDiffFromBBox(currentBoundingBox, current, { x: startX, y: startY });

          dx = diff.x;
          dy = diff.y;
        }

        if (dx !== 0 || dy !== 0) {
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
    case 'text':
      svgedit.utilities.assignAttributes(shape, { x, y }, 1000);
      break;
    case 'line':
      if (currentConfig.gridSnapping) {
        x = svgedit.utilities.snapToGrid(x);
        y = svgedit.utilities.snapToGrid(y);
      }

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

      if (currentConfig.gridSnapping) {
        w = svgedit.utilities.snapToGrid(w);
        h = svgedit.utilities.snapToGrid(h);
        newX = svgedit.utilities.snapToGrid(newX);
        newY = svgedit.utilities.snapToGrid(newY);
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
      if (currentConfig.gridSnapping) {
        x = svgedit.utilities.snapToGrid(x);
        y = svgedit.utilities.snapToGrid(y);
      }

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
      box = svgedit.utilities.getBBox(selected);

      cx = box.x + box.width / 2;
      cy = box.y + box.height / 2;

      const matrix = svgedit.math.getMatrix(selected);
      const center = svgedit.math.transformPoint(cx, cy, matrix);

      cx = center.x;
      cy = center.y;
      angle = (Math.atan2(cy - y, cx - x) * (180 / Math.PI) - angleOffset) % 360;

      if (currentConfig.gridSnapping) {
        angle = svgedit.utilities.snapToGrid(angle);
      }

      if (evt.shiftKey) {
        // restrict rotations to nice angles (WRS)
        const snap = 45;

        angle = Math.round(angle / snap) * snap;
      }

      svgCanvas.setRotationAngle(angle < -180 ? 360 + angle : angle, true);
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
    default:
      break;
  }

  svgCanvas.runExtensions('mouseMove', {
    event: evt,
    mouse_x: mouseX,
    mouse_y: mouseY,
    ObjectPanelController,
    selected,
  });
};

// - in create mode, the element's opacity is set properly, we create an InsertElementCommand
// and store it on the Undo stack
// - in move/resize mode, the element's attributes which were affected by the move/resize are
// identified, a ChangeElementCommand is created and stored on the stack for those attrs
// this is done in when we recalculate the selected dimensions()

const mouseUp = async (evt: MouseEvent, blocked = false) => {
  svgCanvas.clearAlignLines();

  const rightClick = evt.button === MouseButtons.Right;

  if (checkShouldIgnore() || rightClick) return;

  const started = svgCanvas.getStarted();
  const currentMode = getMouseMode();
  const currentShape = svgCanvas.getCurrentShape();
  const zoom = workareaManager.zoomRatio;
  let selectedElements = svgCanvas.getSelectedElems();
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

  // TODO: Make true when in multi-unit mode
  const useUnit = false;

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

  switch (currentMode) {
    case 'curve-engraving':
      cleanUpRubberBox();

      if (startX !== realX && startY !== realY) {
        const { dpmm } = constant;
        const bboxX = Math.min(startX, realX) / dpmm;
        const bboxY = Math.min(startY, realY) / dpmm;
        const width = Math.abs(startX - realX) / dpmm;
        const height = Math.abs(startY - realY) / dpmm;

        curveEngravingModeController.setArea({ height, width, x: bboxX, y: bboxY });
      }

      return;
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
          ['MacOS', 'others'].includes(window.os) &&
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

            return !(layerElem.getAttribute('data-lock') || layerElem.getAttribute('display') === 'none');
          });

          selectedElements = intersectedElements;
        }

        if (selectedElements.length) {
          // if there are intersected elements, select one of them as current layer
          tempLayer = selectedElements.map((elem) => LayerHelper.getObjectLayer(elem)?.title).find(Boolean);
          layerManager.setCurrentLayer(tempLayer!);
        }

        svgCanvas.selectOnly(selectedElements);

        if (selectedElements.length > 1) {
          svgCanvas.tempGroupSelectedElements();
          svgEditor.updateContextPanel();
        } else if (tempLayer) {
          LayerPanelController.setSelectedLayers([tempLayer]);
        }
      }

      cleanUpRubberBox();

      if (selectedElements.length) {
        const targetLayer = LayerHelper.getObjectLayer(selectedElements[0]);
        const currentLayer = layerManager.getCurrentLayerElement();

        if (targetLayer && !selectedElements.includes(targetLayer.elem) && targetLayer.elem !== currentLayer) {
          layerManager.setCurrentLayer(targetLayer.title);
          LayerPanelController.setSelectedLayers([targetLayer.title]);
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

          if (selectedElements[0].nodeName === 'path' && selectedElements[1] == null) {
            // if it was a path
            svgCanvas.pathActions.select(selectedElements[0]);
          } else if (evt.shiftKey) {
            // else, if it was selected and this is a shift-click, remove it from selection
            if (tempJustSelected !== t) {
              svgCanvas.removeFromSelection([t as SVGElement]);
            }
          }
        } // no change in mouse position

        // Remove non-scaling stroke
        if (svgedit.browser.supportsNonScalingStroke()) {
          const elem = selectedElements[0];

          if (elem) {
            elem.removeAttribute('style');
            svgedit.utilities.walkTree(elem, (el: Element) => {
              el.removeAttribute('style');
            });
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

        svgCanvas.addCommandToHistory(batchCmd);
      } else if (mouseSelectModeCmds.length === 1) {
        svgCanvas.addCommandToHistory(mouseSelectModeCmds[0]);
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
      svgCanvas.selectOnly([element]);
      svgCanvas.textActions.start(element);
      break;
    case 'polygon':
      // Polygon creation is in ext-polygon.js
      TopBarHintsController.removeHint();
      break;
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
      const tempGroup = svgCanvas.getTempGroup();

      if (tempGroup) {
        const cmd = svgCanvas.pushGroupProperties(tempGroup, true);

        if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      } else {
        const cmd = svgCanvas.undoMgr.finishUndoableChange();

        if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      }

      if (!batchCmd.isEmpty()) svgCanvas.addCommandToHistory(batchCmd);

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
      // This could occur in an extension
      break;
  }

  const extResult = svgCanvas.runExtensions(
    'mouseUp',
    { event: evt, isContinuousDrawing, mouse_x: mouseX, mouse_y: mouseY },
    true,
  );

  let startedFlag = svgCanvas.getStarted();

  $.each(extResult, (_, r: any) => {
    if (r) {
      keep = r.keep || keep;
      element = r.element;
      startedFlag = r.started || startedFlag;
    }
  });

  svgCanvas.unsafeAccess.setStarted(startedFlag);

  if (!keep && element) {
    svgCanvas.getCurrentDrawing().releaseId(svgCanvas.getId());
    svgedit.transformlist.removeElementFromListMap(element);
    svgCanvas.selectorManager.releaseSelector(element);
    element.parentNode.removeChild(element);
    element = null;
    t = evt.target;
    svgCanvas.clearSelection();

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
      svgCanvas.selectOnly([t], true);
    }
  } else if (element) {
    svgCanvas.addedNew = true;

    if (useUnit) svgedit.units.convertAttrs(element);

    if (element.getAttribute('opacity') !== currentShape.opacity) element.setAttribute('opacity', currentShape.opacity);

    element.setAttribute('style', 'pointer-events:inherit');
    svgCanvas.cleanupElement(element);
    svgCanvas.addCommandToHistory(new history.InsertElementCommand(element));

    if (!isContinuousDrawing) {
      if (currentMode === 'textedit') {
        svgCanvas.selectorManager.requestSelector(element)?.show(true);
      } else if (element.parentNode) {
        svgCanvas.selectOnly([element], true);
        svgCanvas.call('changed', [element]);
      }
    }
  }

  if (isContinuousDrawing && getMouseMode() !== 'textedit') svgCanvas.clearSelection();

  svgCanvas.unsafeAccess.setStartTransform(null);
};

const mouseEnter = (evt: MouseEvent) => {
  if (svgCanvas.getStarted() && (evt.buttons & MouseButtons.Mid) === 0) mouseUp(evt);
};

const dblClick = (evt: MouseEvent) => {
  const currentMode = getMouseMode();
  const parent = (evt.target as SVGElement).parentNode as SVGElement;

  // Do nothing if already in current group
  if (parent === svgCanvas.getCurrentGroup()) return;

  const mouseTarget: Element = svgCanvas.getMouseTarget(evt);
  const { tagName } = mouseTarget;

  if (!['preview_color', 'text', 'textedit'].includes(currentMode)) {
    if (tagName === 'text') {
      svgCanvas.textActions.select(mouseTarget);
    } else if (mouseTarget.getAttribute('data-textpath-g')) {
      const clickOnText = ['text', 'textPath'].includes((evt.target as SVGElement).tagName);
      const text = mouseTarget.querySelector('text');
      const path = mouseTarget.querySelector('path');

      if (text && clickOnText) {
        svgCanvas.selectorManager.releaseSelector(mouseTarget);
        svgCanvas.textActions.select(text);
      } else if (path) {
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
  } else if (currentMode === 'preview_color') {
    canvasEvents.setColorPreviewing(false);
  }

  // Reset context
  if (svgCanvas.getCurrentGroup()) svgCanvas.leaveContext();
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
