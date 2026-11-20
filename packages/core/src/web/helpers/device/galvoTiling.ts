import { sprintf } from 'sprintf-js';

import Alert from '@core/app/actions/alert-caller';
import { dpmm } from '@core/app/actions/beambox/constant';
import AlertConstants from '@core/app/constants/alert-constants';
import type { GalvoTilingType } from '@core/app/constants/galvo-tiling';
import { GalvoTiling } from '@core/app/constants/galvo-tiling';
import { galvoModulesArray } from '@core/app/constants/layer-module/layer-modules';
import { useDocumentStore } from '@core/app/stores/documentStore';
import selectionManager from '@core/app/svgedit/selection';
import alertConfig from '@core/helpers/api/alert-config';
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

type OversizeResult = { field: number; items: SVGGraphicsElement[] };

/**
 * Objects that do not fit in one field, on the visible, non-empty HEXA G galvo layers of one
 * tiling.
 * @returns the objects and the field they were measured against (the largest, if their layers
 * use different heads)
 */
const getOversizeObjects = async (
  tiling: GalvoTilingType,
  accept: (object: SVGGraphicsElement) => boolean = () => true,
): Promise<OversizeResult> => {
  const result: OversizeResult = { field: 0, items: [] };

  if (useDocumentStore.getState().workarea !== 'fhx2galvo') return result;

  const layers = Array.from(
    getLayersByModule([...galvoModulesArray], { checkRepeat: true, checkVisible: true }),
  ).filter((layer) => getData(layer, 'galvoTiling') === tiling);

  for (const layer of layers) {
    const module = getData(layer, 'module') as GalvoModule;
    const { workarea: field } = await getGalvoConfig(module);
    const limit = field + GALVO_FIELD_TOLERANCE_MM;
    const oversize = getLayerObjects(layer).filter((object) => {
      // the axis-aligned box of the object as transformed, rotation included
      const { height, width } = getBBox(object, { ignoreRotation: false });

      return (width / dpmm > limit || height / dpmm > limit) && accept(object);
    });

    if (oversize.length) {
      result.items.push(...oversize);
      result.field = Math.max(result.field, field);
    }
  }

  return result;
};

/**
 * Objects on layers tiled by object that do not fit in one field: swiftray refuses those.
 */
export const checkObjectTilingItems = (): Promise<OversizeResult> => getOversizeObjects(GalvoTiling.Object);

/** Tags that draw nothing themselves, or only hold what does. */
const nonDrawingTags = new Set(['defs', 'desc', 'filter', 'g', 'metadata', 'style', 'symbol', 'title']);

/**
 * Whether an object engraves anything as lines: any drawn element in it that is not an image.
 * A `<use>` is looked into, since an imported graphic is one.
 */
export const hasPathContent = (object: Element): boolean => {
  const tag = object.tagName.toLowerCase();

  if (tag === 'image') return false;

  if (tag === 'use') {
    const href = object.getAttribute('href') ?? object.getAttribute('xlink:href');
    const target = href?.startsWith('#') ? document.getElementById(href.slice(1)) : null;

    // a reference that resolves to nothing is taken for a drawing rather than waved through
    return target ? hasPathContent(target) : true;
  }

  if (!nonDrawingTags.has(tag)) return true;

  if (tag === 'g' || tag === 'symbol') return Array.from(object.children).some(hasPathContent);

  return false;
};

/**
 * Objects on Auto layers that do not fit in one field -- so swiftray tiles them across stops --
 * and hold line content, which is only cut hard at a seam.
 */
export const checkPathStitchingItems = (): Promise<OversizeResult> =>
  getOversizeObjects(GalvoTiling.Auto, hasPathContent);

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

/**
 * Run before sending or exporting a HEXA G task, not before the conversions the editor makes on
 * its own (time estimate, path preview): warns that paths are about to be stitched across stops.
 * @returns true if the task may go on
 */
export const confirmPathStitching = async (): Promise<boolean> => {
  if (alertConfig.read('skip-galvo-path-stitch-warning')) return true;

  const { field, items } = await checkPathStitchingItems();

  if (!items.length) return true;

  const { lang } = i18n;
  const t = lang.beambox.right_panel.laser_panel.galvo_tiling;

  return new Promise<boolean>((resolve) => {
    Alert.popUp({
      buttonLabels: [lang.beambox.popup.still_continue, t.select_objects, lang.alert.cancel],
      callbacks: [
        () => resolve(true),
        () => {
          selectionManager.multiSelect(items);
          resolve(false);
        },
        () => resolve(false),
      ],
      checkbox: {
        // a function runs for the primary button only: skipping is not remembered on a cancel
        callbacks: () => alertConfig.write('skip-galvo-path-stitch-warning', true),
        text: lang.alert.dont_show_again,
      },
      id: 'galvo-tiling-path-stitch',
      message: sprintf(t.path_stitch_warning, items.length, field),
      onClose: () => resolve(false),
      primaryButtonIndex: 0,
      type: AlertConstants.SHOW_POPUP_WARNING,
    });
  });
};
