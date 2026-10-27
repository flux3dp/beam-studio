import type { Curve, Vector2 } from 'three';
import {
  CubicBezierCurve,
  EllipseCurve,
  ExtrudeGeometry,
  Mesh,
  Path,
  QuadraticBezierCurve,
  Shape,
  Vector3,
} from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { updateProjectionRect } from '@core/app/components/beambox/InnerEngraving/utils/projection';
import { getMatrix } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import { useStlStore } from '@core/app/stores/stlStore';
import { BaseHistoryCommand } from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { ICommand } from '@core/interfaces/IHistory';

import { STL_ATTR } from './constants';

export interface ExtrusionSource {
  /** Fixed physical depth; source X/Y units are converted with `scale`. */
  depth: number;
  /** Optional outline used for geometry when the editable source itself is not a path (text). */
  geometryMarkup?: string;
  markup: string;
  scale: number;
  type: 'svg';
}

export type ExtrusionSourceUnit = 'mm' | 'scene';

export interface CreateExtrusionSourceOptions {
  depth?: number;
  unit?: ExtrusionSourceUnit;
}

const UNIT_TO_MM: Record<ExtrusionSourceUnit, number> = {
  mm: 1,
  scene: 1 / MM_TO_SCENE,
};

export const extrusionSourceEvents = eventEmitterFactory.createEventEmitter();

export const serializeExtrusionSource = (source: ExtrusionSource): string => JSON.stringify(source);

export const parseExtrusionSourceValue = (value: null | string): ExtrusionSource | null => {
  if (!value) return null;

  try {
    const source = JSON.parse(value) as Partial<ExtrusionSource>;

    if (
      source.type !== 'svg' ||
      typeof source.markup !== 'string' ||
      !source.markup ||
      (source.geometryMarkup !== undefined && (typeof source.geometryMarkup !== 'string' || !source.geometryMarkup)) ||
      typeof source.scale !== 'number' ||
      !Number.isFinite(source.scale) ||
      source.scale <= 0 ||
      typeof source.depth !== 'number' ||
      !Number.isFinite(source.depth) ||
      source.depth <= 0
    ) {
      return null;
    }

    return source as ExtrusionSource;
  } catch {
    return null;
  }
};

export const parseExtrusionSource = (elem: Element): ExtrusionSource | null =>
  parseExtrusionSourceValue(elem.getAttribute(STL_ATTR.source));

