import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { Flex } from 'antd';

import UnitInput from '@core/app/widgets/UnitInput';
import type { LensParameterIssues } from '@core/helpers/device/promark/validate-lens-parameters';
import useI18n from '@core/helpers/useI18n';
import type { RedDot } from '@core/interfaces/Promark';

import styles from './Block.module.scss';
import RangeTooltip from './RangeTooltip';

interface Props {
  isInch: boolean;
  issues?: LensParameterIssues;
  redDot: RedDot;
  setRedDot: Dispatch<SetStateAction<RedDot>>;
}

const RedDotBlock = ({ isInch, issues, redDot, setRedDot }: Props): React.JSX.Element => {
  const { promark_settings: t } = useI18n();
  const { offsetX, offsetY, scaleX, scaleY } = redDot;

  return (
    <Flex className={styles.block} gap={8} vertical>
      <div className={styles.title}>{t.red_dot}</div>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetX}</span>
        <RangeTooltip isInch={isInch} issue={issues?.['redDot.offsetX']}>
          <UnitInput
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            clipValue={false}
            data-testid="offset-x"
            isInch={isInch}
            onChange={(val) => setRedDot((cur) => ({ ...cur, offsetX: val }))}
            precision={isInch ? 5 : 3}
            size="small"
            status={issues?.['redDot.offsetX']?.level}
            value={offsetX}
          />
        </RangeTooltip>
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetY}</span>
        <RangeTooltip isInch={isInch} issue={issues?.['redDot.offsetY']}>
          <UnitInput
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            clipValue={false}
            data-testid="offset-y"
            isInch={isInch}
            onChange={(val) => setRedDot((cur) => ({ ...cur, offsetY: val }))}
            precision={isInch ? 5 : 3}
            size="small"
            status={issues?.['redDot.offsetY']?.level}
            value={offsetY}
          />
        </RangeTooltip>
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.scaleX}</span>
        <RangeTooltip issue={issues?.['redDot.scaleX']}>
          <UnitInput
            className={styles.input}
            clipValue={false}
            data-testid="scale-x"
            onChange={(val) => setRedDot((cur) => ({ ...cur, scaleX: val }))}
            precision={3}
            size="small"
            status={issues?.['redDot.scaleX']?.level}
            step={0.001}
            value={scaleX}
          />
        </RangeTooltip>
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.scaleY}</span>
        <RangeTooltip issue={issues?.['redDot.scaleY']}>
          <UnitInput
            className={styles.input}
            clipValue={false}
            data-testid="scale-y"
            onChange={(val) => setRedDot((cur) => ({ ...cur, scaleY: val }))}
            precision={3}
            size="small"
            status={issues?.['redDot.scaleY']?.level}
            step={0.001}
            value={scaleY}
          />
        </RangeTooltip>
      </Flex>
    </Flex>
  );
};

export default RedDotBlock;
