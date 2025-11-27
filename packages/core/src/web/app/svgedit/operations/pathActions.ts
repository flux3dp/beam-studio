/* eslint-disable no-fallthrough */
import * as paper from 'paper';

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import { type CanvasMouseMode } from '@core/app/stores/canvas/canvasStore';
import { getMouseMode, setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import history from '@core/app/svgedit/history/history';
import PathNodePoint from '@core/app/svgedit/path/PathNodePoint';
import SegmentControlPoint from '@core/app/svgedit/path/SegmentControlPoint';
import selector from '@core/app/svgedit/selector';
import workareaManager from '@core/app/svgedit/workarea';
import * as BezierFitCurve from '@core/helpers/bezier-fit-curve';
import getClipperLib from '@core/helpers/clipper/getClipperLib';
import updateElementColor from '@core/helpers/color/updateElementColor';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import round from '@core/helpers/math/round';
import shortcuts from '@core/helpers/shortcuts';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import type { ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { ISVGPath, ISVGPathSeg } from '@core/interfaces/ISVGPath';
import type ISVGPathElement from '@core/interfaces/ISVGPathElement';

import Path from '../path/Path';
import Segment from '../path/Segment';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

let svgEditor: ISVGEditor;
let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgEditor = globalSVG.Editor;
});

const drawingToolEventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');

const { svgedit } = window;
const { NS } = svgedit;

// Assign ts module to legacy svgedit.path
svgedit.path.ChangeElementCommand = history.ChangeElementCommand;
svgedit.path.SegmentControlPoint = SegmentControlPoint;
svgedit.path.Segment = Segment;
svgedit.path.PathNodePoint = PathNodePoint;
svgedit.path.Path = Path;

// Functions relating to editing path elements
let subpath = false;
let currentPath = null;
let newPoint;
let firstCtrl;
let previousMode: CanvasMouseMode = 'select';
let modeOnMouseDown = '';
let hasMoved = false;
let hasCreatedPoint = false;
let drawnPath: null | SVGPathElement = null;

const wrapPrecision = (data: number[]) => data.map((d) => d.toFixed(5));

// This function converts a polyline (created by the fh_path tool) into
// a path element and coverts every three line segments into a single bezier
// curve in an attempt to smooth out the free-hand
const smoothPolylineIntoPath = (element) => {
  let i;
  const { points } = element;
  const N = points.numberOfItems;

  if (N >= 4) {
    // loop through every 3 points and convert to a cubic bezier curve segment
    //
    // NOTE: this is cheating, it means that every 3 points has the potential to
    // be a corner instead of treating each point in an equal manner. In general,
    // this technique does not look that good.
    //
    // I am open to better ideas!
    //
    // Reading:
    // - http://www.efg2.com/Lab/Graphics/Jean-YvesQueinecBezierCurves.htm
    // - http://www.codeproject.com/KB/graphics/BezierSpline.aspx?msg=2956963
    // - http://www.ian-ko.com/ET_GeoWizards/UserGuide/smooth.htm
    // - http://www.cs.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/Bezier/bezier-der.html
    let cursorPosition = points.getItem(0);
    let prevCtlPt = null;
    let d: any = [];

    d.push(['M', cursorPosition.x.toFixed(5), ',', cursorPosition.y.toFixed(5), ' C'].join(''));
    for (i = 1; i <= N - 4; i += 3) {
      let ct1 = points.getItem(i);
      const ct2 = points.getItem(i + 1);
      const end = points.getItem(i + 2);

      // if the previous segment had a control point, we want to smooth out
      // the control points on both sides
      if (prevCtlPt) {
        const newPoints = svgedit.path.smoothControlPoints(prevCtlPt, ct1, cursorPosition);

        if (newPoints && newPoints.length === 2) {
          const prevArr = d[d.length - 1].split(',');

          prevArr[2] = newPoints[0].x;
          prevArr[3] = newPoints[0].y;
          d[d.length - 1] = prevArr.join(',');
          [, ct1] = newPoints;
        }
      }

      d.push(wrapPrecision([ct1.x, ct1.y, ct2.x, ct2.y, end.x, end.y]).join(','));

      cursorPosition = end;
      prevCtlPt = ct2;
    }
    // handle remaining line segments
    d.push('L');
    while (i < N) {
      const pt = points.getItem(i);

      d.push(wrapPrecision([pt.x, pt.y]).join(','));
      i += 1;
    }
    d = d.join(' ');

    // create new path element
    return svgCanvas.addSvgElementFromJson({
      attr: {
        d,
        fill: 'none',
        id: svgCanvas.getId(),
      },
      curStyles: true,
      element: 'path',
    });
    // No need to call "changed", as this is already done under mouseUp
  }

  return element;
};

const getCurveLocationByPaperjs = (x: number, y: number, elem: SVGPathElement) => {
  const proj = new paper.Project(document.createElement('canvas'));
  const items = proj.importSVG(`<svg>${elem.outerHTML}</svg>`);
  const obj1 = items.children[0] as paper.CompoundPath | paper.Path | paper.Shape;
  const path1 = obj1 instanceof paper.Shape ? obj1.toPath() : obj1.clone();
  const location = path1.getNearestLocation({ x, y });
  const isCompound = location.path.parent instanceof paper.CompoundPath;

  const result = {
    curveIndex: location.curve.index,
    // Hotfix for paperjs behavior, when the path is not a compound path, the path index is 1
    pathIndex: isCompound ? location.path.index : location.path.index - 1,
    point: location.point,
    segmentIndex: location.segment.index,
    time: location.time,
    // raw: location,
  };

  return result;
};

export const finishPath = (toEditMode = true) => {
  svgCanvas.clearAlignLines();

  if (!drawnPath) {
    const pathPointGripContainer = document.getElementById('pathpointgrip_container');

    if (pathPointGripContainer) pathPointGripContainer.remove();

    return;
  }

  const stretchy = document.getElementById('path_stretch_line');
  const id = svgCanvas.getId();

  firstCtrl = null;
  svgCanvas.unsafeAccess.setStarted(false);
  svgedit.path.removePath(id);

  const element = document.getElementById(id) as unknown as SVGElement;

  if (stretchy) stretchy.remove();

  const len = (drawnPath as any).pathSegList.numberOfItems;

  drawnPath = null;

  if (len > 1) {
    element.setAttribute('opacity', String(svgCanvas.getCurrentShape().opacity));
    element.setAttribute('style', 'pointer-events:inherit');
    svgCanvas.cleanupElement(element);
    svgCanvas.addCommandToHistory(new history.InsertElementCommand(element));

    if (toEditMode) {
      svgCanvas.pathActions.toEditMode(element);
      svgCanvas.call('changed', [element]);
    } else {
      const pathPointGripContainer = document.getElementById('pathpointgrip_container');

      if (pathPointGripContainer) pathPointGripContainer.remove();
    }
  } else {
    if (element) element.remove();

    setMouseMode(previousMode);
  }

  shortcuts.off(['Escape']);
  shortcuts.on(['Escape'], window.svgEditor.clickSelect);
};