export const getExtrusionSourceElement = (source: ExtrusionSource): null | SVGElement => {
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${source.markup}</svg>`,
    'image/svg+xml',
  );
  const elem = doc.documentElement.firstElementChild;

  return elem as null | SVGElement;
};

/** Max chord deviation when flattening curves: half a pixel at 2000 DPI (80 px/mm). */
const FLATTEN_TOLERANCE_MM = 1 / 80 / 2;
const MAX_SEGMENTS_PER_CURVE = 4096;
// ExtrudeGeometry's own default, kept for curve types without an error bound below
const FALLBACK_SEGMENTS = 12;

/** Segment count keeping `curve` within `tolerance` (source units) of its chords. */
const getSegmentCount = (curve: Curve<Vector2>, tolerance: number): number => {
  let count = FALLBACK_SEGMENTS;

  if (curve instanceof EllipseCurve) {
    const radius = Math.max(curve.xRadius, curve.yRadius);
    const step = radius > tolerance ? 2 * Math.acos(1 - tolerance / radius) : Math.PI / 2;
    // same normalisation as EllipseCurve.getPoint, so a clockwise partial arc gets its real sweep
    const twoPi = 2 * Math.PI;
    let delta = curve.aEndAngle - curve.aStartAngle;
    const isSamePoint = Math.abs(delta) < Number.EPSILON;

    while (delta < 0) delta += twoPi;
    while (delta > twoPi) delta -= twoPi;

    if (delta < Number.EPSILON) delta = isSamePoint ? 0 : twoPi;

    if (curve.aClockwise && !isSamePoint) delta = delta === twoPi ? -twoPi : delta - twoPi;

    count = Math.ceil(Math.abs(delta) / step);
  } else if (curve instanceof CubicBezierCurve) {
    const { v0, v1, v2, v3 } = curve;
    const m = Math.max(
      v0.clone().sub(v1.clone().multiplyScalar(2)).add(v2).length(),
      v1.clone().sub(v2.clone().multiplyScalar(2)).add(v3).length(),
    );

    count = Math.ceil(Math.sqrt((0.75 * m) / tolerance));
  } else if (curve instanceof QuadraticBezierCurve) {
    const { v0, v1, v2 } = curve;
    const m = v0.clone().sub(v1.clone().multiplyScalar(2)).add(v2).length();

    count = Math.ceil(Math.sqrt(m / (4 * tolerance)));
  } else if ((curve as { isLineCurve?: boolean }).isLineCurve) {
    return 1;
  }

  return Math.min(MAX_SEGMENTS_PER_CURVE, Math.max(1, count));
};

const flattenCurves = (curves: Array<Curve<Vector2>>, tolerance: number): Vector2[] => {
  const points: Vector2[] = [];

  curves.forEach((curve) => {
    curve.getPoints(getSegmentCount(curve, tolerance)).forEach((point) => {
      if (!points.at(-1)?.equals(point)) points.push(point);
    });
  });

  return points;
};

/**
 * ExtrudeGeometry cuts every curve into a fixed 12 (arcs 24) segments whatever its size, so a
 * 50mm circle would come out a visible 24-gon. Flatten by deviation instead, at engraving resolution.
 */
const flattenShape = (shape: Shape, tolerance: number): Shape => {
  const flat = new Shape(flattenCurves(shape.curves, tolerance));

  flat.holes = shape.holes.map((hole) => new Path(flattenCurves(hole.curves, tolerance)));

  return flat;
};

export const buildExtrusion = (
  source: ExtrusionSource,
): null | {
  buffer: ArrayBuffer;
  geometry: ExtrudeGeometry;
} => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">${source.geometryMarkup ?? source.markup}</svg>`;
  const shapes = new SVGLoader().parse(svg).paths.flatMap((shapePath) => SVGLoader.createShapes(shapePath));

  if (!shapes.length) return null;

  // source.scale converts source units to mm, so the mm tolerance is divided back into source units
  const tolerance = FLATTEN_TOLERANCE_MM / source.scale;
  const geometry = new ExtrudeGeometry(
    shapes.map((shape) => flattenShape(shape, tolerance)),
    { bevelEnabled: false, curveSegments: 1, depth: source.depth },
  );

  // SVG is y-down and the scene is y-up. A negative y scale would mirror the mesh and turn every
  // triangle inside out, so the flip is a half turn around x instead (y -> -y, z -> -z), with the
  // extrusion moved back up to 0..depth: the solid is symmetric along z, so it is the same shape
  // with its faces still pointing outward.
  geometry.rotateX(Math.PI);
  geometry.translate(0, 0, source.depth);
  geometry.scale(source.scale, source.scale, 1);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  if (!geometry.boundingBox) {
    geometry.dispose();

    return null;
  }

  const exported = new STLExporter().parse(new Mesh(geometry), { binary: true }) as DataView;
  const buffer = exported.buffer.slice(exported.byteOffset, exported.byteOffset + exported.byteLength) as ArrayBuffer;

  return { buffer, geometry };
};

/** Create a source normalized to millimetres from the specified SVG coordinate unit. */
export const createExtrusionSource = (
  elem: SVGElement,
  { depth = 1, unit = 'mm' }: CreateExtrusionSourceOptions = {},
): ExtrusionSource => ({
  depth,
  markup: new XMLSerializer().serializeToString(elem),
  scale: UNIT_TO_MM[unit],
  type: 'svg',
});

