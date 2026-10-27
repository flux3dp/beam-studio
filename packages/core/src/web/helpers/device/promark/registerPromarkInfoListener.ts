import { promarkModels } from '@core/app/actions/beambox/constant';
import {
  getDefaultPromarkWorkarea,
  isPromarkWorkareaCompatible,
  LaserType,
} from '@core/app/constants/promark-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { isInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { postPresetChange } from '@core/helpers/layer/layer-config-helper';
import { syncUvLayerFrequency } from '@core/helpers/layer/syncUvLayerFrequency';

import { getPromarkInfo } from './promark-info';

/**
 * Keep the document in step with the Promark laser source, whichever way it changes: the document
 * settings dialog, or selecting a machine, which applies the source Beam Studio remembers for it
 * (get-device.ts). On every 'promark-info-changed':
 *
 * 1. the fpm1 field size has to be one the source offers (70 / 200 mm for UV, 110 / 150 / 220 for
 *    the others): an incompatible size becomes the source's default, and workareaManager follows
 *    the store. Left alone in a 3D document, whose 70 mm field is fixed by the mode.
 * 2. on a switch to UV, every layer's frequency follows its power (see syncUvLayerFrequency),
 *    except in a 3D document, whose layers the mode switch initialises for UV.
 * 3. postPresetChange re-applies the presets and the limits of the new source to every layer.
 *
 * Registered once at start-up (beambox-init), not in a component: the layer panel may be closed
 * when a machine is selected, and the document has to follow all the same. The ConfigPanel only
 * re-reads the layers afterwards (its listener is registered later, so it runs after this one).
 */
export const applyPromarkInfoChange = (previousLaserType: LaserType | undefined): LaserType => {
  const info = getPromarkInfo();
  const state = useDocumentStore.getState();

  if (!promarkModels.has(state.workarea)) return info.laserType;

  if (state.workarea === 'fpm1' && !state['inner-engraving']) {
    const dimension = state['customized-dimension'].fpm1;
    const size = dimension?.width ?? getWorkarea('fpm1').width;

    if (!isPromarkWorkareaCompatible(info.laserType, size) || dimension?.height !== size) {
      const defaultSize = getDefaultPromarkWorkarea(info);

      state.update({
        'customized-dimension': {
          ...state['customized-dimension'],
          fpm1: { height: defaultSize, width: defaultSize },
        },
      });
    }
  }

  if (info.laserType === LaserType.UV && previousLaserType !== LaserType.UV && !isInnerEngravingActive()) {
    syncUvLayerFrequency();
  }

  postPresetChange();

  return info.laserType;
};

/** @returns the unsubscribe function */
export const registerPromarkInfoListener = (): (() => void) => {
  const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');
  let lastLaserType: LaserType | undefined = getPromarkInfo().laserType;
  const handler = () => {
    lastLaserType = applyPromarkInfoChange(lastLaserType);
  };

  canvasEvents.on('promark-info-changed', handler);

  return () => {
    canvasEvents.off('promark-info-changed', handler);
  };
};

export default registerPromarkInfoListener;
