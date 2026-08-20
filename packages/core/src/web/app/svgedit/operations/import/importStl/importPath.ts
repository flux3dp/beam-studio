import { ExtrudeGeometry, Mesh, Vector3 } from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';

import { getPathScale } from './getPathScale';

import { insertStlGeometry } from '.';

const DEFAULT_HEIGHT_MM = 1;

/** Convert a normalized Element-panel path into a closed 1mm mesh understood by swiftray. */
export const importPathAsStl = async (pathData: string): Promise<void> => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  path.setAttribute('d', pathData);
  svg.appendChild(path);

  const shapes = new SVGLoader()
    .parse(new XMLSerializer().serializeToString(svg))
    .paths.flatMap((shapePath) => SVGLoader.createShapes(shapePath));

  if (shapes.length === 0) return;

  const geometry = new ExtrudeGeometry(shapes, {
    bevelEnabled: false,
    depth: DEFAULT_HEIGHT_MM,
  });

  geometry.computeBoundingBox();

  if (!geometry.boundingBox) return;

  const size = geometry.boundingBox.getSize(new Vector3());
  const scale = getPathScale(size.x, size.y, getEngravableBox());

  // SVG is Y-down while the STL model space is Y-up. Z is deliberately not scaled: the safe XY
  // size is decided first, then every built-in element receives the same 1mm thickness.
  geometry.scale(scale, -scale, 1);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const exported = new STLExporter().parse(new Mesh(geometry), { binary: true }) as DataView;
  const buffer = exported.buffer.slice(exported.byteOffset, exported.byteOffset + exported.byteLength) as ArrayBuffer;

  await insertStlGeometry(buffer, geometry);
};
