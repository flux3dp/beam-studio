import { getProjection, updateProjectionRect } from '@core/app/components/beambox/InnerEngraving/utils/projection';
import { getMatrix, setTransform } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import type { StlObject, StlTransform } from '@core/app/stores/stlStore';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { collectStlObjects } from './sync';
import { parseStlTransform } from './transformAttr';

/**
 * The transform the 3D object needs in order to sit where its projection rect now is, or null when
 * the two already agree.
 *
 * The clipboard actions move the rect in 2D — at the mouse, by a paste step, by a duplicate offset,
 * by an array's grid interval. The 3D object is the source of truth, so rather than teaching each
 * of them about meshes, the move is measured off the rect afterwards and folded back in.
 */
const getMovedTransform = (object: StlObject, elem: Element): null | StlTransform => {
  const projection = getProjection(object.geometry, getMatrix(object));
  const dx = Number(elem.getAttribute('x')) - projection.x;
  const dy = Number(elem.getAttribute('y')) - projection.y;

  if (!dx && !dy) return null;

  const [x, y, z] = object.transform.position;

  // scene Y and canvas Y run in opposite directions, so a downward 2D move is a −Y move in 3D
  return { ...object.transform, position: [x + dx, y - dy, z] };
};

/**
 * Build the STL 3D object that belongs to a freshly pasted projection rect.
 *
 * Paste only ever produces the rect — the mesh is not in the DOM, so it has to be rebuilt from the
 * object the copy came from. The mesh and the file bytes are **shared** with the source rather than
 * cloned: neither is ever mutated, and a duplicated model would double the memory of something that
 * routinely runs to tens of megabytes. (`stlStore.remove` disposes the geometry, which for a shared
 * one only drops the GPU buffers; three.js re-uploads them on the next frame.)
 *
 * The paste offset is folded in here rather than recorded as its own history step, so that the
 * object handed back is already the finished one — which is what undo and redo put in and take out.
 */
export const createPastedStlObject = (elem: SVGRectElement, source: StlObject): StlObject => {
  // the pasted rect carries its own copy of the attribute; the source is the fallback for a rect
  // that lost it (an older file, or a hand-edited svg)
  const { initialTransform, transform } = parseStlTransform(elem) ?? {
    initialTransform: source.initialTransform,
    transform: source.transform,
  };
  const object: StlObject = {
    buffer: source.buffer,
    geometry: source.geometry,
    id: elem.id,
    initialTransform,
    transform,
  };
  const pasted = { ...object, transform: getMovedTransform(object, elem) ?? transform };

  // rewrites everything the rect derives from the transform — above all `data-stl-matrix`, which is
  // what the backend engraves from and which a 2D move leaves pointing at the old position
  updateProjectionRect(elem, pasted.geometry, getMatrix(pasted), {
    initialTransform,
    transform: pasted.transform,
  });

  return pasted;
};

/**
 * Move the STL objects among `elems` to wherever their projection rects have ended up.
 *
 * For the actions that move the rects **after** pasting them — duplicate and array. Paste's own
 * offset is already handled by {@link createPastedStlObject}; this is the same correction as a
 * separate history step, which is what it has to be once the object exists.
 *
 * `parentCmd` matters for ordering: the correction has to unapply before the move it corrects, and
 * apply after it.
 */
export const syncStlTransformsFromRects = (elems: Element[], parentCmd?: IBatchCommand): void => {
  collectStlObjects(elems).forEach((object) => {
    const elem = document.getElementById(object.id);
    const transform = elem ? getMovedTransform(object, elem) : null;

    if (transform) setTransform(object, transform, { parentCmd });
  });
};
