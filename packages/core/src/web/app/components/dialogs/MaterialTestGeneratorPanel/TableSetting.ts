import { promarkModels } from '@core/app/actions/beambox/constant';
import { DEFAULT_POINT_SPACING, POINT_SPACING_LIMIT } from '@core/app/constants/innerEngraving';
import { LaserType } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import isDev, { isUvDev } from '@core/helpers/is-dev';
import { getPromarkLimit } from '@core/helpers/layer/layer-config-helper';
import { uvFrequencyToPower } from '@core/helpers/layer/uvPowerFrequency';

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
export const promarkTableParams = ['fillInterval', 'frequency'] as const;
export const mopaTableParams = ['pulseWidth'] as const;
/** fillInterleave / fillDwellTime only apply to engraved (filled) blocks, see TableSettingForm */
export const uvTableParams = ['qPulseWidth', 'fillInterleave', 'fillDwellTime'] as const;
/** Dot parameters: a 2D block is a vector shape, which is never dotted. */
export const innerEngravingTableParams = ['dottingTime', 'pointSpacing'] as const;
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
    // a developer option, like in the config panel (DevBlock)
    ...(isUV &&
      isDev() &&
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

  // UV heat mitigation, still a uvDev option in the advanced settings
  if (isUV && isUvDev()) {
    // a switch, 0 for off and 1 for on, so as an axis it only has the two values
    setting.fillInterleave = { default: 0, max: 1, maxValue: 1, min: 0, minValue: 0, selected: 2 };
    setting.fillDwellTime = { default: 0, max: 1000000, maxValue: 10000, min: 0, minValue: 0, selected: 2 };
  }

  if (isUV) delete setting.frequency;

  return setting;
};

const getInnerEngravingTableSetting = (workarea: WorkAreaModel): TableSetting => {
  // no passes (fixed at 1), and nothing about filled paths: a 3D object is dotted or sliced
  const {
    fillDwellTime: _fillDwellTime,
    fillInterleave: _fillInterleave,
    fillInterval: _fillInterval,
    repeat: _repeat,
    ...setting
  } = getPromarkTableSetting(workarea, { laserType: LaserType.UV });
  // the default of the contour-dotting preset, 110kHz
  const defaultPower = Math.round(uvFrequencyToPower(110));

  return {
    ...setting,
    dottingTime: { default: 150, max: 10000, maxValue: 500, min: 1, minValue: 50, selected: 0 },
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
    // the power stands for the frequency, which generate.ts writes along with it
    strength: { ...setting.strength!, default: defaultPower, maxValue: 100, minValue: defaultPower, selected: 2 },
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