const toEditMode = (element: Element): void => {
  svgedit.path.path = svgedit.path.getPath(element);

  const isContinuousDrawing = useGlobalPreferenceStore.getState()['continuous_drawing'];

  previousMode = isContinuousDrawing ? getMouseMode() : 'select';
  setMouseMode('pathedit');
  svgCanvas.clearSelection();
  svgedit.path.path.show(true).update();
  svgedit.path.path.oldbbox = svgedit.utilities.getBBox(svgedit.path.path.elem);
  $(svgedit.path.path.elem).attr('cursor', 'copy'); // Set path cursor type
  subpath = false;
};

const toSelectMode = (elem?: Element): void => {
  const selPath = elem === svgedit.path.path.elem;

  setMouseMode(previousMode);

  const currentMode = getMouseMode();

  if (currentMode === 'select') {
    $(svgedit.path.path.elem).attr('cursor', ''); // Unset path cursor type
    drawingToolEventEmitter.emit('SET_ACTIVE_BUTTON', 'Cursor');
  }

  svgedit.path.path.show(false);
  svgedit.path.path.saveSegmentControlPointInfo();
  svgedit.path.path.saveNodeTypeInfo();
  currentPath = false;
  svgCanvas.clearSelection();

  if (svgedit.path.path.matrix) {
    // Rotated, so may need to re-calculate the center
    svgedit.path.recalcRotatedPath();
  }

  if (selPath) {
    if (elem.parentNode?.getAttribute('data-textpath-g')) {
      svgCanvas.call('selected', [elem.parentNode]);
      svgCanvas.addToSelection([elem.parentNode], true);
    } else {
      svgCanvas.call('selected', [elem]);
      svgCanvas.addToSelection([elem], true);
    }
  }

  svgedit.path.path = null;
  svgEditor.updateContextPanel();
};

