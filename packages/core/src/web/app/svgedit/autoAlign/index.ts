/**
 * Auto Align: snap points/edges collected from unselected elements and the workarea, matched
 * against the pointer while drawing, moving or resizing, and drawn as guide lines.
 * Extracted from svgcanvas.ts; state lives here so other point sources (e.g. objects detected in
 * the camera preview) can feed collectAlignPoints without touching the canvas.
 */
import { CanvasElements } from '@core/app/constants/canvasElements';
import NS from '@core/app/constants/namespaces';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { setAttributes } from '@core/helpers/element/attribute';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import round from '@core/helpers/math/round';
import type { IPoint } from '@core/interfaces/ISVGCanvas';

import selectionManager from '../selection';
import textEdit from '../text/textedit';
import { getRotationAngle } from '../transform/rotation';
import { binarySearchLowerBoundIndex } from '../utils/binarySearchIndex';
import { findNearestAndFarthestAlignPoints } from '../utils/findNearestAndFarthestAlignPoints';
import { getBBox } from '../utils/getBBox';
import { isLineCoincide } from '../utils/isLineCoincide';
import workareaManager from '../workarea';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

type Edge = Record<'x1' | 'x2' | 'y1' | 'y2', number>;

type Matched = Record<'farthest' | 'nearest', Record<'x' | 'y', IPoint | null>>;

/** 8 bbox points (3×3 grid minus centre) for unrotated visible elements. */
const getElemAlignPoints = (elem: SVGGraphicsElement): IPoint[] => {
  if (!CanvasElements.visibleElems.includes(elem.tagName) || getRotationAngle(elem)) return [];

  const bbox = getBBox(elem);
  const points: IPoint[] = [];
  const levels = [0, 0.5, 1] as const;

  for (const col of levels) {
    for (const row of levels) {
      if (col === 0.5 && row === 0.5) continue;

      points.push({ x: bbox.x + row * bbox.width, y: bbox.y + col * bbox.height });
    }
  }

  return points;
};

export class AutoAlignManager {
  private alignPoints: Record<'x' | 'y', IPoint[]> = { x: [], y: [] };

  private alignEdges: Edge[] = [];

  private workareaPoints: IPoint[] = [];

  /** Call once after workareaManager.init(); keeps the workarea points current afterwards. */
  init = (): void => {
    this.updateWorkareaPoints();
    canvasEventEmitter.on('boundary-updated', () => {
      this.updateWorkareaPoints();
      this.collectAlignPoints();
    });
    useGlobalPreferenceStore.subscribe(
      (state) => state.auto_align,
      (enabled) => {
        if (!enabled) this.clearAlignLines();
      },
    );
  };

  isEnabled = (): boolean => useGlobalPreferenceStore.getState().auto_align;

  toggle = (): boolean => {
    const { auto_align: value, set } = useGlobalPreferenceStore.getState();

    set('auto_align', !value);

    return !value;
  };

  clearAlignLines = (): void => {
    document.querySelectorAll('[id^="align_line"], [id^="align_text"]').forEach((el) => el.remove());
  };

  /** Rebuild the snap points/edges from unselected visible elements plus the workarea. */
  collectAlignPoints = (): void => {
    const elements: SVGGraphicsElement[] = [];

    for (const layer of document.querySelectorAll('#svgcontent > g.layer')) {
      if (layer.getAttribute('display') === 'none' || !layer.childNodes.length) continue;

      elements.push(...(layer.childNodes as unknown as SVGGraphicsElement[]));
    }

    const selectedElements = selectionManager.getSelectedElements();
    const unFlatedPoints = elements.filter((elem) => !selectedElements.includes(elem)).map(getElemAlignPoints);
    const edges = unFlatedPoints
      .filter(({ length }) => length === 8)
      .flatMap((points) => {
        const [{ x: sx, y: sy }, { x: ex, y: ey }] = [points[0], points[7]];

        return [
          { x1: sx, x2: ex, y1: sy, y2: sy },
          { x1: sx, x2: sx, y1: sy, y2: ey },
          { x1: ex, x2: ex, y1: sy, y2: ey },
          { x1: sx, x2: ex, y1: ey, y2: ey },
        ];
      });
    const points = [...unFlatedPoints.flat(), ...this.workareaPoints];

    this.alignPoints = { x: points.toSorted((a, b) => a.x - b.x), y: points.toSorted((a, b) => a.y - b.y) };
    this.alignEdges = edges;
  };

  findMatchedAlignPoints = (x: number, y: number): Matched => {
    // for consistent align experience
    const FUZZY_RANGE = 8 / workareaManager.zoomRatio;

    if (!this.alignPoints.x.length) return { farthest: { x: null, y: null }, nearest: { x: null, y: null } };

    const [nearestX, farthestX] = findNearestAndFarthestAlignPoints(this.alignPoints, { x, y }, 'x', FUZZY_RANGE);
    const [nearestY, farthestY] = findNearestAndFarthestAlignPoints(this.alignPoints, { x, y }, 'y', FUZZY_RANGE);

    return { farthest: { x: farthestX, y: farthestY }, nearest: { x: nearestX, y: nearestY } };
  };

