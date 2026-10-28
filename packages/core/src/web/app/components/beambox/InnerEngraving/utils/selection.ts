import { useStlStore } from '@core/app/stores/stlStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import selectionManager from '@core/app/svgedit/selection';
import { is3dProjection } from '@core/app/svgedit/stl/getters';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';

/**
 * Select an STL object on both sides at once.
 *
 * An STL object is two things — the mesh in the store and the projection rect in `svgcontent` — and
 * each has its own idea of "selected": the 3D canvas reads `stlStore.selectedId`, while everything
 * in the right panel, the layer panel and the menus reads svgedit's selection. Clicking a mesh has
 * to move both, or the object panel simply never appears for something picked in 3D.
 *
 * The object's layer becomes the selected one too. On the 2D canvas that is the mouse handler's job,
 * not svgedit's selection, so a pick in 3D never reaches it and the layer panel would stay on the
 * previous object's layer.
 *
 * Safe to call with an id that is already selected: both sides no-op on an unchanged value, so the
 * canvas effect that mirrors svgedit's selection back into the store cannot loop.
 */
export const selectStlObject = (id: null | string): void => {
  useStlStore.getState().setSelectedId(id);

  const elem = id ? (document.getElementById(id) as null | SVGRectElement) : null;

  if (!elem) {
    selectionManager.clearSelection();

    return;
  }

  selectionManager.selectOnly([elem]);

  const layer = getObjectLayer(elem);

  if (layer && layer.elem !== layerManager.getCurrentLayerElement()) layerManager.setSelectedLayers([layer.title]);
};

/** The id of the currently selected STL object, or null when the selection is something else. */
export const getSelectedStlId = (elem: Element | null): null | string =>
  elem && is3dProjection(elem) ? elem.id : null;