const mouseDown = (evt: MouseEvent, mouseTarget: SVGElement, startX: number, startY: number) => {
  const currentMode = getMouseMode();
  const currentZoom = workareaManager.zoomRatio;

  svgCanvas.clearAlignLines();

  let x = startX / currentZoom;
  let y = startY / currentZoom;
  let mouseX = startX;
  let mouseY = startY;

  modeOnMouseDown = currentMode;

  if (currentMode === 'path') {
    const isContinuousDrawing = useGlobalPreferenceStore.getState()['continuous_drawing'];

    previousMode = isContinuousDrawing ? 'path' : 'select';

    let stretchy = svgedit.utilities.getElem('path_stretch_line');

    newPoint = [x, y];

    if (svgCanvas.getCurrentConfig().gridSnapping) {
      x = svgedit.utilities.snapToGrid(x);
      y = svgedit.utilities.snapToGrid(y);
      mouseX = svgedit.utilities.snapToGrid(mouseX);
      mouseY = svgedit.utilities.snapToGrid(mouseY);
    }

    if (svgCanvas.isAutoAlign) svgCanvas.addAlignPoint(x, y);

    if (!stretchy) {
      stretchy = document.createElementNS(NS.SVG, 'path');
      svgedit.utilities.assignAttributes(stretchy, {
        fill: 'none',
        id: 'path_stretch_line',
        stroke: '#22C',
        'stroke-width': '0.5',
      });
      stretchy = svgedit.utilities.getElem('selectorParentGroup').appendChild(stretchy);
    }

    stretchy.setAttribute('display', 'inline');

    let keep = null;
    let index;

    // if pts array is empty, create path element with M at current point
    if (!drawnPath) {
      const d = `M${x},${y} `;

      drawnPath = svgCanvas.addSvgElementFromJson({
        attr: {
          d,
          fill: 'none',
          id: svgCanvas.getNextId(),
          opacity: svgCanvas.getCurrentShape().opacity / 2,
          'stroke-width': 1,
        },
        curStyles: true,
        element: 'path',
      });

      updateElementColor(drawnPath!);
      // set stretchy line to first point
      stretchy.setAttribute('d', ['M', ...wrapPrecision([mouseX, mouseY, mouseX, mouseY])].join(' '));
      index = subpath ? svgedit.path.path.segs.length : 0;
      svgedit.path.addDrawingPoint(index, mouseX, mouseY, x, y);
      shortcuts.off(['Escape']);
      shortcuts.on(['Escape'], () => finishPath(!isContinuousDrawing));
    } else {
      // determine if we clicked on an existing point
      const segments = drawnPath.pathSegList;
      let i = segments.numberOfItems;
      const FUZZ = 6 / currentZoom;
      let clickOnPoint = false;

      while (i) {
        i -= 1;

        const item = segments.getItem(i);
        const px = item.x;
        const py = item.y;

        // found a matching point
        if (x >= px - FUZZ && x <= px + FUZZ && y >= py - FUZZ && y <= py + FUZZ) {
          clickOnPoint = true;
          break;
        }
      }

      // get path element that we are in the process of creating
      const id = svgCanvas.getId();

      // Remove previous path object if previously created
      svgedit.path.removePath(id);

      const newpath = svgedit.utilities.getElem(id);
      let newSegment;
      let sSegment;
      const len = segments.numberOfItems;

      // if we clicked on an existing point, then we are done this path, commit it
      // (i, i+1) are the x,y that were clicked on
      if (clickOnPoint) {
        // if clicked on any other point but the first OR
        // the first point was clicked on and there are less than 3 points
        // then leave the path open
        // otherwise, close the path
        if (i === 0 && len >= 2) {
          // Create end segment
          const absX = segments.getItem(0).x;
          const absY = segments.getItem(0).y;

          sSegment = stretchy.pathSegList.getItem(1);

          if (sSegment.pathSegType === 4) {
            newSegment = drawnPath.createSVGPathSegLinetoAbs(absX, absY);
          } else {
            newSegment = drawnPath.createSVGPathSegCurvetoCubicAbs(
              absX,
              absY,
              sSegment.x1 / currentZoom,
              sSegment.y1 / currentZoom,
              absX,
              absY,
            );
          }

          segments.appendItem(newSegment);
          segments.appendItem(drawnPath.createSVGPathSegClosePath());
        } else if (len < 2) {
          keep = false;

          return keep;
        }

        finishPath(!isContinuousDrawing);

        if (subpath) {
          if (svgedit.path.path.matrix) {
            svgedit.coords.remapElement(newpath, {}, svgedit.path.path.matrix.inverse());
          }

          const newD = newpath.getAttribute('d');
          const origD = $(svgedit.path.path.elem).attr('d');

          $(svgedit.path.path.elem).attr('d', origD + newD);
          $(newpath).remove();

          if (svgedit.path.path.matrix) {
            svgedit.path.recalcRotatedPath();
          }

          svgedit.path.path.init();
          toEditMode(svgedit.path.path.elem);
          svgedit.path.path.selectPt();

          return false;
        }
      } else {
        // else, create a new point, update path element
        // Checks if current target or parents are #svgcontent
        if (!$.contains(svgCanvas.getContainer(), svgCanvas.getMouseTarget(evt))) {
          // Clicked outside canvas, so don't make point
          console.log('Clicked outside canvas');

          return false;
        }

        const num = drawnPath.pathSegList.numberOfItems;
        const last = drawnPath.pathSegList.getItem(num - 1);
        const lastx = last.x;
        const lasty = last.y;

        if (evt.shiftKey) {
          const xya = svgedit.math.snapToAngle(lastx, lasty, x, y, Math.PI / 4);

          x = xya.x;
          y = xya.y;
          mouseX = x * currentZoom;
          mouseY = y * currentZoom;
        }

        // Use the segment defined by stretchy
        sSegment = stretchy.pathSegList.getItem(1);

        if (sSegment.pathSegType === 4) {
          newSegment = drawnPath.createSVGPathSegLinetoAbs(Math.round(x), Math.round(y));
        } else {
          newSegment = drawnPath.createSVGPathSegCurvetoCubicAbs(
            Math.round(x),
            Math.round(y),
            sSegment.x1 / currentZoom,
            sSegment.y1 / currentZoom,
            sSegment.x2 / currentZoom,
            sSegment.y2 / currentZoom,
          );
        }

        drawnPath.pathSegList.appendItem(newSegment);

        // set stretchy line to latest point
        stretchy.setAttribute('d', ['M', mouseX, mouseY, mouseX, mouseY].join(' '));
        index = num;

        if (subpath) {
          index += svgedit.path.path.segs.length;
        }

        svgedit.path.addDrawingPoint(index, mouseX, mouseY, x, y);
      }
      // keep = true;
    }
  } else if (currentMode === 'pathedit') {
    // TODO: Make sure currentPath isn't null at this point
    const selectedPath: Path = svgedit.path.path;

    if (!svgedit.path.path) return null;

    selectedPath.storeD();

    const { id } = evt.target as SVGElement;
    let pointIndex;

    if (id.startsWith('pathpointgrip_')) {
      pointIndex = Number.parseInt(id.substr(14), 10);
      selectedPath.selectedPointIndex = pointIndex;
      selectedPath.dragging = [startX, startY];

      const point = selectedPath.nodePoints[pointIndex];

      if (!evt.shiftKey) {
        // if not selected: select this point only
        if (!point.isSelected || selectedPath.selectedControlPoint) {
          selectedPath.clearSelection();
          selectedPath.addPtsToSelection(pointIndex);
        }
      } else if (point.isSelected && !selectedPath.selectedControlPoint) {
        selectedPath.removePtFromSelection(pointIndex);
      } else {
        selectedPath.addPtsToSelection(pointIndex);
      }

      svgEditor.updateContextPanel();
    } else if (id.startsWith('ctrlpointgrip_')) {
      svgedit.path.path.dragging = [startX, startY];

      const parts = id.split('_')[1].split('c');

      svgedit.path.path.selectCtrlPoint(parts[0], parts[1]);
      svgEditor.updateContextPanel();
    }

    // Clicked on the path
    // TODO: handle sensor area
    if (id === selectedPath.elem.id) {
      const result = getCurveLocationByPaperjs(x, y, selectedPath.elem);
      // TODO: Cache compound path seg index
      let pushNew = true;
      const pathToSegIndices = [];

      selectedPath.segs.forEach((seg) => {
        if (seg.item.pathSegType < 4 && seg.item.pathSegType > 1) {
          if (pushNew) {
            pathToSegIndices.push(seg.index);
            pushNew = false;
          } else {
            pathToSegIndices[pathToSegIndices.length - 1] = seg.index;
          }
        } else {
          pushNew = true;
        }
      });

      const segIndex = pathToSegIndices[result.pathIndex] + 1 + result.curveIndex;

      console.log('Path2Seg Indicies', pathToSegIndices);
      console.log('Selected Seg Index', segIndex);
      selectedPath.addSeg(segIndex, 1 - result.time);

      const seg = selectedPath.segs[segIndex];
      const isLastSeg = segIndex === pathToSegIndices[result.pathIndex + 1] - 1;

      console.log('Selected Seg', isLastSeg, seg.startPoint.index, seg.endPoint.index);

      const nodeIndex = isLastSeg ? seg.startPoint.index + 1 : seg.endPoint.index;

      console.log('Inserted Node Index', nodeIndex);
      selectedPath.init().addPtsToSelection([nodeIndex]);
      selectedPath.endChanges('Add path node');
      selectedPath.show(true).update();
      hasCreatedPoint = true;

      return null;
    }

    // Start selection box
    if (!selectedPath.dragging) {
      const rubberBox = svgCanvas.getRubberBox();

      if (rubberBox == null) {
        const selectorManager = selector.getSelectorManager();

        svgCanvas.unsafeAccess.setRubberBox(selectorManager.getRubberBandBox());
      }

      svgedit.utilities.assignAttributes(
        rubberBox,
        {
          display: 'inline',
          height: 0,
          width: 0,
          x: startX * currentZoom,
          y: startY * currentZoom,
        },
        100,
      );
    }
  }

  return { x: mouseX, y: mouseY };
};

