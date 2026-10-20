import type { LensParameterPath } from '@core/helpers/device/promark/validate-lens-parameters';
import type { ILang } from '@core/interfaces/ILang';

const trim = (value: number, digits: number): string => String(Number(value.toFixed(digits)));

/** e.g. "Galvo Configuration X Bulge" */
export const getLensParameterLabel = (path: LensParameterPath, t: ILang['promark_settings']): string => {
  const [block, ...rest] = path.split('.');

  if (block === 'galvoParameters') {
    const [axis, name] = rest as ['x' | 'y', 'bulge' | 'scale' | 'skew' | 'trapezoid'];

    return `${t.galvo_configuration} ${axis.toUpperCase()} ${t[name]}`;
  }

  const name = rest[0] as 'angle' | 'offsetX' | 'offsetY' | 'scaleX' | 'scaleY';

  return `${block === 'field' ? t.field : t.red_dot} ${t[name]}`;
};

/** A value with the unit its input shows; offsets are stored in mm. */
export const formatLensParameterValue = (path: LensParameterPath, value: number, isInch: boolean): string => {
  if (path.endsWith('.offsetX') || path.endsWith('.offsetY')) {
    return isInch ? `${trim(value / 25.4, 4)} in` : `${trim(value, 3)} mm`;
  }

  if (path === 'field.angle') return `${trim(value, 3)} deg`;

  if (path.endsWith('.scale')) return `${trim(value, 3)}%`;

  return trim(value, 3);
};

export const formatLensParameterRange = (
  path: LensParameterPath,
  [min, max]: readonly [number, number],
  isInch: boolean,
): string => `${formatLensParameterValue(path, min, isInch)} ～ ${formatLensParameterValue(path, max, isInch)}`;
