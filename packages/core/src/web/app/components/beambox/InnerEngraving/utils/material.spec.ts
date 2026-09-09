jest.mock('@core/app/stores/documentStore');

import { useDocumentStore } from '@core/app/stores/documentStore';

import { getMaterial, getMaterialZRangeMm } from './material';

describe('inner engraving material', () => {
  beforeEach(() => jest.clearAllMocks());

  test('positions a sphere above its base and reports its engravable Z interval', () => {
    useDocumentStore.setState({
      'inner-engraving-base-height': 12,
      'inner-engraving-diameter': 40,
      'inner-engraving-height': 60,
      'inner-engraving-shape': 'sphere',
    });

    expect(getMaterial()).toEqual(
      expect.objectContaining({ center: [350, 350, 320], height: 600, maxZ: 520, minZ: 120 }),
    );
    expect(getMaterialZRangeMm()).toEqual({ max: 52, min: 12 });
  });

  test('keeps non-spherical materials on the work platform', () => {
    useDocumentStore.setState({
      'inner-engraving-base-height': 12,
      'inner-engraving-height': 30,
      'inner-engraving-shape': 'box',
    });

    expect(getMaterial()).toEqual(expect.objectContaining({ center: [350, 350, 150], maxZ: 300, minZ: 0 }));
    expect(getMaterialZRangeMm()).toEqual({ max: 30, min: 0 });
  });
});
