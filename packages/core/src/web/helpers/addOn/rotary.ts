import constant from '@core/app/actions/beambox/constant';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import getRotaryRatio from '@core/helpers/device/get-rotary-ratio';

export type RotaryInfo = null | {
  useAAxis: boolean;
  y: number;
  yOverlap?: number;
  yRatio: number;
  ySplit?: number;
};

export const getRotaryInfo = (workarea?: WorkAreaModel, axisInMm = false): RotaryInfo => {
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
    y: rotaryAxis.getPosition(axisInMm),
    yRatio: getRotaryRatio(addOnInfo),
  };

  if (addOnInfo.rotary.split) {
    info!.ySplit = rotarySplit;
    info!.yOverlap = rotaryOverlap;
  }

  return info;
};
