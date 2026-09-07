import constant from '@core/app/actions/beambox/constant';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getAutoFeeder } from '@core/helpers/addOn';
import getRotaryRatio from '@core/helpers/device/get-rotary-ratio';

export type RotaryInfo = null | {
  useAAxis: boolean;
  y: number;
  yOverlap?: number;
  yRatio: number;
  ySplit?: number;
};

export const getRotaryInfo = (
  workarea?: WorkAreaModel,
  { axisInMm = false, forceY }: { axisInMm?: boolean; forceY?: number } = {},
): RotaryInfo => {
  const {
    'rotary-overlap': rotaryOverlap,
    'rotary-split': rotarySplit,
    rotary_mode: rotaryMode,
    workarea: documentWorkarea,
  } = useDocumentStore.getState();

  if (!workarea) {
    workarea = documentWorkarea;
  }

  const addOnInfo = getAddOnInfo(workarea);

  if (!addOnInfo.rotary) return null;

  if (!rotaryMode) return null;

  const info: RotaryInfo = {
    useAAxis: constant.fcodeV2Models.has(workarea),
    y: forceY !== undefined ? forceY : rotaryAxis.getPosition(axisInMm),
    yRatio: getRotaryRatio(addOnInfo),
  };

  if (addOnInfo.rotary.split) {
    info!.ySplit = rotarySplit;
    info!.yOverlap = rotaryOverlap;
  }

  return info;
};

export type SpinningAxis = {
  /** rotary y ratio: fluxclient maps task y to `spin + (y - spin) * ratio` */
  ratio: number;
  /** spinning axis y in px (constant.dpmm) */
  spin: number;
};

/**
 * The spinning axis fluxclient maps task y through (rotary or auto feeder): rotary-space
 * y' = spin + (y - spin) * ratio, written to the A axis on fcode v2 machines and to Y itself
 * on v1 (after rotary-mode-on). Null when the task spins nothing.
 * @param jobOriginY job origin y in mm when enabled (the axis then sits at the job origin)
 * @param reverse reverse-engraving preference (auto feeder spins from the far edge)
 */
export const getSpinningAxis = (
  model: WorkAreaModel,
  { jobOriginY, reverse = false }: { jobOriginY?: number; reverse?: boolean } = {},
): null | SpinningAxis => {
  const addOnInfo = getAddOnInfo(model);
  const rotaryInfo = getRotaryInfo(model, {
    forceY: jobOriginY === undefined ? undefined : jobOriginY * constant.dpmm,
  });

  if (rotaryInfo) return { ratio: rotaryInfo.yRatio, spin: rotaryInfo.y };

  if (!getAutoFeeder(addOnInfo)) return null;

  const { minY = 0, rotaryRatio } = addOnInfo.autoFeeder!;
  let spin = minY;

  if (jobOriginY !== undefined) spin = jobOriginY * constant.dpmm;
  else if (reverse) spin = getWorkarea(model).pxHeight;

  return { ratio: rotaryRatio * useDocumentStore.getState()['auto-feeder-scale'], spin };
};