const mouseMove = (mouseX: number, mouseY: number) => {
  const currentZoom = workareaManager.zoomRatio;
  const selectedPath: ISVGPath = svgedit.path.path;

  hasMoved = true;

  if (modeOnMouseDown === 'path') {
    if (!drawnPath) {
      return;
    }

    const segments = drawnPath.pathSegList;
    const index = segments.numberOfItems - 1;

    if (newPoint) {
      // First point
      //  if (!index) {return;}

      const ptX = newPoint[0];
      const ptY = newPoint[1];

      // set curve
      const curX = mouseX / currentZoom;
      const curY = mouseY / currentZoom;
      const altX = ptX + (ptX - curX);
      const altY = ptY + (ptY - curY);

      // Set control points
      const pointGrip1 = svgedit.path.addDrawingCtrlGrip('1c1');
      const pointGrip2 = svgedit.path.addDrawingCtrlGrip('0c2');

      // dragging pointGrip1
      pointGrip1.setAttribute('cx', mouseX);
      pointGrip1.setAttribute('cy', mouseY);
      pointGrip1.setAttribute('data-x', curX);
      pointGrip1.setAttribute('data-y', curY);
      pointGrip1.setAttribute('display', 'inline');

      pointGrip2.setAttribute('cx', altX * currentZoom);
      pointGrip2.setAttribute('cy', altY * currentZoom);
      pointGrip2.setAttribute('data-x', altX);
      pointGrip2.setAttribute('data-y', altY);
      pointGrip2.setAttribute('display', 'inline');

      const ctrlLine = svgedit.path.getCtrlLine(1);

      svgedit.utilities.assignAttributes(ctrlLine, {
        'data-x1': curX,
        'data-x2': altX,
        'data-y1': curY,
        'data-y2': altY,
        display: 'inline',
        x1: mouseX,
        x2: altX * currentZoom,
        y1: mouseY,
        y2: altY * currentZoom,
      });

      if (index === 0) {
        firstCtrl = [mouseX, mouseY];
      } else {
        const last = segments.getItem(index - 1);
        let lastX = last.x;
        let lastY = last.y;

        if (last.pathSegType === 6) {
          lastX += lastX - last.x2;
          lastY += lastY - last.y2;
        } else if (firstCtrl) {
          lastX = firstCtrl[0] / currentZoom;
          lastY = firstCtrl[1] / currentZoom;
        }

        svgedit.path.replacePathSeg(6, index, [ptX, ptY, lastX, lastY, altX, altY], drawnPath);
      }
    } else {
      const stretchy = svgedit.utilities.getElem('path_stretch_line');

      if (stretchy) {
        const prev = segments.getItem(index);

        if (prev.pathSegType === 6) {
          const prevX = prev.x + (prev.x - prev.x2);
          const prevY = prev.y + (prev.y - prev.y2);

          svgedit.path.replacePathSeg(
            6,
            1,
            [mouseX, mouseY, prevX * currentZoom, prevY * currentZoom, mouseX, mouseY],
            stretchy,
          );
        } else if (firstCtrl) {
          svgedit.path.replacePathSeg(6, 1, [mouseX, mouseY, firstCtrl[0], firstCtrl[1], mouseX, mouseY], stretchy);
        } else {
          svgedit.path.replacePathSeg(4, 1, [mouseX, mouseY], stretchy);
        }
      }
    }

    return;
  }

  if (hasCreatedPoint) {
    // has created a node point
  } else if (selectedPath?.dragging) {
    // if we are dragging a point, let's move it
    const pt = svgedit.path.getPointFromGrip(
      {
        x: selectedPath.dragging[0],
        y: selectedPath.dragging[1],
      },
      selectedPath,
    );
    const mpt = svgedit.path.getPointFromGrip({ x: mouseX, y: mouseY }, selectedPath);
    const diffX = mpt.x - pt.x;
    const diffY = mpt.y - pt.y;

    selectedPath.dragging = [mouseX, mouseY];

    if (selectedPath.selectedControlPoint) {
      selectedPath.moveCtrl(diffX, diffY);
    } else {
      selectedPath.movePts(diffX, diffY);
    }
  } else {
    // select multiple points
    const selectedPoints = [];
    const rbb = svgCanvas.getRubberBox().getBBox();

    selectedPath.segs.forEach((seg) => {
      if (!seg.next && !seg.prev) {
        return;
      }

      const pt = svgedit.path.getGripPt(seg);
      const ptBb = {
        height: 0,
        width: 0,
        x: pt.x,
        y: pt.y,
      };

      const intersected = svgedit.math.rectsIntersect(rbb, ptBb);

      seg.select(intersected);

      // Note that addPtsToSelection is not being run
      if (intersected) {
        selectedPoints.push(seg.endPoint.index);
      }
    });
    selectedPath.selected_pts = selectedPoints;
  }
};

const mouseUp = (evt: MouseEvent, element?: SVGElement) => {
  const rubberBox = svgCanvas.getRubberBox();

  // Create mode
  if (modeOnMouseDown === 'path') {
    newPoint = null;

    if (!drawnPath) {
      svgCanvas.unsafeAccess.setStarted(false);
      firstCtrl = null;

      return {
        element: svgedit.utilities.getElem(svgCanvas.getId()),
        keep: true,
      };
    }

    return {
      element,
      keep: true,
    };
  }

  // Edit mode
  const selectedPath: ISVGPath = svgedit.path.path;

  if (hasCreatedPoint) {
    hasCreatedPoint = false;
  } else if (selectedPath.dragging) {
    selectedPath.dragging = false;
    selectedPath.dragctrl = false;
    selectedPath.update();

    if (hasMoved) {
      selectedPath.endChanges('Move path point(s)');
    } else if (!evt.shiftKey) {
      const { id } = evt.target as SVGElement;

      if (id.startsWith('pathpointgrip_')) {
        // Select this point if not moved
        const pointIndex = Number.parseInt(id.substr(14), 10);

        selectedPath.selectedPointIndex = pointIndex;
        selectedPath.clearSelection();
        selectedPath.addPtsToSelection(pointIndex);
      }
    }
  } else if (rubberBox && rubberBox.getAttribute('display') !== 'none') {
    // Done with multi-node-select
    rubberBox.setAttribute('display', 'none');

    if (!isMobile() && Number(rubberBox.getAttribute('width')) <= 2 && Number(rubberBox.getAttribute('height')) <= 2) {
      toSelectMode(evt.target);
    } else {
      svgEditor.updateContextPanel();
    }
  } else {
    // else, move back to select mode
    toSelectMode(evt.target);
  }

  hasMoved = false;

  return null;
};

