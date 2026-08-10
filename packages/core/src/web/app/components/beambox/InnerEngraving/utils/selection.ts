import { useStlStore } from '@core/app/stores/stlStore';
import selectionManager from '@core/app/svgedit/selection';
import { isStlProjection } from '@core/app/svgedit/stl/getters';

/**
 * Select an STL object on both sides at once.
 *
 * An STL object is two things — the mesh in the store and the projection rect in `svgcontent` — and
 * each has its own idea of "selected": the 3D canvas reads `stlStore.selectedId`, while everything
 * in the right panel, the layer panel and the menus reads svgedit's selection. Clicking a mesh has
 * to move both, or the object panel simply never appears for something picked in 3D.
 *
 * Safe to call with an id that is already selected: both sides no-op on an unchanged value, so the
 * canvas effect that mirrors svgedit's selection back into the store cannot loop.
 */
export const selectStlObject = (id: null | string): void => {
  useStlStore.getState().setSelectedId(id);

  const elem = id ? (document.getElementById(id) as null | SVGRectElement) : null;

  if (elem) selectionManager.selectOnly([elem]);
  else selectionManager.clearSelection();
};

/** The id of the currently selected STL object, or null when the selection is something else. */
export const getSelectedStlId = (elem: Element | null): null | string =>
  elem && isStlProjection(elem) ? elem.id : null;
