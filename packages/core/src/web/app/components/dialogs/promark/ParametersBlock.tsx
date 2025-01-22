import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';

export interface MarkParameters {
  power: number;
  speed: number;
}

interface Props {
  isInch: boolean;
  parameters: MarkParameters;
  setParameters: Dispatch<SetStateAction<MarkParameters>>;
}

const ParametersBlock = ({ isInch, parameters: { power, speed }, setParameters }: Props): React.JSX.Element => {
  const {
    beambox: {
      right_panel: { laser_panel: tLaserPanel },
    },
  } = useI18n();

  return (
    <>
      <Flex align="center" gap={20} justify="space-between">
        <Flex align="center" className={styles.row} gap={12} justify="space-between">
          <span className={styles.label}>{tLaserPanel.strength}</span>
          <UnitInput
            addonAfter="%"
            className={classNames(styles.input, styles.short)}
            data-testid="power"
            max={100}
            min={0}
            onChange={(val) => setParameters((cur) => ({ ...cur, power: val }))}
            precision={0}
            size="small"
            value={power}
          />
        </Flex>
        <Flex align="center" className={styles.row} gap={12} justify="space-between">
          <span className={styles.label}>{tLaserPanel.speed}</span>
          <UnitInput
            addonAfter={isInch ? 'in/s' : 'mm/s'}
            className={styles.input}
            data-testid="speed"
            isInch={isInch}
            max={3000}
            min={100}
            onChange={(val) => setParameters((cur) => ({ ...cur, speed: val }))}
            precision={0}
            size="small"
            value={speed}
          />
        </Flex>
      </Flex>
    </>
  );
};

export default ParametersBlock;