const deletePathNode = () => {
  svgedit.path.path.storeD();

  const selPts = svgedit.path.path.selected_pts;
  let i = selPts.length;

  while (i) {
    i -= 1;

    const pt = selPts[i];

    svgedit.path.path.deleteSeg(pt);
  }

  // Cleanup
  const cleanup = () => {
    const segList = svgedit.path.path.elem.pathSegList;
    let len = segList.numberOfItems;

    const remItems = (pos, count) => {
      let it = count;

      while (it) {
        it -= 1;
        segList.removeItem(pos);
      }
    };

    if (len <= 1) {
      return true;
    }

    while (len) {
      len -= 1;

      const item = segList.getItem(len);

      if (item.pathSegType === 1) {
        const prev = segList.getItem(len - 1);
        const nprev = segList.getItem(len - 2);

        if (prev.pathSegType === 2) {
          remItems(len - 1, 2);
          cleanup();
          break;
        } else if (nprev.pathSegType === 2) {
          remItems(len - 2, 3);
          cleanup();
          break;
        }
      } else if (item.pathSegType === 2) {
        if (len > 0) {
          const prevType = segList.getItem(len - 1).pathSegType;

          // Path has M M
          if (prevType === 2) {
            remItems(len - 1, 1);
            cleanup();
            break;
            // Entire path ends with Z M
          } else if (prevType === 1 && segList.numberOfItems - 1 === len) {
            remItems(len, 1);
            cleanup();
            break;
          }
        }
      }
    }

    return false;
  };

  cleanup();

  // Completely delete a path with 1 or 0 segments
  if (svgedit.path.path.elem.pathSegList.numberOfItems <= 1) {
    toSelectMode(svgedit.path.path.elem);
    svgCanvas.deleteSelectedElements();

    return;
  }

  svgedit.path.path.init();
  svgedit.path.path.clearSelection();

  // TODO: Find right way to select point now
  // path.selectPt(sel_pt);
  svgedit.path.path.endChanges('Delete path node(s)');
};

const select = (target): void => {
  if (currentPath === target) {
    toEditMode(target);
    setMouseMode('pathedit');
  } else {
    // going into pathedit mode
    currentPath = target;
  }
};

const reorient = (selectedElements): void => {
  const elem = selectedElements[0];

  if (!elem) {
    return;
  }

  const angle = svgedit.utilities.getRotationAngle(elem);

  if (angle === 0) {
    return;
  }

  const batchCmd = new history.BatchCommand('Reorient path');
  const changes = {
    d: elem.getAttribute('d'),
    transform: elem.getAttribute('transform'),
  };

  batchCmd.addSubCommand(new history.ChangeElementCommand(elem, changes));
  svgCanvas.clearSelection();
  svgCanvas.resetOrientation(elem);

  svgCanvas.addCommandToHistory(batchCmd);

  // Set matrix to null
  svgedit.path.getPath(elem).show(false).matrix = null;

  svgCanvas.clear();

  svgCanvas.addToSelection([elem], true);
  svgCanvas.call('changed', selectedElements);
};

export const clear = () => {
  currentPath = null;

  if (drawnPath) {
    const elem = svgedit.utilities.getElem(svgCanvas.getId());

    $(svgedit.utilities.getElem('path_stretch_line')).remove();
    $(elem).remove();
    $(svgedit.utilities.getElem('pathpointgrip_container')).find('*').attr('display', 'none');
    drawnPath = null;
    firstCtrl = null;
    svgCanvas.unsafeAccess.setStarted(false);
  } else if (getMouseMode() === 'pathedit') {
    toSelectMode(svgedit.path.path.elem);
  }

  if (svgedit.path.path) {
    svgedit.path.path.init().show(false);
  }

  svgCanvas.clearAlignLines();
};

const resetOrientation = (path) => {
  if (path == null || path.nodeName !== 'path') return;

  const tlist = svgedit.transformlist.getTransformList(path);
  const m = svgedit.math.transformListToTransform(tlist).matrix;

  tlist.clear();
  path.removeAttribute('transform');

  const segList = path.pathSegList;

  // Opera/win/non-EN throws an error here.
  // TODO: Find out why!
  // Presumed fixed in Opera 10.5, so commented out for now

  const len = segList.numberOfItems;

  for (let i = 0; i < len; i += 1) {
    const seg = segList.getItem(i);
    const type = seg.pathSegType;

    if (type !== 1) {
      const pts = [];

      $.each(['', 1, 2], (j, n) => {
        const x = seg[`x${n}`];
        const y = seg[`y${n}`];

        if (x !== undefined && y !== undefined) {
          const pt = svgedit.math.transformPoint(x, y, m);

          pts.splice(pts.length, 0, pt.x, pt.y);
        }
      });
      svgedit.path.replacePathSeg(type, i, pts, path);
    }
  }

  svgCanvas.reorientGrads(path, m);
};

const zoomChange = (oldZoom: number, newZoom: number) => {
  const currentMode = getMouseMode();

  if (currentMode === 'pathedit') {
    svgedit.path.path.update();
  } else if (currentMode === 'path') {
    if (drawnPath) {
      svgedit.path.updateDrawingPoints();
      svgedit.path.updateControlLines();

      const stretchy: any = document.getElementById('path_stretch_line');

      if (stretchy) {
        const segments = stretchy.pathSegList;
        const seg0 = segments.getItem(0);
        const seg1 = segments.getItem(1);
        const zoomRatio = newZoom / oldZoom;

        svgedit.path.replacePathSeg(2, 0, [seg0.x * zoomRatio, seg0.y * zoomRatio], stretchy);

        if (seg1.pathSegType === 6) {
          svgedit.path.replacePathSeg(
            6,
            1,
            [
              seg1.x * zoomRatio,
              seg1.y * zoomRatio,
              seg1.x1 * zoomRatio,
              seg1.y1 * zoomRatio,
              seg1.x2 * zoomRatio,
              seg1.y2 * zoomRatio,
            ],
            stretchy,
          );
        } else {
          svgedit.path.replacePathSeg(4, 1, [seg1.x * zoomRatio, seg1.y * zoomRatio], stretchy);
        }
      }
    }
  }
};

const getNodePoint = () => {
  const selPt = svgedit.path.path.selected_pts.length ? svgedit.path.path.selected_pts[0] : 1;

  const seg = svgedit.path.path.segs[selPt];

  return {
    type: seg.type,
    x: seg.item.x,
    y: seg.item.y,
  };
};

const linkControlPoints = (linkPoints) => {
  svgedit.path.setLinkControlPoints(linkPoints);
};

const clonePathNode = () => {
  const selectedPath: ISVGPath = svgedit.path.path;

  selectedPath.storeD();

  const selPts = selectedPath.selected_pts;

  let i = selPts.length;
  const indices = [];

  while (i) {
    i -= 1;

    const pt = selPts[i];

    selectedPath.addSeg(pt, 0.5);

    indices.push(pt + i);
    indices.push(pt + i + 1);
  }
  selectedPath.init().addPtsToSelection(indices);

  selectedPath.endChanges('Clone path node(s)');
};

