import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import { getMouseMode, setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import changeAttribute from '../history/changeAttribute';
import { handleHistoryActionOptions } from '../history/utils/handleHistoryActionOptions';
import selectionManager from '../selection';
import { resizeSelector } from '../selector';
import workareaManager from '../workarea';

let svgCanvas: ISVGCanvas;
let svgEditor: ISVGEditor;

getSVGAsync(({ Canvas, Editor }) => {
  svgCanvas = Canvas;
  svgEditor = Editor;
});

let polygonSides = 5;
let started = false;
let newPoly: null | SVGPolygonElement = null;

const computePolygonPoints = (cx: number, cy: number, edge: number, angleOffset: number, sides: number): string => {
  const inRadius = edge / 2 / Math.tan(Math.PI / sides);
  const circumRadius = inRadius / Math.cos(Math.PI / sides);
  const points: string[] = [];

  for (let s = 0; sides >= s; s++) {
    const angle = (2.0 * Math.PI * s) / sides + angleOffset;
    const x = circumRadius * Math.cos(angle) + cx;
    const y = circumRadius * Math.sin(angle) + cy;

    points.push(`${x},${y}`);
  }

  return points.join(' ');
};

const renderPolygon = (): void => {
  if (!newPoly) return;

  const cx = Number(newPoly.getAttribute('cx'));
  const cy = Number(newPoly.getAttribute('cy'));
  const edge = Number(newPoly.getAttribute('edge'));
  const angleOffset = Number(newPoly.getAttribute('angle_offset'));
  const points = computePolygonPoints(cx, cy, edge, angleOffset, polygonSides);

  newPoly.setAttribute('points', points);
  newPoly.setAttribute('sides', String(polygonSides));

  if (selectionManager.getSelectedElements().includes(newPoly)) {
    resizeSelector(newPoly);
  }
};

export const polygonMouseDown = (x: number, y: number): null | SVGPolygonElement => {
  if (getMouseMode() !== 'polygon') return null;

  started = true;
  newPoly = svgCanvas.addSvgElementFromJson<SVGPolygonElement>({
    attr: {
      cx: x,
      cy: y,
      edge: 0,
      fill: 'none',
      'fill-opacity': 0,
      id: svgCanvas.getNextId(),
      orient: 'x',
      shape: 'regularPoly',
      sides: polygonSides,
      stroke: 'black',
      strokeWidth: 1,
    },
    element: 'polygon',
  });
  updateElementColor(newPoly);
  selectionManager.clearSelection();

  return newPoly;
};

export const polygonMouseMove = (x: number, y: number, evt: MouseEvent, selected: null | SVGElement): void => {
  if (!started || !newPoly) return;

  const zoom = workareaManager.zoomRatio;
  const mx = x / zoom;
  const my = y / zoom;
  const cx = Number(newPoly.getAttribute('cx'));
  const cy = Number(newPoly.getAttribute('cy'));
  const interiorAngle = (180 * (polygonSides - 2)) / polygonSides / 2;
  const edge = 2 * Math.sqrt((mx - cx) * (mx - cx) + (my - cy) * (my - cy)) * Math.cos((interiorAngle * Math.PI) / 180);
  const angleOffset = evt.shiftKey ? Math.PI / 2 - Math.PI / polygonSides : Math.atan2(my - cy, mx - cx);

  newPoly.setAttributeNS(null, 'edge', String(edge));
  newPoly.setAttributeNS(null, 'angle_offset', String(angleOffset));
  renderPolygon();

  if (!selected) {
    selectionManager.selectOnly([newPoly], true);
  } else {
    resizeSelector(selected);

    const bbox = newPoly.getBBox();

    ObjectPanelController.updateDimensionValues({ height: bbox.height, width: bbox.width, x: bbox.x, y: bbox.y });
  }
};

export const polygonMouseUp = (isContinuousDrawing: boolean): { element: null | SVGPolygonElement; keep: boolean } => {
  started = false;

  const edge = Number(newPoly?.getAttribute('edge') ?? 0);
  const keep = edge !== 0;

  if (!isContinuousDrawing) setMouseMode('select');

  return { element: newPoly, keep };
};

export const updatePolygonSides = (polygon: Element, sideChange: number, opts: HistoryActionOptions = {}): number => {
  const cx = Number(polygon.getAttribute('cx'));
  const cy = Number(polygon.getAttribute('cy'));
  const edge = Number(polygon.getAttribute('edge'));
  const angleOffset = Number(polygon.getAttribute('angle_offset'));
  const currentSides = Number(polygon.getAttribute('sides'));
  const newSides = Math.max(currentSides + sideChange, 3);

  if (newSides === currentSides) return currentSides;

  const points = computePolygonPoints(cx, cy, edge, angleOffset, newSides);

  const cmd = changeAttribute(polygon, {
    points,
    sides: String(newSides),
  });

  if (selectionManager.getSelectedElements().includes(polygon as SVGElement)) {
    resizeSelector(polygon as SVGElement);
  }

  handleHistoryActionOptions(cmd, opts);

  svgEditor.updateContextPanel();

  return newSides;
};

export const addPolygonSides = (val = 1): number => {
  if (started) {
    polygonSides += val;
    renderPolygon();

    return polygonSides;
  }

  const elems = selectionManager.getSelectedElements();

  if (elems.length === 1 && elems[0]?.tagName === 'polygon') {
    return updatePolygonSides(elems[0], val);
  }

  return 0;
};

export const decreasePolygonSides = (val = 1): number => {
  if (started) {
    polygonSides -= val;

    if (polygonSides < 3) polygonSides = 3;

    renderPolygon();

    return polygonSides;
  }

  const elems = selectionManager.getSelectedElements();

  if (elems.length === 1 && elems[0]?.tagName === 'polygon') {
    return updatePolygonSides(elems[0], -val);
  }

  return 0;
};
