import { DEFAULT_MATERIAL, DEFAULT_SAFETY_MARGIN } from '@core/app/constants/innerEngraving';

import { getSerializedMaterial, parseMaterial, serializeMaterial } from './innerEngravingMaterial';

jest.mock('@core/app/stores/documentStore', () => ({ useDocumentStore: { getState: () => ({}) } }));

const state = {
  'inner-engraving-base-height': 2,
  'inner-engraving-depth': 40,
  'inner-engraving-diameter': 30,
  'inner-engraving-height': 50,
  'inner-engraving-refractive-index': 1.52,
  'inner-engraving-safety-margin': 3,
  'inner-engraving-shape': 'cylinder' as const,
  'inner-engraving-width': 60,
  'inner-engraving-x': 35,
  'inner-engraving-y': 30,
};

describe('innerEngravingMaterial', () => {
  test('a saved material round-trips through the attribute, XML escaping included', () => {
    const attribute = serializeMaterial(state).replace(/"/g, '&quot;');

    expect(attribute).not.toContain('"');
    expect(parseMaterial(attribute)).toEqual(state);
  });

  test('the serialized form carries every material setting', () => {
    expect(getSerializedMaterial(state)).toEqual({
      baseHeight: 2,
      depth: 40,
      diameter: 30,
      height: 50,
      refractiveIndex: 1.52,
      safetyMargin: 3,
      shape: 'cylinder',
      width: 60,
      x: 35,
      y: 30,
    });
  });

  test('a missing attribute or unparsable value restores nothing', () => {
    expect(parseMaterial(null)).toEqual({});
    expect(parseMaterial(undefined)).toEqual({});
    expect(parseMaterial('')).toEqual({});
    expect(parseMaterial('{not json')).toEqual({});
    expect(parseMaterial('42')).toEqual({});
  });

  test('each key is validated on its own, so a bad value keeps the current setting', () => {
    const patch = parseMaterial(
      JSON.stringify({
        baseHeight: -1,
        depth: 'deep',
        diameter: 0,
        height: 30,
        refractiveIndex: 9,
        safetyMargin: DEFAULT_SAFETY_MARGIN,
        shape: 'pyramid',
        width: Number.NaN,
        x: 1001,
        y: -20,
      }),
    );

    expect(patch).toEqual({
      'inner-engraving-height': 30,
      'inner-engraving-safety-margin': DEFAULT_SAFETY_MARGIN,
      'inner-engraving-y': -20,
    });
  });

  test('the defaults are within their own limits', () => {
    const patch = parseMaterial(JSON.stringify({ ...DEFAULT_MATERIAL, safetyMargin: DEFAULT_SAFETY_MARGIN }));

    expect(Object.keys(patch)).toHaveLength(10);
  });
});
