import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import {
  buildExtrusion,
  createExtrusionSource,
  getExtrusionSize,
  serializeExtrusionSource,
} from '@core/app/svgedit/stl/extrusionSource';

import { getPathScale } from './getPathScale';

import { insertStlGeometry } from '.';

const DEFAULT_HEIGHT_MM = 1;

/** Convert a normalized Element-panel path into a closed 1mm mesh understood by swiftray. */
export const importPathAsStl = async (pathData: string): Promise<void> => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  path.setAttribute('d', pathData);
  await importSvgElementAsStl(path);
};

/** Extrude an SVG element, optionally retaining its editable source on the projection rect. */
export const importSvgElementAsStl = async (elem: SVGElement, preserveSource = false): Promise<void> => {
  const source = createExtrusionSource(elem, DEFAULT_HEIGHT_MM);
  const size = getExtrusionSize(source);

  if (!size) return;

  source.scale = getPathScale(size.x, size.y, getEngravableBox());

  const built = buildExtrusion(source);

  if (!built) return;

  // Z is deliberately not scaled: every generated element receives the same 1mm thickness.
  await insertStlGeometry(
    built.buffer,
    built.geometry,
    preserveSource ? { [STL_ATTR.source]: serializeExtrusionSource(source) } : {},
    // Generated geometry has already been sized directly from the safe engravable box. Do not run
    // it through the imported-STL confirmation flow (and do not uniformly rescale its fixed 1mm Z).
    { skipFitPrompt: true },
  );
};
