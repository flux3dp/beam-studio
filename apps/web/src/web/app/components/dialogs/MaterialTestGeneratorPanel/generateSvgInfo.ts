import { BlockSetting } from './BlockSetting';
import { Detail, TableSetting } from './TableSetting';

interface Props {
  tableSetting: TableSetting;
  blockSetting: BlockSetting;
}

export interface SvgInfo {
  name: string;
  strength: number;
  speed: number;
  repeat: number;
  pulseWidth?: number;
  frequency?: number;
  fillInterval?: number;
}

const namingMap = {
  strength: 'P',
  speed: 'S',
  repeat: 'C',
  pulseWidth: 'PW',
  frequency: 'F',
  fillInterval: 'FI',
};

export default function generateSvgInfo({
  tableSetting,
  blockSetting: {
    column: {
      count: { value: colLength },
    },
    row: {
      count: { value: rowLength },
    },
  },
}: Props): Array<SvgInfo> {
  const [col, row, ...staticParams] = Object.entries(tableSetting).sort(
    ([, { selected: a }], [, { selected: b }]) => a - b
  );
  const generateRange = (length: number, [key, { minValue, maxValue }]: [string, Detail]) =>
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
      name: `${namingMap[col[0]]}${c}-${namingMap[row[0]]}${r}`,
      [col[0]]: c,
      [row[0]]: r,
      ...staticParams.map(([key, value]) => ({ [key]: value.default })),
    }))
  ) as unknown as Array<SvgInfo>;
}