const opencloseSubPath = () => {
  const selPts = svgedit.path.path.selected_pts;

  // Only allow one selected node for now
  if (selPts.length !== 1) {
    return;
  }

  const { elem } = svgedit.path.path;
  const list = elem.pathSegList;
  const index = selPts[0];

  let openPt = null;
  let startItem = null;

  // Check if subpath is already open
  svgedit.path.path.eachSeg((i) => {
    const seg: any = this;

    if (seg.type === 2 && i <= index) {
      startItem = seg.item;
    }

    if (i <= index) {
      return true;
    }

    if (seg.type === 2) {
      // Found M first, so open
      openPt = i;

      return false;
    }

    if (seg.type === 1) {
      // Found Z first, so closed
      openPt = false;

      return false;
    }

    return false;
  });

  if (openPt == null) {
    // Single path, so close last seg
    openPt = svgedit.path.path.segs.length - 1;
  }

  if (openPt !== false) {
    // Close this path

    // Create a line going to the previous "M"
    const newSegment = elem.createSVGPathSegLinetoAbs(startItem.x, startItem.y);

    const closer = elem.createSVGPathSegClosePath();

    if (openPt === svgedit.path.path.segs.length - 1) {
      list.appendItem(newSegment);
      list.appendItem(closer);
    } else {
      svgedit.path.insertItemBefore(elem, closer, openPt);
      svgedit.path.insertItemBefore(elem, newSegment, openPt);
    }

    svgedit.path.path.init().selectPt(openPt + 1);

    return;
  }

  // M 1,1 L 2,2 L 3,3 L 1,1 z // open at 2,2
  // M 2,2 L 3,3 L 1,1

  // M 1,1 L 2,2 L 1,1 z M 4,4 L 5,5 L6,6 L 5,5 z
  // M 1,1 L 2,2 L 1,1 z [M 4,4] L 5,5 L(M)6,6 L 5,5 z

  const seg = svgedit.path.path.segs[index];

  if (seg.mate) {
    list.removeItem(index); // Removes last "L"
    list.removeItem(index); // Removes the "Z"
    svgedit.path.path.init().selectPt(index - 1);

    return;
  }

  let i;
  let lastM;
  let zSegment;

  // Find this sub-path's closing point and remove
  for (i = 0; i < list.numberOfItems; i += 1) {
    const item = list.getItem(i);

    if (item.pathSegType === 2) {
      // Find the preceding M
      lastM = i;
    } else if (i === index) {
      // Remove it
      list.removeItem(lastM);
      // index--;
    } else if (item.pathSegType === 1 && index < i) {
      // Remove the closing seg of this subpath
      zSegment = i - 1;
      list.removeItem(i);
      break;
    }
  }

  let num = index - lastM - 1;

  while (num) {
    num -= 1;
    svgedit.path.insertItemBefore(elem, list.getItem(lastM), zSegment);
  }

  const pt = list.getItem(lastM);

  // Make this point the new "M"
  svgedit.path.replacePathSeg(2, lastM, [pt.x, pt.y]);

  i = index; // i is local here, so has no effect; what is the reason for this?

  svgedit.path.path.init().selectPt(0);
};

const addSubPath = (on) => {
  if (on) {
    // Internally we go into "path" mode, but in the UI it will
    // still appear as if in "pathedit" mode.
    setMouseMode('path');
    subpath = true;
  } else {
    clear(true);
    toEditMode(svgedit.path.path.elem);
  }
};

const moveNode = (attr, newValue): void => {
  const selPts = svgedit.path.path.selected_pts;

  if (!selPts.length) {
    return;
  }

  svgedit.path.path.storeD();

  // Get first selected point
  const seg = svgedit.path.path.segs[selPts[0]];
  const diff = {
    x: 0,
    y: 0,
  };

  diff[attr] = newValue - seg.item[attr];

  seg.move(diff.x, diff.y);
  svgedit.path.path.endChanges('Move path point');
};

export const fixEnd = (elem: SVGPathElement): void => {
  // Adds an extra segment if the last seg before a Z doesn't end
  // at its M point
  // M0,0 L0,100 L100,100 z
  let lastM;
  const segments = elem.pathSegList;
  const newList = [];

  for (let i = 0; i < segments.numberOfItems; i += 1) {
    const seg = segments.getItem(i);

    if (seg.pathSegType === 2) {
      lastM = seg;
    }

    if (seg.pathSegType === 1 && i > 0) {
      const prev = segments.getItem(i - 1);

      if (prev.x !== lastM.x || prev.y !== lastM.y) {
        // Add an L segment here
        // This is a memory-efficient method, but very slow
        // svgedit.path.insertItemBefore(elem, newSegment, i);
        // i++;
        const newSegment = elem.createSVGPathSegLinetoAbs(lastM.x, lastM.y);

        newList.push(newSegment);
      }
    }

    // Avoiding trailing m
    if (i !== segments.numberOfItems - 1 || seg.pathSegType !== 2) {
      newList.push(seg);
    }
  }
  segments._list = newList;
  elem.setAttribute('d', svgedit.utilities.convertPath(elem));
};

const pathDSegment = (letter: string, points: number[][], morePoints?: number[], lastPoint?: number[]): string => {
  $.each(points, (i, pnt) => {
    points[i] = svgedit.units.shortFloat(pnt);
  });

  let segment = letter + points.join(' ');

  if (morePoints) {
    segment += ` ${morePoints.join(' ')}`;
  }

  if (lastPoint) {
    segment += ` ${svgedit.units.shortFloat(lastPoint)}`;
  }

  return segment;
};

// this is how we map paths to our preferred relative segment types
const pathMap = [0, 'z', 'M', 'm', 'L', 'l', 'C', 'c', 'Q', 'q', 'A', 'a', 'H', 'h', 'V', 'v', 'S', 's', 'T', 't'];

