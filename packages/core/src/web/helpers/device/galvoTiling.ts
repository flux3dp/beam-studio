import { sprintf } from 'sprintf-js';

import Alert from '@core/app/actions/alert-caller';
import { dpmm } from '@core/app/actions/beambox/constant';
import AlertConstants from '@core/app/constants/alert-constants';
import { GalvoTiling } from '@core/app/constants/galvo-tiling';
import { galvoModulesArray } from '@core/app/constants/layer-module/layer-modules';
import { useDocumentStore } from '@core/app/stores/documentStore';
import selectionManager from '@core/app/svgedit/selection';
import { getBBox } from '@core/app/svgedit/utils/getBBox';
import i18n from '@core/helpers/i18n';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getLayersByModule } from '@core/helpers/layer-module/layer-module-helper';

import type { GalvoModule } from './galvoConfig';
import { getGalvoConfig } from './galvoConfig';

/**
 * How far an object may overrun the field and still pass, mm. Only absorbs the difference
 * between this bounding box and the one swiftray computes; swiftray uses the same tolerance.
 */
export const GALVO_FIELD_TOLERANCE_MM = 0.001;

/** Layer children that are not drawn objects. */
const nonObjectTags = new Set(['defs', 'filter', 'title']);

/**
 * The first-level objects of a layer -- what swiftray keeps whole under "by object" tiling.
 * A multi-selection parks its elements in a temporary group outside the layer until the export
 * puts them back, so those count too.
 */
export const getLayerObjects = (layer: SVGGElement): SVGGraphicsElement[] => {
  const objects = Array.from(layer.children).filter(
    (child) => !nonObjectTags.has(child.tagName),
  ) as SVGGraphicsElement[];
  const title = layer.querySelector(':scope > title')?.textContent;

  if (title) {
    const parked = document.querySelectorAll<SVGGraphicsElement>(
      `#svgcontent > g[data-tempgroup="true"] > [data-original-layer="${CSS.escape(title)}"]`,
    );

    objects.push(...Array.from(parked));
  }

  return objects;
};

/**
 * Objects on visible, non-empty HEXA G galvo layers tiled by object that do not fit in one field.
 * @returns the offending objects and the field they were measured against (the largest, if the
 * offending layers use different heads)
 */
export const checkObjectTilingItems = async (): Promise<{ field: number; items: SVGGraphicsElement[] }> => {
  const result = { field: 0, items: [] as SVGGraphicsElement[] };

  if (useDocumentStore.getState().workarea !== 'fhx2galvo') return result;

  const layers = Array.from(
    getLayersByModule([...galvoModulesArray], { checkRepeat: true, checkVisible: true }),
  ).filter((layer) => getData(layer, 'galvoTiling') === GalvoTiling.Object);

  for (const layer of layers) {
    const module = getData(layer, 'module') as GalvoModule;
    const { workarea: field } = await getGalvoConfig(module);
    const limit = field + GALVO_FIELD_TOLERANCE_MM;
    const oversize = getLayerObjects(layer).filter((object) => {
      // the axis-aligned box of the object as transformed, rotation included
      const { height, width } = getBBox(object, { ignoreRotation: false });

      return width / dpmm > limit || height / dpmm > limit;
    });

    if (oversize.length) {
      result.items.push(...oversize);
      result.field = Math.max(result.field, field);
    }
  }

  return result;
};

/**
 * Run before any conversion of a HEXA G task: objects too large for "by object" tiling would
 * otherwise be refused by swiftray, or not reach it at all.
 * @returns true if the task may be converted
 */
export const ensureObjectTilingFits = async (): Promise<boolean> => {
  const { field, items } = await checkObjectTilingItems();

  if (!items.length) return true;

  const t = i18n.lang.beambox.right_panel.laser_panel.galvo_tiling;

  Alert.popUp({
    buttonLabels: [t.select_objects],
    buttonType: AlertConstants.CUSTOM_CANCEL,
    // multiSelect, not selectOnly: only the temp group it builds makes several objects one selection
    callbacks: () => selectionManager.multiSelect(items),
    id: 'galvo-tiling-oversize',
    message: sprintf(t.oversize, items.length, field),
    type: AlertConstants.SHOW_POPUP_ERROR,
  });

  return false;
};
