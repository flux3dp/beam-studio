import { withDefaultParameters } from './lens-profiles';
import { getLensParameterWarnings, hasLensParameterErrors, validateLensParameters } from './validate-lens-parameters';

jest.mock('@core/app/stores/documentStore', () => ({ useDocumentStore: { getState: () => ({}) } }));
jest.mock('@core/helpers/addOn/innerEngraving', () => ({ isInnerEngravingActive: () => false }));

const factory = withDefaultParameters({});
const withGalvoX = (values: Partial<typeof factory.galvoParameters.x>) => ({
  ...factory,
  galvoParameters: { ...factory.galvoParameters, x: { ...factory.galvoParameters.x, ...values } },
});

describe('test validateLensParameters', () => {
  test('factory values have no issue', () => {
    expect(validateLensParameters(factory, 70)).toEqual({});
  });

  test('the calibrated UV samples have no issue', () => {
    const sample = {
      field: { angle: -0.172, offsetX: 0, offsetY: 0 },
      galvoParameters: {
        x: { bulge: 0.963, scale: 82.086, skew: 1, trapezoid: 1 },
        y: { bulge: 1.082, scale: 77.95, skew: 1, trapezoid: 0.996 },
      },
      redDot: { offsetX: 2.5, offsetY: -2.3, scaleX: 1.017, scaleY: 1 },
    };

    expect(validateLensParameters(sample, 200)).toEqual({});
  });

  test('a value outside the hard limit is an error, and the value is kept', () => {
    const issues = validateLensParameters(withGalvoX({ scale: 1 }), 70);

    expect(issues['galvoParameters.x.scale']).toEqual({
      level: 'error',
      path: 'galvoParameters.x.scale',
      range: [50, 150],
      value: 1,
    });
    expect(hasLensParameterErrors(issues)).toBe(true);
    expect(hasLensParameterErrors(validateLensParameters(withGalvoX({ scale: -80 }), 70))).toBe(true);
    expect(hasLensParameterErrors(validateLensParameters(withGalvoX({ scale: Number.NaN }), 70))).toBe(true);
  });

  test('a value outside the common range is a warning', () => {
    const issues = validateLensParameters(withGalvoX({ bulge: 1.15 }), 70);

    expect(hasLensParameterErrors(issues)).toBe(false);
    expect(getLensParameterWarnings(issues)).toEqual([
      { level: 'warning', path: 'galvoParameters.x.bulge', range: [0.9, 1.1], value: 1.15 },
    ]);
  });

  test('range boundaries are allowed', () => {
    expect(
      validateLensParameters(withGalvoX({ bulge: 1.1, scale: 50 }), 70)['galvoParameters.x.bulge'],
    ).toBeUndefined();
    expect(validateLensParameters(withGalvoX({ scale: 50 }), 70)['galvoParameters.x.scale']?.level).toBe('warning');
  });

  test('the field offset limit follows the work area', () => {
    const offset = (offsetX: number) => ({ ...factory, field: { ...factory.field, offsetX } });

    expect(validateLensParameters(offset(6), 70)['field.offsetX']?.level).toBe('warning');
    expect(validateLensParameters(offset(8), 70)['field.offsetX']?.level).toBe('error');
    expect(validateLensParameters(offset(8), 200)['field.offsetX']?.level).toBe('warning');
    expect(validateLensParameters(offset(-21), 200)['field.offsetX']?.level).toBe('error');
  });

  test('red dot ranges', () => {
    const redDot = (values: Partial<typeof factory.redDot>) => ({
      ...factory,
      redDot: { ...factory.redDot, ...values },
    });

    expect(validateLensParameters(redDot({ scaleY: 1.06 }), 70)['redDot.scaleY']?.level).toBe('warning');
    expect(validateLensParameters(redDot({ scaleY: 1.3 }), 70)['redDot.scaleY']?.level).toBe('error');
    expect(validateLensParameters(redDot({ offsetY: -11 }), 70)['redDot.offsetY']?.level).toBe('error');
  });
});
