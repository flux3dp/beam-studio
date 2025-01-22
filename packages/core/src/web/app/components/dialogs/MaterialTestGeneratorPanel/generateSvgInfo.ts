import type { BlockSetting } from './BlockSetting';
import type { Detail, TableSetting } from './TableSetting';

interface Props {
  blockSetting: BlockSetting;
  tableSetting: TableSetting;
}

export interface SvgInfo {
  fillInterval?: number;
  frequency?: number;
  name: string;
  pulseWidth?: number;
  repeat: number;
  speed: number;
  strength: number;
}

const namingMap = {
  fillInterval: 'FI',
  frequency: 'F',
  pulseWidth: 'PW',
  repeat: 'C',
  speed: 'S',
  strength: 'P',
};

export default function generateSvgInfo({
  blockSetting: {
    column: {
      count: { value: colLength },
    },
    row: {
      count: { value: rowLength },
    },
  },
  tableSetting,
}: Props): SvgInfo[] {
  const [col, row, ...staticParams] = Object.entries(tableSetting).sort(
    ([, { selected: a }], [, { selected: b }]) => a - b,
  );
  const generateRange = (length: number, [key, { maxValue, minValue }]: [string, Detail]) =>
    Array.from({ length }, (_, i) => {
      const value = minValue + (maxValue - minValue) * (i / (length !== 1 ? length - 1 : 1));

      // Round to 4 decimal places for fillInterval
      if (key === 'fillInterval') {
        return Math.round(value * 10000) / 10000;
      }

      return Math.ceil(value);
    });

  const colRange = generateRange(colLength, col);
  const rowRange = generateRange(rowLength, row);

  return colRange.flatMap((c) =>
    rowRange.map((r) => ({
      [col[0]]: c,
      name: `${namingMap[col[0]]}${c}-${namingMap[row[0]]}${r}`,
      [row[0]]: r,
      ...staticParams.map(([key, value]) => ({ [key]: value.default })),
    })),
  ) as unknown as SvgInfo[];
}