const convertPathSegToDPath = (segList: ISVGPathSeg[], toRel: boolean) => {
  let i;
  const len = segList.length;
  let curx = 0;
  let cury = 0;
  let d = '';
  let lastMove = null;

  for (i = 0; i < len; i += 1) {
    const seg = segList[i];
    // if these properties are not in the segment, set them to zero
    let x = seg.x || 0;
    let y = seg.y || 0;
    let x1 = seg.x1 || 0;
    let y1 = seg.y1 || 0;
    let x2 = seg.x2 || 0;
    let y2 = seg.y2 || 0;

    const type = seg.pathSegType;
    let letter = pathMap[type][`to${toRel ? 'Lower' : 'Upper'}Case`]();

    switch (type) {
      case 1: // z,Z closepath (Z/z)
        curx = lastMove ? lastMove[0] : 0;
        cury = lastMove ? lastMove[1] : 0;
        d += 'z';
        break;
      case 12: // absolute horizontal line (H)
        x -= curx;
      case 13: // relative horizontal line (h)
        if (toRel) {
          curx += x;
          letter = 'l';
        } else {
          x += curx;
          curx = x;
          letter = 'L';
        }

        // Convert to "line" for easier editing
        d += pathDSegment(letter, [[x, cury]]);
        break;
      case 14: // absolute vertical line (V)
        y -= cury;
      case 15: // relative vertical line (v)
        if (toRel) {
          cury += y;
          letter = 'l';
        } else {
          y += cury;
          cury = y;
          letter = 'L';
        }

        // Convert to "line" for easier editing
        d += pathDSegment(letter, [[curx, y]]);
        break;
      case 2: // absolute move (M)
      case 4: // absolute line (L)
      case 18: // absolute smooth quad (T)
        x -= curx;
        y -= cury;
      case 5: // relative line (l)
      case 3: // relative move (m)
        // If the last segment was a "z", this must be relative to
        if (lastMove && segList[i - 1].pathSegType === 1 && !toRel) {
          [curx, cury] = lastMove;
        }

      case 19: // relative smooth quad (t)
        if (toRel) {
          curx += x;
          cury += y;
        } else {
          x += curx;
          y += cury;
          curx = x;
          cury = y;
        }

        if (type === 2 || type === 3) {
          lastMove = [curx, cury];
        }

        d += pathDSegment(letter, [[x, y]]);
        break;
      case 6: // absolute cubic (C)
        x -= curx;
        x1 -= curx;
        x2 -= curx;
        y -= cury;
        y1 -= cury;
        y2 -= cury;
      case 7: // relative cubic (c)
        if (toRel) {
          curx += x;
          cury += y;
        } else {
          x += curx;
          x1 += curx;
          x2 += curx;
          y += cury;
          y1 += cury;
          y2 += cury;
          curx = x;
          cury = y;
        }

        d += pathDSegment(letter, [
          [x1, y1],
          [x2, y2],
          [x, y],
        ]);
        break;
      case 8: // absolute quad (Q)
        x -= curx;
        x1 -= curx;
        y -= cury;
        y1 -= cury;
      case 9: // relative quad (q)
        if (toRel) {
          curx += x;
          cury += y;
        } else {
          x += curx;
          x1 += curx;
          y += cury;
          y1 += cury;
          curx = x;
          cury = y;
        }

        d += pathDSegment(letter, [
          [x1, y1],
          [x, y],
        ]);
        break;
      case 10: // absolute elliptical arc (A)
        x -= curx;
        y -= cury;
      case 11: // relative elliptical arc (a)
        if (toRel) {
          curx += x;
          cury += y;
        } else {
          x += curx;
          y += cury;
          curx = x;
          cury = y;
        }

        d += pathDSegment(
          letter,
          [[seg.r1, seg.r2]],
          [seg.angle, seg.largeArcFlag ? 1 : 0, seg.sweepFlag ? 1 : 0],
          [x, y],
        );
        break;
      case 16: // absolute smooth cubic (S)
        x -= curx;
        x2 -= curx;
        y -= cury;
        y2 -= cury;
      case 17: // relative smooth cubic (s)
        if (toRel) {
          curx += x;
          cury += y;
        } else {
          x += curx;
          x2 += curx;
          y += cury;
          y2 += cury;
          curx = x;
          cury = y;
        }

        d += pathDSegment(letter, [
          [x2, y2],
          [x, y],
        ]);
        break;
      default:
        break;
    } // switch on path segment type
  } // for each segment

  return d;
};

const _smoothByPaperjs = (elem: SVGPathElement) => {
  const originD = elem.getAttribute('d') as string;
  // paper.setup();
  const proj = new paper.Project(document.createElement('canvas'));
  const items = proj.importSVG(`<svg>${elem.outerHTML}</svg>`);
  const path = items.children[0] as paper.Path;

  path.simplify(1);

  const svg = proj.exportSVG() as SVGElement;
  const group = svg.children[0];
  const group2 = group.children[0];
  const svgPath = group2.children[0];
  const d = svgPath.getAttribute('d') as string;

  console.log('Compress', ((d.length / originD.length) * 100).toFixed(2));
  elem.setAttribute('d', d);

  return d;
};

const reverseDPath = (dPath: string) => {
  // paper.setup();
  const proj = new paper.Project(document.createElement('canvas'));
  const items = proj.importSVG(`<svg><path x="0" y="0" d="${dPath}" /></svg>`);
  const path = items.children[0] as paper.Path;

  path.reverse();

  const svg = proj.exportSVG() as SVGElement;
  const group = svg.children[0];
  const group2 = group.children[0];
  const svgPath = group2.children[0] as ISVGPathElement;

  return svgPath.pathSegList;
};

type TSegmentedPath = Array<{ points: Array<{ x: number; y: number }>; type: string }>;

/**
Change precision to 2
Merge consecutive L into C where possible
Remove L with 0 length
TODO: Merge C, Change straight C into L
*/
const smoothByFitPath = (elem: SVGPathElement) => {
  const _round = (val: number) => round(val, 2);
  const d = elem.getAttribute('d')!;
  const dPaths = d.split(/(?=M)/);
  const bbox = svgedit.utilities.getBBox(elem);
  const rotation = {
    angle: svgedit.utilities.getRotationAngle(elem),
    cx: bbox.x + bbox.width / 2,
    cy: bbox.y + bbox.height / 2,
  };
  const result = Array.of<string>();
  const ClipperLib = getClipperLib();
  let lastPoint: undefined | { x: number; y: number } = undefined;

  try {
    dPaths.forEach((dPath) => {
      lastPoint = undefined;
      elem.setAttribute('d', dPath);

      const dLength = elem.getTotalLength();
      const path: TSegmentedPath = ClipperLib.dPathToLineSegments(dPath, rotation);

      path.forEach((subpath) => {
        const { points, type } = subpath;

        if (type === 'Z') {
          result.push(type);
          lastPoint = undefined;
        } else if (type !== 'L') {
          result.push(`${type}${points.map((p) => `${_round(p.x)},${_round(p.y)}`).join(' ')}`);
          lastPoint = points.at(-1);
        } else {
          const segs = BezierFitCurve.fitPath(points, dLength);

          for (let j = 0; j < segs.length; j += 1) {
            // Note: points[0] is included in the last segment
            const { points, type } = segs[j];

            if (
              lastPoint &&
              type === 'L' &&
              _round(points[1].x - lastPoint.x) === 0 &&
              _round(points[1].y - lastPoint.y) === 0
            ) {
              continue;
            }

            const pointsString = points
              .slice(1)
              .map((p) => `${_round(p.x)},${_round(p.y)}`)
              .join(' ');

            lastPoint = points.at(-1);
            result.push(`${type}${pointsString}`);
          }
        }
      });
    });

    return result.join('');
  } catch (e) {
    console.log('Fit path error', e);

    return d;
  }
};

