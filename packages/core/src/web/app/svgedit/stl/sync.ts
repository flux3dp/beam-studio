import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';

import { is3dProjection } from './getters';

/**
 * Projection elements at or below `elems`, in DOM order and without duplicates.
 *
 * Most element operations receive a projection rect directly. Layer operations receive the
 * containing `<g class="layer">` instead, so looking only at the roots leaves every object in a
 * deleted or duplicated layer behind on the 3D canvas.
 */
export const collectStlProjectionElements = (elems: Array<Element | null | undefined>): Element[] => {
  const projections = new Set<Element>();

  elems.forEach((elem) => {
    if (!elem) return;

    if (is3dProjection(elem)) projections.add(elem);
    elem.querySelectorAll('*').forEach((child) => {
      if (is3dProjection(child)) projections.add(child);
    });
  });

  return [...projections];
};

/**
 * The STL objects behind `elems` — the elements themselves plus any projection rects inside them.
 *
 * Reads the store rather than the DOM, so an element whose mesh has already gone (a rect left over
 * from a broken file) is simply skipped instead of producing a half object.
 */
export const collectStlObjects = (elems: Array<Element | null | undefined>): StlObject[] => {
  const { objects } = useStlStore.getState();

  return collectStlProjectionElements(elems)
    .map(({ id }) => objects[id])
    .filter(Boolean);
};

/**
 * Re-key the runtime objects belonging to an in-place DOM copy.
 *
 * `drawing.copyElem` preserves descendant order and gives every copied element a fresh id. The
 * immutable geometry and source buffers can be shared; only the projection id identifies the new
 * object. This is intentionally for in-place copies such as layer duplication — clipboard paste
 * additionally has to fold its placement offset into the transform.
 */
export const createClonedStlObjects = (source: Element, copy: Element): StlObject[] => {
  const { objects } = useStlStore.getState();
  const sourceProjections = collectStlProjectionElements([source]);
  const copiedProjections = collectStlProjectionElements([copy]);

  if (sourceProjections.length !== copiedProjections.length) {
    console.error('The copied layer does not contain the same number of 3D projections as its source');
  }

  return sourceProjections.flatMap((sourceProjection, index) => {
    const object = objects[sourceProjection.id];
    const copiedProjection = copiedProjections[index];

    return object && copiedProjection ? [{ ...object, id: copiedProjection.id }] : [];
  });
};

/**
 * Bring the STL store back in line with the DOM for the given objects.
 *
 * The projection rect is what the rest of the app treats as the object's existence (the same rule
 * `stl/sources.ts` follows), but the mesh lives outside the DOM and no element command can carry
 * it. Anything that inserts or removes a projection rect — import, .beam load, delete, paste — has
 * to call this both when it acts and from its command's `onAfter`, so undo and redo move the mesh
 * alongside the rect. Adding an object that is already there, or removing one that is already gone,
 * is a no-op.
 */
export const syncStlObjectsWithDom = (objects: StlObject[]): void => {
  objects.forEach((object) => {
    if (document.getElementById(object.id)) useStlStore.getState().set(object);
    else useStlStore.getState().remove(object.id);
  });
};
