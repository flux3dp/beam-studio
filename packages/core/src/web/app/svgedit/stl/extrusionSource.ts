import { ExtrudeGeometry, Mesh, Vector3 } from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

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
  markup: string;
  scale: number;
  type: 'svg';
}

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

export const buildExtrusion = (
  source: ExtrusionSource,
): null | {
  buffer: ArrayBuffer;
  geometry: ExtrudeGeometry;
} => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">${source.markup}</svg>`;
  const shapes = new SVGLoader().parse(svg).paths.flatMap((shapePath) => SVGLoader.createShapes(shapePath));

  if (!shapes.length) return null;

  const geometry = new ExtrudeGeometry(shapes, { bevelEnabled: false, depth: source.depth });

  geometry.scale(source.scale, -source.scale, 1);
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

/** Create a source whose longest XY dimension can be scaled by the caller before insertion. */
export const createExtrusionSource = (elem: SVGElement, depth = 1): ExtrusionSource => ({
  depth,
  markup: new XMLSerializer().serializeToString(elem),
  scale: 1,
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

export const setExtrusionSource = (elem: Element, source: ExtrusionSource): void => {
  const oldSource = parseExtrusionSource(elem);

  if (!oldSource || serializeExtrusionSource(oldSource) === serializeExtrusionSource(source)) return;

  applySource(elem.id, source);
  undoManager.addCommandToHistory(new ExtrusionSourceCommand(elem.id, oldSource, source));
};

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
