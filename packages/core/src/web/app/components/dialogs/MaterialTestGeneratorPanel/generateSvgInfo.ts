import type { BlockSetting } from './BlockSetting';
import type { Detail, TableSetting } from './TableSetting';

interface Props {
  blockSetting: BlockSetting;
  tableSetting: TableSetting;
  /** Attach the fixed (non-axis) params as their `Detail.default`; otherwise they are left out. */
  withStaticParams?: boolean;
}

export interface SvgInfo {
  dottingTime?: number;
  fillDwellTime?: number;
  fillInterleave?: number;
  fillInterval?: number;
  frequency?: number;
  name: string;
  pointSpacing?: number;
  pulseWidth?: number;
  qPulseWidth?: number;
  repeat: number;
  speed: number;
  strength: number;
}

const namingMap = {
  dottingTime: 'DT',
  fillDwellTime: 'FD',
  fillInterleave: 'IL',
  fillInterval: 'FI',
  frequency: 'F',
  pointSpacing: 'PS',
  pulseWidth: 'PW',
  qPulseWidth: 'QW',
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
  withStaticParams = false,
}: Props): SvgInfo[] {
  const [col, row, ...staticParams] = Object.entries(tableSetting).sort(
    ([, { selected: a }], [, { selected: b }]) => a - b,
  );
  const generateRange = (length: number, [, { allowDecimal, maxValue, minValue }]: [string, Detail]) =>
    Array.from({ length }, (_, i) => {
      const value = minValue + (maxValue - minValue) * (i / (length !== 1 ? length - 1 : 1));

      // decimal params (Detail.allowDecimal) keep 4 decimal places
      if (allowDecimal) {
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
      // FIXME: the fixed params are applied only when asked (UV tables). Without them each block
      // keeps the layer defaults, because Detail.default is not a valid layer value for every
      // source: the Promark frequency defaults to the limit minimum (1kHz on MOPA) and the MOPA
      // pulse width to 350. Give every table correct defaults before applying them everywhere.
      ...(withStaticParams ? Object.fromEntries(staticParams.map(([key, value]) => [key, value.default])) : {}),
    })),
  ) as unknown as SvgInfo[];
}
