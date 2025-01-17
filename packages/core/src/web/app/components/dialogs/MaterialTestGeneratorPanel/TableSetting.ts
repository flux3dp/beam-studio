import { promarkModels } from 'app/actions/beambox/constant';
import { LaserType } from 'app/constants/promark-constants';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { getPromarkLimit } from 'helpers/layer/layer-config-helper';

export interface Detail {
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  // default value is used when the param is not set
  default: number;
  // selected is used to determine which param is selected
  // by order, 0 for column, 1 for row, 2 for static param with default value
  selected: 0 | 1 | 2;
}

interface SettingInfos {
  laserType?: LaserType;
}

type TableSettingConstruct<
  T extends ReadonlyArray<string>,
  IsRequired = true
> = IsRequired extends true ? { [K in T[number]]: Detail } : { [K in T[number]]?: Detail };

export const commonTableParams = ['strength', 'speed', 'repeat'] as const;
export const promarkTableParams = ['fillInterval', 'frequency'] as const;
export const mopaTableParams = ['pulseWidth'] as const;
export const tableParams = [
  ...commonTableParams,
  ...promarkTableParams,
  ...mopaTableParams,
] as const;

export type TableSetting = TableSettingConstruct<typeof commonTableParams> &
  TableSettingConstruct<typeof promarkTableParams, false> &
  TableSettingConstruct<typeof mopaTableParams, false>;

const getCommonTableSetting = (workarea: WorkAreaModel): TableSetting => {
  const { maxSpeed } = getWorkarea(workarea);

  return {
    strength: {
      minValue: 15,
      maxValue: 100,
      min: 1,
      max: 100,
      default: 15,
      selected: 0,
    },
    speed: {
      minValue: 20,
      maxValue: maxSpeed,
      min: 1,
      max: maxSpeed,
      default: 20,
      selected: 1,
    },
    repeat: {
      minValue: 1,
      maxValue: 5,
      min: 1,
      max: 100,
      default: 1,
      selected: 2,
    },
  };
};

const getPromarkTableSetting = (
  workarea: WorkAreaModel,
  { laserType }: SettingInfos
): TableSetting => {
  const { minSpeed, maxSpeed } = getWorkarea(workarea);
  const limit = getPromarkLimit();

  return {
    strength: {
      minValue: 15,
      maxValue: 100,
      min: 1,
      max: 100,
      default: 15,
      selected: 0,
    },
    speed: {
      minValue: minSpeed,
      maxValue: maxSpeed,
      min: minSpeed,
      max: maxSpeed,
      default: 1000,
      selected: 1,
    },
    repeat: {
      minValue: 1,
      maxValue: 5,
      min: 1,
      max: 100,
      default: 1,
      selected: 2,
    },
    fillInterval: {
      minValue: 0.01,
      maxValue: 1,
      min: 0.0001,
      max: 100,
      default: 0.01,
      selected: 2,
    },
    frequency: {
      minValue: limit.frequency.min,
      maxValue: limit.frequency.max,
      min: limit.frequency.min,
      max: limit.frequency.max,
      default: limit.frequency.min,
      selected: 2,
    },
    ...(laserType === LaserType.MOPA && {
      pulseWidth: {
        minValue: limit.pulseWidth.min,
        maxValue: limit.pulseWidth.max,
        min: limit.pulseWidth.min,
        max: limit.pulseWidth.max,
        default: 350,
        selected: 2,
      },
    }),
  };
};

export const getTableSetting = (
  workarea: WorkAreaModel,
  { laserType }: SettingInfos = { laserType: LaserType.Desktop }
): TableSetting => {
  if (promarkModels.has(workarea)) {
    return getPromarkTableSetting(workarea, { laserType });
  }

  return getCommonTableSetting(workarea);
};
