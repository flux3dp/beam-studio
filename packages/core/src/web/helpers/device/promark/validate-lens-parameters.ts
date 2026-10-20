import type { LensParameterRange } from '@core/app/constants/promark-constants';
import { getLensParameterRanges } from '@core/app/constants/promark-constants';
import type { LensCorrection, RedDot } from '@core/interfaces/Promark';

import type { FullLensParameters } from './lens-profiles';

export type LensParameterPath =
  | 'field.angle'
  | 'field.offsetX'
  | 'field.offsetY'
  | `galvoParameters.${'x' | 'y'}.${keyof LensCorrection}`
  | `redDot.${keyof RedDot}`;

export interface LensParameterIssue {
  level: 'error' | 'warning';
  path: LensParameterPath;
  /** the range the value broke: the hard limit for an error, the common range for a warning */
  range: readonly [number, number];
  value: number;
}

export type LensParameterIssues = Partial<Record<LensParameterPath, LensParameterIssue>>;

const isOutside = (value: number, [min, max]: readonly [number, number]): boolean =>
  !Number.isFinite(value) || value < min || value > max;

/** Checks each field on its own against `getLensParameterRanges`; offsets are in mm. */
export const validateLensParameters = (
  { field, galvoParameters, redDot }: FullLensParameters,
  workarea: number,
): LensParameterIssues => {
  const ranges = getLensParameterRanges(workarea);
  const issues: LensParameterIssues = {};
  const check = (path: LensParameterPath, value: number, range: LensParameterRange) => {
    if (isOutside(value, range.error)) {
      issues[path] = { level: 'error', path, range: range.error, value };
    } else if (isOutside(value, range.warning)) {
      issues[path] = { level: 'warning', path, range: range.warning, value };
    }
  };

  check('field.offsetX', field.offsetX, ranges.fieldOffset);
  check('field.offsetY', field.offsetY, ranges.fieldOffset);
  check('field.angle', field.angle, ranges.fieldAngle);
  (['x', 'y'] as const).forEach((axis) => {
    const { bulge, scale, skew, trapezoid } = galvoParameters[axis];

    check(`galvoParameters.${axis}.scale`, scale, ranges.galvoScale);
    check(`galvoParameters.${axis}.bulge`, bulge, ranges.galvoBulge);
    check(`galvoParameters.${axis}.skew`, skew, ranges.galvoSkew);
    check(`galvoParameters.${axis}.trapezoid`, trapezoid, ranges.galvoTrapezoid);
  });
  check('redDot.offsetX', redDot.offsetX, ranges.redDotOffset);
  check('redDot.offsetY', redDot.offsetY, ranges.redDotOffset);
  check('redDot.scaleX', redDot.scaleX, ranges.redDotScale);
  check('redDot.scaleY', redDot.scaleY, ranges.redDotScale);

  return issues;
};

export const hasLensParameterErrors = (issues: LensParameterIssues): boolean =>
  Object.values(issues).some((issue) => issue?.level === 'error');

export const getLensParameterWarnings = (issues: LensParameterIssues): LensParameterIssue[] =>
  Object.values(issues).filter((issue): issue is LensParameterIssue => issue?.level === 'warning');
