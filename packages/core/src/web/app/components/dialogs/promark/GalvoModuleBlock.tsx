import React from 'react';

import { Flex } from 'antd';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';

interface Props {
  focusHeight: number;
  isInch: boolean;
  offsets: { x: number; y: number };
  onFocusHeightChange: (value: number) => void;
  onOffsetsChange: (offsets: { x: number; y: number }) => void;
}

/**
 * Where the head sits and how far it focuses, as opposed to the field block's numbers.
 *
 * The two kinds of offset look alike but do different work and live apart: the field offset shifts
 * the beam inside the galvo's own optics, while this one is the head's position relative to the
 * nozzle, kept in toolhead_shift and used when the job is rendered.
 */
const GalvoModuleBlock = ({
  focusHeight,
  isInch,
  offsets,
  onFocusHeightChange,
  onOffsetsChange,
}: Props): React.JSX.Element => {
  const { device: tDevice, promark_settings: t } = useI18n();
  // UnitInput reports null while its box is empty, which is not a value these can take
  const handleOffsetChange = (axis: 'x' | 'y') => (val: null | number) => {
    if (val !== null) onOffsetsChange({ ...offsets, [axis]: val });
  };

  return (
    <Flex className={styles.block} gap={8} vertical>
      <div className={styles.title}>{tDevice.submodule_type}</div>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.focus_height}</span>
        <UnitInput
          addonAfter={isInch ? 'in' : 'mm'}
          className={styles.input}
          data-testid="focus-height"
          isInch={isInch}
          onChange={(val) => {
            if (val !== null) onFocusHeightChange(val);
          }}
          precision={isInch ? 5 : 2}
          size="small"
          value={focusHeight}
        />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetX}</span>
        <UnitInput
          addonAfter={isInch ? 'in' : 'mm'}
          className={styles.input}
          data-testid="module-offset-x"
          isInch={isInch}
          onChange={handleOffsetChange('x')}
          precision={isInch ? 5 : 3}
          size="small"
          value={offsets.x}
        />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetY}</span>
        <UnitInput
          addonAfter={isInch ? 'in' : 'mm'}
          className={styles.input}
          data-testid="module-offset-y"
          isInch={isInch}
          onChange={handleOffsetChange('y')}
          precision={isInch ? 5 : 3}
          size="small"
          value={offsets.y}
        />
      </Flex>
    </Flex>
  );
};

export default GalvoModuleBlock;
