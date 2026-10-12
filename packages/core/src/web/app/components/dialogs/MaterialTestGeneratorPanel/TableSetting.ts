import { promarkModels } from '@core/app/actions/beambox/constant';
import { DEFAULT_POINT_SPACING, POINT_SPACING_LIMIT } from '@core/app/constants/innerEngraving';
import { LaserType } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { isUvDev2 } from '@core/helpers/is-dev';
import { getPromarkLimit } from '@core/helpers/layer/layer-config-helper';

export interface Detail {
  // Whether this parameter accepts decimal values.
  allowDecimal?: boolean;
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
  /** Inner engraving test: UV Promark params without power and passes, plus the STL point spacing. */
  innerEngraving?: boolean;
  laserType?: LaserType;
}

type TableSettingConstruct<T extends ReadonlyArray<string>, IsRequired = true> = IsRequired extends true
  ? { [K in T[number]]: Detail }
  : { [K in T[number]]?: Detail };

export const commonTableParams = ['strength', 'speed', 'repeat'] as const;
export const promarkTableParams = ['fillInterval', 'frequency', 'dottingTime'] as const;
export const mopaTableParams = ['pulseWidth'] as const;
export const uvTableParams = ['pulseWidth', 'qPulseWidth'] as const;
/** Written onto the 3D object rather than the layer. */
export const innerEngravingTableParams = ['pointSpacing'] as const;
export const tableParams = [
  ...commonTableParams,
  ...promarkTableParams,
  ...mopaTableParams,
  ...uvTableParams,
  ...innerEngravingTableParams,
] as const;

// power and passes are absent from the inner engraving table
export type TableSetting = TableSettingConstruct<['repeat', 'strength'], false> &
  TableSettingConstruct<['speed']> &
  TableSettingConstruct<typeof innerEngravingTableParams, false> &
  TableSettingConstruct<typeof mopaTableParams, false> &
  TableSettingConstruct<typeof promarkTableParams, false> &
  TableSettingConstruct<typeof uvTableParams, false>;

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
  const isUV = laserType === LaserType.UV;
  // UV power is converted to the frequency of each block, so the frequency is not a separate axis
  // and the power starts at the weakest frequency; the pulse width is fixed
  const powerMin = isUV && limit.power ? Math.ceil(limit.power.min) : 1;
  const setting: TableSetting = {
    dottingTime: {
      default: 100,
      max: 10000,
      maxValue: 500,
      min: 1,
      minValue: 50,
      selected: 2,
    },
    fillInterval: {
      allowDecimal: true,
      default: 0.01,
      max: 100,
      maxValue: 1,
      min: 0.0001,
      minValue: 0.01,
      selected: 2,
    },
    frequency: {
      default: limit.frequency!.min,
      max: limit.frequency!.max,
      maxValue: limit.frequency!.max,
      min: limit.frequency!.min,
      minValue: limit.frequency!.min,
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
      default: Math.max(15, powerMin),
      max: 100,
      maxValue: 100,
      min: powerMin,
      minValue: Math.max(15, powerMin),
      selected: 0,
    },
    ...(laserType === LaserType.MOPA &&
      limit.pulseWidth && {
        pulseWidth: {
          default: 350,
          max: limit.pulseWidth.max,
          maxValue: limit.pulseWidth.max,
          min: limit.pulseWidth.min,
          minValue: limit.pulseWidth.min,
          selected: 2,
        },
      }),
    ...(isUV &&
      isUvDev2() &&
      limit.qPulseWidth && {
        qPulseWidth: {
          allowDecimal: true,
          default: 1,
          max: limit.qPulseWidth.max,
          maxValue: limit.qPulseWidth.max,
          min: limit.qPulseWidth.min,
          minValue: limit.qPulseWidth.min,
          selected: 2,
        },
      }),
  };

  if (isUV) delete setting.frequency;

  return setting;
};

const getInnerEngravingTableSetting = (workarea: WorkAreaModel): TableSetting => {
  const {
    repeat: _repeat,
    strength: _strength,
    ...setting
  } = getPromarkTableSetting(workarea, { laserType: LaserType.UV });

  const { frequency: frequencyLimit } = getPromarkLimit();

  return {
    ...setting,
    dottingTime: { ...setting.dottingTime!, selected: 0 },
    // with no power axis here, the frequency is what sets the output; generate.ts writes the power
    // it stands for
    ...(frequencyLimit && {
      frequency: {
        default: 40,
        max: frequencyLimit.max,
        maxValue: frequencyLimit.max,
        min: frequencyLimit.min,
        minValue: 40,
        selected: 2,
      },
    }),
    pointSpacing: {
      allowDecimal: true,
      default: DEFAULT_POINT_SPACING,
      max: POINT_SPACING_LIMIT.max,
      maxValue: 0.2,
      min: POINT_SPACING_LIMIT.min,
      minValue: 0.05,
      selected: 1,
    },
    speed: { ...setting.speed, selected: 2 },
  };
};

export const getTableSetting = (
  workarea: WorkAreaModel,
  { innerEngraving = false, laserType }: SettingInfos = { laserType: LaserType.Desktop },
): TableSetting => {
  if (innerEngraving) return getInnerEngravingTableSetting(workarea);

  if (promarkModels.has(workarea)) {
    return getPromarkTableSetting(workarea, { laserType });
  }

  return getCommonTableSetting(workarea);
};