const applySource = (id: string, source: ExtrusionSource): void => {
  const elem = document.getElementById(id) as null | SVGRectElement;
  const object = useStlStore.getState().objects[id];
  const built = buildExtrusion(source);

  if (!elem || !object || !built) return;

  elem.setAttribute(STL_ATTR.source, serializeExtrusionSource(source));
  useStlStore.getState().replaceGeometry(id, built.buffer, built.geometry);

  const updated = { ...object, buffer: built.buffer, geometry: built.geometry };

  updateProjectionRect(elem, built.geometry, getMatrix(updated), {
    initialTransform: object.initialTransform,
    transform: object.transform,
  });
  extrusionSourceEvents.emit('changed', id);
};

class ExtrusionSourceCommand extends BaseHistoryCommand implements ICommand {
  type = (): string => 'ExtrusionSourceCommand';

  constructor(
    private id: string,
    private oldSource: ExtrusionSource,
    private newSource: ExtrusionSource,
  ) {
    super();
    this.text = 'Change 3D Source';
  }

  elements = (): Element[] => {
    const elem = document.getElementById(this.id);

    return elem ? [elem] : [];
  };

  doApply = (): void => applySource(this.id, this.newSource);

  doUnapply = (): void => applySource(this.id, this.oldSource);
}

export const setExtrusionSource = (
  elem: Element,
  source: ExtrusionSource,
  { mergeWithPreviousHistory, sourceElement }: { mergeWithPreviousHistory?: boolean; sourceElement?: Element } = {},
): void => {
  const oldSource = parseExtrusionSource(elem);

  if (!oldSource || serializeExtrusionSource(oldSource) === serializeExtrusionSource(source)) return;

  applySource(elem.id, source);

  const command = new ExtrusionSourceCommand(elem.id, oldSource, source);

  if (mergeWithPreviousHistory) {
    undoManager.appendCommandToLast(command, 'Change 3D Source', sourceElement);
  } else {
    undoManager.addCommandToHistory(command);
  }
};

/** Return the physical size in millimetres after applying the source's unit scale. */
export const getExtrusionSize = (source: ExtrusionSource): null | Vector3 => {
  const built = buildExtrusion(source);

  if (!built) return null;

  const size = built.geometry.boundingBox!.getSize(new Vector3());

  built.geometry.dispose();

  return size;
};

/** Change a retained regular-polygon source, used by the existing +/- shortcuts. */
export const changeExtrusionPolygonSides = (elem: Element, delta: number): number => {
  const source = parseExtrusionSource(elem);
  const sourceElem = source ? getExtrusionSourceElement(source) : null;

  if (!source || !sourceElem || sourceElem.tagName.toLowerCase() !== 'polygon') return 0;

  if (sourceElem.getAttribute('shape') !== 'regularPoly') return 0;

  const current = Number(sourceElem.getAttribute('sides'));
  const sides = Math.max(current + delta, 3);

  if (!Number.isFinite(current) || sides === current) return current || 0;

  const cx = Number(sourceElem.getAttribute('cx'));
  const cy = Number(sourceElem.getAttribute('cy'));
  const edge = Number(sourceElem.getAttribute('edge'));
  const angleOffset = Number(sourceElem.getAttribute('angle_offset'));
  const inRadius = edge / 2 / Math.tan(Math.PI / sides);
  const radius = inRadius / Math.cos(Math.PI / sides);
  const points = Array.from({ length: sides }, (_, index) => {
    const angle = (2 * Math.PI * index) / sides + angleOffset;

    return `${radius * Math.cos(angle) + cx},${radius * Math.sin(angle) + cy}`;
  }).join(' ');

  sourceElem.setAttribute('points', points);
  sourceElem.setAttribute('sides', String(sides));
  setExtrusionSource(elem, {
    ...source,
    markup: new XMLSerializer().serializeToString(sourceElem),
  });

  return sides;
};
