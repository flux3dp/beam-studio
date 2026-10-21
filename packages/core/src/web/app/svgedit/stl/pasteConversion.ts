import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { create3dObject, getInitialTransform } from '@core/app/svgedit/operations/import/importStl';
import { getPathScale } from '@core/app/svgedit/operations/import/importStl/getPathScale';
import { outlineText } from '@core/app/svgedit/operations/import/importStl/importText';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { STL_ATTR } from './constants';
import { downgradeInnerEngravingElements } from './downgrade';
import {
  buildExtrusion,
  createExtrusionSource,
  getExtrusionSize,
  getExtrusionSourceElement,
  parseExtrusionSource,
  serializeExtrusionSource,
} from './extrusionSource';
import { initializePhotoPlane } from './photoPlane';

const DEPTH_MM = 1;

/**
 * Paste across the 2D / 3D boundary.
 *
 * The clipboard does not know which canvas it will be pasted into, so the conversion happens at
 * paste time: a 3D object dropped on a 2D canvas becomes the 2D element it was made from, and a 2D
 * element dropped on the inner engraving canvas is extruded (or, for an image, laid flat as a photo
 * plane) the same way the element panel and the text tool do it.
 */

/**
 * The 2D element a 3D object stands in for, detached from any document, or null when it has none.
 *
 * A photo plane is its image with the `data-stl*` metadata stripped. An extruded element keeps its
 * editable source on the projection rect, and every retained source is in scene units, so the
 * markup is canvas geometry as it stood when the object was made. A mesh from an STL file and a
 * point cloud have nothing 2D behind them.
 */
export const get2dCounterpart = (elem: Element, source: StlObject): Element | null => {
  if (source.kind === 'point-cloud') return null;

  if (source.kind === 'photo') {
    const copy = elem.cloneNode(true) as Element;

    downgradeInnerEngravingElements(copy);

    return copy;
  }

  const extrusion = parseExtrusionSource(elem);
  const counterpart = extrusion ? getExtrusionSourceElement(extrusion) : null;

  return counterpart ? document.importNode(counterpart, true) : null;
};

/**
 * Turn a 2D element that has just been pasted into the current layer into a 3D object, recording
 * the change in `batchCmd`. Returns the object, or null when the element cannot be converted (its
 * markup yields no closed shape), in which case the element is left as it is for the caller to drop.
 *
 * Like every other 2D-to-3D import, the result is centred on the engravable box: a paste offset
 * measured on the 2D canvas means nothing in the 3D scene.
 */
export const convertPastedTo3d = async (elem: SVGElement, batchCmd: IBatchCommand): Promise<null | StlObject> => {
  if (elem.tagName === 'image') return initializePhotoPlane(elem as SVGImageElement);

  const source = createExtrusionSource(elem, { depth: DEPTH_MM, unit: 'scene' });

  if (elem.tagName === 'text') {
    const geometryMarkup = await outlineText(elem as SVGTextElement);

    if (!geometryMarkup) return null;

    source.geometryMarkup = geometryMarkup;
  }

  const size = getExtrusionSize(source);

  if (!size) return null;

  source.scale *= getPathScale(size.x, size.y, getEngravableBox());

  const built = buildExtrusion(source);

  if (!built) return null;

  const initialTransform = await getInitialTransform(built.geometry, { skipFitPrompt: true });
  const { cmd, id } = create3dObject(built.buffer, built.geometry, {
    attributes: { [STL_ATTR.source]: serializeExtrusionSource(source) },
    historyLabel: 'Paste as 3D object',
    initialTransform,
    replaceElement: elem,
  });

  batchCmd.addSubCommand(cmd);

  return useStlStore.getState().objects[id] ?? null;
};
