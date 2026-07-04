import type { BlockSetting } from './BlockSetting';
import type { TableSetting } from './TableSetting';
import generateSvgInfo from './generateSvgInfo';

const buildBlockSetting = (colCount: number, rowCount: number): BlockSetting =>
  ({
    column: {
      count: { max: 20, min: 1, value: colCount },
      size: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 10 },
      spacing: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 5 },
    },
    row: {
      count: { max: 20, min: 1, value: rowCount },
      size: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 10 },
      spacing: { max: Number.MAX_SAFE_INTEGER, min: 1, value: 5 },
    },
  }) as BlockSetting;

describe('MaterialTestGeneratorPanel generateSvgInfo', () => {
  it('should generate col x row combinations with static params as named fields', () => {
    const tableSetting: TableSetting = {
      repeat: { default: 3, max: 100, maxValue: 5, min: 1, minValue: 1, selected: 2 },
      speed: { default: 20, max: 100, maxValue: 60, min: 1, minValue: 20, selected: 1 },
      strength: { default: 15, max: 100, maxValue: 100, min: 1, minValue: 15, selected: 0 },
    };

    const svgInfos = generateSvgInfo({ blockSetting: buildBlockSetting(2, 3), tableSetting });

    expect(svgInfos).toEqual([
      { name: 'P15-S20', repeat: 3, speed: 20, strength: 15 },
      { name: 'P15-S40', repeat: 3, speed: 40, strength: 15 },
      { name: 'P15-S60', repeat: 3, speed: 60, strength: 15 },
      { name: 'P100-S20', repeat: 3, speed: 20, strength: 100 },
      { name: 'P100-S40', repeat: 3, speed: 40, strength: 100 },
      { name: 'P100-S60', repeat: 3, speed: 60, strength: 100 },
    ]);
  });

  it('should include promark static params (fillInterval, frequency, pulseWidth) as named fields', () => {
    const tableSetting: TableSetting = {
      fillInterval: { default: 0.01, max: 100, maxValue: 1, min: 0.0001, minValue: 0.01, selected: 2 },
      frequency: { default: 27, max: 60, maxValue: 60, min: 27, minValue: 27, selected: 2 },
      pulseWidth: { default: 350, max: 500, maxValue: 500, min: 2, minValue: 2, selected: 2 },
      repeat: { default: 2, max: 100, maxValue: 5, min: 1, minValue: 1, selected: 2 },
      speed: { default: 1000, max: 4000, maxValue: 4000, min: 25, minValue: 25, selected: 1 },
      strength: { default: 15, max: 100, maxValue: 100, min: 1, minValue: 15, selected: 0 },
    };

    const svgInfos = generateSvgInfo({ blockSetting: buildBlockSetting(1, 2), tableSetting });

    expect(svgInfos).toEqual([
      { fillInterval: 0.01, frequency: 27, name: 'P15-S25', pulseWidth: 350, repeat: 2, speed: 25, strength: 15 },
      { fillInterval: 0.01, frequency: 27, name: 'P15-S4000', pulseWidth: 350, repeat: 2, speed: 4000, strength: 15 },
    ]);
  });
});
