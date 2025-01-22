import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { Flex } from 'antd';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';
import type { RedDot } from '@core/interfaces/Promark';

import styles from './Block.module.scss';

interface Props {
  isInch: boolean;
  redDot: RedDot;
  setRedDot: Dispatch<SetStateAction<RedDot>>;
}

const RedDotBlock = ({ isInch, redDot, setRedDot }: Props): React.JSX.Element => {
  const { promark_settings: t } = useI18n();
  const { offsetX, offsetY, scaleX, scaleY } = redDot;

  return (
    <Flex className={styles.block} gap={8} vertical>
      <div className={styles.title}>{t.red_dot}</div>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetX}</span>
        <UnitInput
          addonAfter={isInch ? 'in' : 'mm'}
          className={styles.input}
          data-testid="offset-x"
          isInch={isInch}
          onChange={(val) => setRedDot((cur) => ({ ...cur, offsetX: val }))}
          precision={isInch ? 5 : 3}
          size="small"
          value={offsetX}
        />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetY}</span>
        <UnitInput
          addonAfter={isInch ? 'in' : 'mm'}
          className={styles.input}
          data-testid="offset-y"
          isInch={isInch}
          onChange={(val) => setRedDot((cur) => ({ ...cur, offsetY: val }))}
          precision={isInch ? 5 : 3}
          size="small"
          value={offsetY}
        />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.scaleX}</span>
        <UnitInput
          className={styles.input}
          data-testid="scale-x"
          onChange={(val) => setRedDot((cur) => ({ ...cur, scaleX: val }))}
          precision={3}
          size="small"
          step={0.001}
          value={scaleX}
        />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.scaleY}</span>
        <UnitInput
          className={styles.input}
          data-testid="scale-y"
          onChange={(val) => setRedDot((cur) => ({ ...cur, scaleY: val }))}
          precision={3}
          size="small"
          step={0.001}
          value={scaleY}
        />
      </Flex>
    </Flex>
  );
};

export default RedDotBlock;
