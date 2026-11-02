import type { Preset } from '@core/interfaces/ILayerConfig';

// the shared mock replaces these with sample data
const { default: presets } = jest.requireActual<{ default: Record<string, Record<string, Record<number, Preset>>> }>(
  './presets',
);

const presetsOf = (model: string) =>
  Object.entries(presets)
    .filter(([, models]) => models[model])
    .map(([key, models]) => [key, Object.values(models[model])[0]] as const);

describe('Promark UV presets', () => {
  const uv2d = presetsOf('fpm1_2_5');
  const innerEngraving = presetsOf('fpm1_inner_engraving');

  test('2D and inner engraving keep separate presets', () => {
    expect(uv2d.length).toBe(39);
    expect(innerEngraving.map(([key]) => key)).toEqual([
      'k9_crystal_contour_dot',
      'k9_crystal_contour_line',
      'k9_crystal_solid_dot',
    ]);

    const innerKeys = new Set(innerEngraving.map(([key]) => key));

    uv2d.forEach(([key]) => expect(innerKeys.has(key)).toBe(false));
  });

  test('inner engraving presets set every option of their mode, so switching presets resets it', () => {
    const byKey = Object.fromEntries(innerEngraving);

    expect(byKey.k9_crystal_contour_dot).toMatchObject({ stlMode: 'dot', stlSolid: false });
    expect(byKey.k9_crystal_solid_dot).toMatchObject({ stlMode: 'dot', stlSolid: true });
    expect(byKey.k9_crystal_contour_line).toMatchObject({ stlMinLayerSpacing: 0, stlMode: 'line' });
  });

  test('2D UV presets set the frequency, never the power, with a 0.01mm fill interval', () => {
    uv2d.forEach(([, preset]) => {
      expect(preset.frequency).toBeGreaterThanOrEqual(40);
      expect(preset.frequency).toBeLessThanOrEqual(200);
      expect(preset.power).toBeUndefined();
      expect(preset.fillInterval).toBe(0.01);
      expect(Object.keys(preset).some((key) => key.startsWith('stl'))).toBe(false);
    });
  });

  test('only PLA pauses after each line; every other 2D UV preset turns the line dwell off', () => {
    uv2d.forEach(([key, preset]) => {
      if (key === 'pla_engraving') expect(preset.fillDwellTime).toBe(50000);
      else expect(preset.fillDwellTime).toBeLessThan(0);
    });
  });
});
