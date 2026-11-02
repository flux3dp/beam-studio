import { useStlStore } from '@core/app/stores/stlStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import selectionManager from '@core/app/svgedit/selection';
import { is3dProjection } from '@core/app/svgedit/stl/getters';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';

/**
 * Select STL objects on both sides at once.
 *
 * An STL object is two things — the mesh in the store and the projection rect in `svgcontent` — and
 * each has its own idea of "selected": the 3D canvas reads `stlStore.selectedIds`, while everything
 * in the right panel, the layer panel and the menus reads svgedit's selection. Clicking a mesh has
 * to move both, or the object panel simply never appears for something picked in 3D.
 *
 * The objects' layers become the selected ones too. On the 2D canvas that is the mouse handler's
 * job, not svgedit's selection, so a pick in 3D never reaches it and the layer panel would stay on
 * the previous object's layer.
 *
 * Safe to call with ids that are already selected: both sides no-op on an unchanged value, so the
 * canvas effect that mirrors svgedit's selection back into the store cannot loop.
 */
export const selectStlObjects = (ids: string[]): void => {
  const elems = ids
    .map((id) => document.getElementById(id) as null | SVGRectElement)
    .filter((elem): elem is SVGRectElement => Boolean(elem));

  useStlStore.getState().setSelectedIds(elems.map(({ id }) => id));

  if (elems.length === 0) {
    selectionManager.clearSelection();

    return;
  }

  selectionManager.selectOnly(elems);

  const layers = [...new Set(elems.map((elem) => getObjectLayer(elem)?.title).filter(Boolean))] as string[];

  // a no-op when the layers are already the selected ones
  if (layers.length > 0) layerManager.setSelectedLayers(layers);
};

/** Select one STL object, or clear the selection with null. */
export const selectStlObject = (id: null | string): void => selectStlObjects(id ? [id] : []);

/** Shift-click: add the object to the selection, or take it out if it is already in. */
export const toggleStlObjectSelection = (id: string): void => {
  const { selectedIds } = useStlStore.getState();

  selectStlObjects(selectedIds.includes(id) ? selectedIds.filter((selected) => selected !== id) : [...selectedIds, id]);
};

/** The ids of the selected STL objects; empty when the selection is something else. */
export const getSelectedStlIds = (elems: Element[]): string[] =>
  elems.every(is3dProjection) ? elems.map(({ id }) => id) : [];
