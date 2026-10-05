import { promarkModels } from '@core/app/actions/beambox/constant';
import { LaserType } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { getPromarkLimit } from '@core/helpers/layer/layer-config-helper';

export interface Detail {
  // default value is used when the param is not set
  default: number;
  max: number;
  maxValue: number;
  min: number;
  minValue: number;
  // selected is used to determine which param is selected
  // by order, 0 for column, 1 for row, 2 for static param with default value
  selected: 0 | 1 | 2;
}

interface SettingInfos {
  isDotCompare?: boolean;
  laserType?: LaserType;
}

/** Highest dwell the dot axis offers, in us. A dot that sits longer than this drills rather than marks. */
const MAX_DOTTING_TIME = 1000;

type TableSettingConstruct<T extends ReadonlyArray<string>, IsRequired = true> = IsRequired extends true
  ? { [K in T[number]]: Detail }
  : { [K in T[number]]?: Detail };

export const commonTableParams = ['strength', 'speed', 'repeat'] as const;
export const promarkTableParams = ['fillInterval', 'frequency'] as const;
export const mopaTableParams = ['pulseWidth'] as const;
/** The dot axis of the dot-vs-line matrix: how long the beam dwells on each dot. */
export const galvoTableParams = ['dottingTime'] as const;
export const tableParams = [
  ...commonTableParams,
  ...promarkTableParams,
  ...mopaTableParams,
  ...galvoTableParams,
] as const;

export type TableSetting = TableSettingConstruct<typeof commonTableParams> &
  TableSettingConstruct<typeof galvoTableParams, false> &
  TableSettingConstruct<typeof mopaTableParams, false> &
  TableSettingConstruct<typeof promarkTableParams, false>;

const getCommonTableSetting = (workarea: WorkAreaModel): TableSetting => {
  const { maxSpeed } = getWorkarea(workarea);

  return {
    repeat: {
      default: 1,
      max: 100,
      maxValue: 5,
      min: 1,
      minValue: 1,
      selected: 2,
    },
    speed: {
      default: 20,
      max: maxSpeed,
      maxValue: maxSpeed,
      min: 1,
      minValue: 20,
      selected: 1,
    },
    strength: {
      default: 15,
      max: 100,
      maxValue: 100,
      min: 1,
      minValue: 15,
      selected: 0,
    },
  };
};

const getPromarkTableSetting = (workarea: WorkAreaModel, { laserType }: SettingInfos): TableSetting => {
  const { maxSpeed, minSpeed } = getWorkarea(workarea);
  const limit = getPromarkLimit();

  return {
    fillInterval: {
      default: 0.01,
      max: 100,
      maxValue: 1,
      min: 0.0001,
      minValue: 0.01,
      selected: 2,
    },
    frequency: {
      default: limit.frequency.min,
      max: limit.frequency.max,
      maxValue: limit.frequency.max,
      min: limit.frequency.min,
      minValue: limit.frequency.min,
      selected: 2,
    },
    repeat: {
      default: 1,
      max: 100,
      maxValue: 5,
      min: 1,
      minValue: 1,
      selected: 2,
    },
    speed: {
      default: 1000,
      max: maxSpeed,
      maxValue: maxSpeed,
      min: minSpeed,
      minValue: minSpeed,
      selected: 1,
    },
    strength: {
      default: 15,
      max: 100,
      maxValue: 100,
      min: 1,
      minValue: 15,
      selected: 0,
    },
    ...(laserType === LaserType.MOPA && {
      pulseWidth: {
        default: 350,
        max: limit.pulseWidth.max,
        maxValue: limit.pulseWidth.max,
        min: limit.pulseWidth.min,
        minValue: limit.pulseWidth.min,
        selected: 2,
      },
    }),
  };
};

/**
 * The dot-vs-line matrix, whose axes are fixed: the column sweeps the speed the line half is
 * engraved at, the row sweeps the dwell of each dot in the dot half. Both halves live on one layer
 * -- a galvo layer engraves a dithered image as dots and a binarised one as lines -- so the two
 * parameters do not compete, they each drive their own half.
 */
const getDotCompareTableSetting = (workarea: WorkAreaModel): TableSetting => {
  const { maxSpeed, minSpeed } = getWorkarea(workarea);

  return {
    dottingTime: {
      default: 100,
      max: MAX_DOTTING_TIME,
      maxValue: 400,
      min: 1,
      minValue: 25,
      selected: 1,
    },
    repeat: {
      default: 1,
      max: 100,
      maxValue: 5,
      min: 1,
      minValue: 1,
      selected: 2,
    },
    speed: {
      default: 1000,
      max: maxSpeed,
      maxValue: maxSpeed,
      min: minSpeed,
      minValue: 250,
      selected: 0,
    },
    strength: {
      default: 100,
      max: 100,
      maxValue: 100,
      min: 1,
      minValue: 100,
      selected: 2,
    },
  };
};

export const getTableSetting = (
  workarea: WorkAreaModel,
  { isDotCompare, laserType }: SettingInfos = { laserType: LaserType.Desktop },
): TableSetting => {
  if (isDotCompare) {
    return getDotCompareTableSetting(workarea);
  }

  if (promarkModels.has(workarea)) {
    return getPromarkTableSetting(workarea, { laserType });
  }

  return getCommonTableSetting(workarea);
};
