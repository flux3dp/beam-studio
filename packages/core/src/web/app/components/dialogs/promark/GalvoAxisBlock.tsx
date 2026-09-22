import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { Flex, Switch } from 'antd';
import classNames from 'classnames';

import type { Field } from '@core/interfaces/Promark';

import blockStyles from './Block.module.scss';

interface Props {
  field: Field;
  setField: Dispatch<SetStateAction<Field>>;
}

const options = [
  { key: 'swapXY', label: 'Swap XY' },
  { key: 'invertX', label: 'Invert X' },
  { key: 'invertY', label: 'Invert Y' },
] as const satisfies ReadonlyArray<{ key: keyof Field; label: string }>;

/**
 * How the galvo's own axes map onto the machine's. Wrong values mirror or rotate everything the
 * head marks, so this stays a dev block until the factory settles one orientation per head.
 *
 * TODO: dev only, hence the untranslated labels.
 */
const GalvoAxisBlock = ({ field, setField }: Props): React.JSX.Element => (
  <Flex className={classNames(blockStyles.block, blockStyles['full-row'])} gap={8} vertical>
    <div className={blockStyles.title}>Axis (dev)</div>
    {/* three choices reading as one row, so they sit together instead of spanning the dialog */}
    <Flex align="center" gap={32} wrap>
      {options.map(({ key, label }) => (
        <Flex align="center" className={blockStyles.row} gap={8} key={key}>
          <span className={blockStyles.label}>{label}</span>
          <Switch
            checked={Boolean(field[key])}
            data-testid={key}
            onChange={(checked) => setField((cur) => ({ ...cur, [key]: checked }))}
            size="small"
          />
        </Flex>
      ))}
    </Flex>
  </Flex>
);

export default GalvoAxisBlock;