const roundPoint = (point: paper.Point, precision = 4) => {
  return new paper.Point(round(point.x, precision), round(point.y, precision));
};

const roundPath = (path: paper.CompoundPath | paper.Path, precision = 4) => {
  if (path instanceof paper.CompoundPath) {
    path.children.forEach((child) => roundPath(child as paper.CompoundPath | paper.Path, precision));
  } else {
    path.segments.forEach((segment) => {
      segment.point = roundPoint(segment.point, precision);
      segment.handleIn = roundPoint(segment.handleIn, precision);
      segment.handleOut = roundPoint(segment.handleOut, precision);
    });
  }
};

const booleanOperation = (pathHTML1: string, pathHTML2: string, clipType: number, precision = 3) => {
  const operation = ['intersect', 'unite', 'subtract', 'exclude'][clipType];
  const proj = new paper.Project(document.createElement('canvas'));
  const items = proj.importSVG(`<svg>${pathHTML1}${pathHTML2}</svg>`);
  const obj1 = items.children[0] as paper.CompoundPath | paper.Path | paper.Shape;
  const obj2 = items.children[1] as paper.CompoundPath | paper.Path | paper.Shape;
  const path1 = obj1 instanceof paper.Shape ? obj1.toPath() : obj1.clone();
  const path2 = obj2 instanceof paper.Shape ? obj2.toPath() : obj2.clone();

  // Round coordinates to reduce float precision issues
  roundPath(path1, precision);
  roundPath(path2, precision);

  (path1 as any)[operation](path2);
  obj1.remove();
  obj2.remove();
  path1.remove();
  path2.remove();

  const svg = proj.exportSVG() as SVGElement;
  const group = svg.children[0];
  const group2 = group.children[0];

  console.log('Output Paths', group2.children.length);

  const svgPath = group2.children[0];

  return svgPath.getAttribute('d');
};

export const booleanOperationByPaperjs = (baseHTML: string, elem2: SVGElement, clipType: number) => {
  let elem2HTML = '';
  const rx = elem2.getAttribute('rx');

  if (elem2.tagName === 'rect' && rx) {
    const cloned = elem2.cloneNode(true) as Element;

    cloned.setAttribute('ry', rx);
    elem2HTML = cloned.outerHTML;
  } else {
    elem2HTML = elem2.outerHTML;
  }

  return booleanOperation(baseHTML, elem2HTML, clipType);
};

export const simplifyPath = (elem: any | SVGPathElement) => smoothByFitPath(elem);

const handleHistoryEvent = (eventType: string, cmd: ICommand) => {
  const EventTypes = history.HistoryEventTypes;

  if (eventType === EventTypes.AFTER_APPLY || eventType === EventTypes.AFTER_UNAPPLY) {
    // Only cares for updating nodes in pathedit mode
    if (svgedit.path.path && getMouseMode() === 'pathedit' && cmd.elem === svgedit.path.path.elem) {
      const selectedPath: ISVGPath = svgedit.path.path;

      selectedPath.init();
      selectedPath.show(true).update();
    } else {
      // Exit pathEditing mode if the command is not related to selectedPath
      clear();
    }
  }
};

const setRound = () => {
  // Todo fix too many new undo commands
  const selectedPath: ISVGPath = svgedit.path.path;

  selectedPath.selected_pts.forEach((nodeIndex) => {
    selectedPath.createControlPointsAtGrip(nodeIndex);
  });
};

const setSharp = () => {
  const selectedPath: ISVGPath = svgedit.path.path;

  selectedPath.storeD();

  const selection = selectedPath.selected_pts;

  selection.forEach((nodeIndex) => {
    selectedPath.stripCurveFromSegment(nodeIndex);
  });
  selectedPath.endChanges('Switch node type');
  selectedPath.init().addPtsToSelection(selection);
  selectedPath.show(true).update();
};

const connectNodes = () => {
  // TODO: Fix when connecting same segment
  const selectedPath: ISVGPath = svgedit.path.path;
  const selection = selectedPath.selected_pts;

  selectedPath.storeD();

  const [pt1, pt2] = selection;
  const newSegIndex = selectedPath.connectNodes(pt1, pt2);

  selectedPath.endChanges('connect');
  selectedPath.init();

  const newNodeIndex = selectedPath.segs[newSegIndex].endPoint?.index || 0;

  selectedPath.addPtsToSelection([newNodeIndex]);
  selectedPath.show(true).update();
};

const disconnectNode = () => {
  const selectedPath: ISVGPath = svgedit.path.path;
  const selection = selectedPath.selected_pts;

  selectedPath.storeD();

  const [selectedIndex] = selection;
  const newSegIndex = selectedPath.disconnectNode(selectedPath.nodePoints[selectedIndex].prevSeg?.index);

  selectedPath.endChanges('Disconnect');
  selectedPath.init();

  const newNodeIndex = selectedPath.segs[newSegIndex].endPoint?.index || 0;

  selectedPath.addPtsToSelection([newNodeIndex]);
  selectedPath.show(true).update();
};

const pathActions = {
  addSubPath,
  booleanOperation,
  booleanOperationByPaperjs,
  clear,
  clonePathNode,
  connectNodes,
  // Convert a path to one with only absolute or relative values
  convertPath: svgedit.utilities.convertPath,
  convertPathSegToDPath,
  deletePathNode,
  disconnectNode,
  finishPath,
  fixEnd,
  getNodePoint,
  handleHistoryEvent,
  hasDrawingPath: (): boolean => Boolean(drawnPath),
  linkControlPoints,
  mouseDown,
  mouseMove,
  mouseUp,
  moveNode,
  opencloseSubPath,
  reorient,
  resetOrientation,
  reverseDPath,
  select,
  setRound,
  setSharp,
  simplifyPath,
  smoothPolylineIntoPath,
  toEditMode,
  toSelectMode,
  zoomChange,
};

export type IPathActions = typeof pathActions;

export default (canvas: any): IPathActions => {
  svgCanvas = canvas;
  canvasEventEmitter.on('zoom-changed', (newZoom: number, oldZoom: number) => {
    zoomChange(oldZoom, newZoom);
  });

  return pathActions;
};
