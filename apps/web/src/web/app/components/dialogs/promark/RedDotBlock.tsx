import React, { Dispatch, SetStateAction } from 'react';
import { Flex } from 'antd';

import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { RedDot } from 'interfaces/Promark';

import styles from './Block.module.scss';

interface Props {
  isInch: boolean;
  redDot: RedDot;
  setRedDot: Dispatch<SetStateAction<RedDot>>;
}

const RedDotBlock = ({ isInch, redDot, setRedDot }: Props): JSX.Element => {
  const { promark_settings: t } = useI18n();
  const { offsetX, offsetY, scaleX, scaleY } = redDot;

  return (
    <Flex className={styles.block} vertical gap={8}>
      <div className={styles.title}>{t.red_dot}</div>
      <Flex className={styles.row} justify="space-between" align="center">
        <span className={styles.label}>{t.offsetX}</span>
        <UnitInput
          data-testid="offset-x"
          className={styles.input}
          size="small"
          value={offsetX}
          precision={isInch ? 5 : 3}
          addonAfter={isInch ? 'in' : 'mm'}
          isInch={isInch}
          onChange={(val) => setRedDot((cur) => ({ ...cur, offsetX: val }))}
        />
      </Flex>
      <Flex className={styles.row} justify="space-between" align="center">
        <span className={styles.label}>{t.offsetY}</span>
        <UnitInput
          data-testid="offset-y"
          className={styles.input}
          size="small"
          value={offsetY}
          precision={isInch ? 5 : 3}
          addonAfter={isInch ? 'in' : 'mm'}
          isInch={isInch}
          onChange={(val) => setRedDot((cur) => ({ ...cur, offsetY: val }))}
        />
      </Flex>
      <Flex className={styles.row} justify="space-between" align="center">
        <span className={styles.label}>{t.scaleX}</span>
        <UnitInput
          data-testid="scale-x"
          className={styles.input}
          size="small"
          value={scaleX}
          precision={3}
          step={0.001}
          onChange={(val) => setRedDot((cur) => ({ ...cur, scaleX: val }))}
        />
      </Flex>
      <Flex className={styles.row} justify="space-between" align="center">
        <span className={styles.label}>{t.scaleY}</span>
        <UnitInput
          data-testid="scale-y"
          className={styles.input}
          size="small"
          value={scaleY}
          precision={3}
          step={0.001}
          onChange={(val) => setRedDot((cur) => ({ ...cur, scaleY: val }))}
        />
      </Flex>
    </Flex>
  );
};

export default RedDotBlock;
