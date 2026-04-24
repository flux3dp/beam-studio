import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import TopBarHintsController from '@core/app/components/beambox/TopBar/contexts/TopBarHintsController';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import changeAttribute from '../history/changeAttribute';
import { handleHistoryActionOptions } from '../history/utils/handleHistoryActionOptions';
import selectionManager from '../selection';
import { resizeSelector } from '../selector';

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

  for (let s = 0; s < sides; s++) {
    const angle = (2.0 * Math.PI * s) / sides + angleOffset;
    const x = circumRadius * Math.cos(angle) + cx;
    const y = circumRadius * Math.sin(angle) + cy;

    points.push(`${x},${y}`);
  }

  return points.join(' ');
};

const renderPolygon = (element = newPoly): void => {
  if (!element) return;

  const cx = Number(element.getAttribute('cx'));
  const cy = Number(element.getAttribute('cy'));
  const edge = Number(element.getAttribute('edge'));
  const angleOffset = Number(element.getAttribute('angle_offset'));
  const points = computePolygonPoints(cx, cy, edge, angleOffset, polygonSides);

  element.setAttribute('points', points);
  element.setAttribute('sides', String(polygonSides));
  resizeSelector(element);
};

export const polygonMouseDown = (x: number, y: number): SVGPolygonElement => {
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
      'stroke-width': 1,
    },
    element: 'polygon',
  });

  TopBarHintsController.setHint('POLYGON');

  return newPoly;
};

export const polygonMouseMove = (x: number, y: number, evt: MouseEvent, selected: SVGPolygonElement): void => {
  if (!started) return;

  const cx = Number(selected.getAttribute('cx'));
  const cy = Number(selected.getAttribute('cy'));
  const interiorAngle = (180 * (polygonSides - 2)) / polygonSides / 2;
  const edge = 2 * Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) * Math.cos((interiorAngle * Math.PI) / 180);
  const angleOffset = evt.shiftKey ? Math.PI / 2 - Math.PI / polygonSides : Math.atan2(y - cy, x - cx);

  selected.setAttribute('edge', String(edge));
  selected.setAttribute('angle_offset', String(angleOffset));
  renderPolygon(selected);
};

export const polygonMouseUp = (isContinuousDrawing: boolean): { element: null | SVGPolygonElement; keep: boolean } => {
  TopBarHintsController.removeHint();
  started = false;

  const element = newPoly!;
  const bbox = element.getBBox();
  const keep = bbox.width > 0 && bbox.height > 0;

  newPoly = null;

  if (!isContinuousDrawing) setMouseMode('select');

  return { element, keep };
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