  drawAlignLine = (tx: number, ty: number, x: IPoint | null, y: IPoint | null, index: number = 0): void => {
    const stroke = { nearest: '#F707F0', normal: '#1890EF' } as const;
    const workareaXs = this.workareaPoints.map((p) => p.x);
    const workareaYs = this.workareaPoints.map((p) => p.y);
    const detectIfLineCoincide = (line: Edge) => {
      if (!line.x1 || !line.x2 || !line.y1 || !line.y2) return false;

      return this.alignEdges.some((line2) => isLineCoincide(line, line2));
    };

    const draw = (by: 'x' | 'y') => {
      const [major, minor] = by === 'x' ? [x, y] : [y, x];

      if (!major) return;

      const isCanvas = workareaXs.includes(major.x) && workareaYs.includes(major.y);
      const startPoints = by === 'x' ? [major.x, minor ? minor.y : ty] : [minor ? minor.x : tx, major.y];
      const line = { x1: startPoints[0], x2: major.x, y1: startPoints[1], y2: major.y };
      const needText = !isCanvas && index < 10 && !detectIfLineCoincide(line);
      const alignLine = document.createElementNS(NS.SVG, 'path');
      const alignText = document.createElementNS(NS.SVG, 'text');
      const svgcontent = document.getElementById('svgcontent')!;

      svgcontent.appendChild(alignLine);
      svgcontent.appendChild(alignText);

      setAttributes(alignLine, {
        fill: 'none',
        id: `align_line_${by}_${index}`,
        stroke: needText ? stroke.nearest : stroke.normal,
        'stroke-width': isCanvas ? '2' : '1',
        'vector-effect': 'non-scaling-stroke',
      });
      setAttributes(alignText, {
        fill: stroke.nearest,
        'font-family': 'Arial',
        'font-size': String(20 / Math.sqrt(workareaManager.zoomRatio)),
        id: `align_text_${by}_${index}`,
        stroke: stroke.nearest,
        'stroke-width': '1',
        'vector-effect': 'non-scaling-stroke',
      });

      const distance = Math.max(Math.abs(major.x - startPoints[0]), Math.abs(major.y - startPoints[1]));
      const offset = 5 / workareaManager.zoomRatio;

      alignLine.setAttribute('d', `M ${major.x} ${major.y} L ${startPoints[0]} ${startPoints[1]}`);
      alignLine.setAttribute('display', 'inline');

      alignText.setAttribute('x', String((major.x + startPoints[0]) / 2 + (by === 'x' ? offset : -2 * offset)));
      alignText.setAttribute('y', String((major.y + startPoints[1]) / 2 + (by === 'y' ? -offset : 0)));

      if (distance < 10 || !needText) {
        alignText.setAttribute('display', 'none');
      } else {
        textEdit.renderText(alignText, round(distance / 10, 2).toString());
      }
    };

    draw('x');
    draw('y');
  };

  addAlignEdges = (edges: Edge[]): void => {
    this.alignEdges.push(...edges);
  };

  removeAlignEdges = (n: number): void => {
    for (let i = 0; i < n; i++) this.alignEdges.pop();
  };

  getSelectedElementsAlignPoints = (): IPoint[] =>
    selectionManager.getSelectedElements().flatMap((elem) => getElemAlignPoints(elem as SVGGraphicsElement));

  /** Insert one point keeping both sorted lists ordered (used while drawing a path). */
  addAlignPoint = (x: number, y: number): void => {
    const newPoint = { x, y };
    const insert = (points: IPoint[], dimension: 'x' | 'y') => {
      const { length } = points;
      const pos = binarySearchLowerBoundIndex(
        points.map((point) => point[dimension]),
        newPoint[dimension],
      );

      if (pos === length - 1 && newPoint[dimension] > points[pos]?.[dimension]) points.push(newPoint);
      else points.splice(pos, 0, newPoint);
    };

    insert(this.alignPoints.x, 'x');
    insert(this.alignPoints.y, 'y');
  };

  private updateWorkareaPoints = (): void => {
    const {
      boundary: { maxX, maxY, minX, minY },
    } = workareaManager;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    this.workareaPoints = [
      { x: minX, y: minY },
      { x: midX, y: minY },
      { x: maxX, y: minY },
      { x: minX, y: midY },
      { x: maxX, y: midY },
      { x: minX, y: maxY },
      { x: midX, y: maxY },
      { x: maxX, y: maxY },
    ];
  };
}

const autoAlign = new AutoAlignManager();

export default autoAlign;
