import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';

import { isStlProjection } from './getters';

/**
 * The STL objects behind `elems` — the elements themselves plus any projection rects inside them.
 *
 * Reads the store rather than the DOM, so an element whose mesh has already gone (a rect left over
 * from a broken file) is simply skipped instead of producing a half object.
 */
export const collectStlObjects = (elems: Array<Element | null | undefined>): StlObject[] => {
  const { objects } = useStlStore.getState();
  const ids = new Set<string>();

  elems.forEach((elem) => {
    if (elem && isStlProjection(elem)) ids.add(elem.id);
  });

  return [...ids].map((id) => objects[id]).filter(Boolean);
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
