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
  laserType?: LaserType;
}

type TableSettingConstruct<T extends ReadonlyArray<string>, IsRequired = true> = IsRequired extends true
  ? { [K in T[number]]: Detail }
  : { [K in T[number]]?: Detail };

export const commonTableParams = ['strength', 'speed', 'repeat'] as const;
export const promarkTableParams = ['fillInterval', 'frequency'] as const;
export const mopaTableParams = ['pulseWidth'] as const;
export const tableParams = [...commonTableParams, ...promarkTableParams, ...mopaTableParams] as const;

export type TableSetting = TableSettingConstruct<typeof commonTableParams> &
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

export const getTableSetting = (
  workarea: WorkAreaModel,
  { laserType }: SettingInfos = { laserType: LaserType.Desktop },
): TableSetting => {
  if (promarkModels.has(workarea)) {
    return getPromarkTableSetting(workarea, { laserType });
  }

  return getCommonTableSetting(workarea);
};
