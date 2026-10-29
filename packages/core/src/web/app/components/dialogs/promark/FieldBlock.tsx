import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip } from 'antd';

import UnitInput from '@core/app/widgets/UnitInput';
import type { LensParameterIssues } from '@core/helpers/device/promark/validate-lens-parameters';
import useI18n from '@core/helpers/useI18n';
import type { Field } from '@core/interfaces/Promark';

import styles from './Block.module.scss';
import RangeTooltip from './RangeTooltip';

interface Props {
  field: Field;
  isInch: boolean;
  issues?: LensParameterIssues;
  setField: Dispatch<SetStateAction<Field>>;
  /** shown read-only when given; omitted when the lens profile block picks the work area */
  width?: number;
}

const FieldBlock = ({ field, isInch, issues, setField, width }: Props): React.JSX.Element => {
  const {
    beambox: { document_panel: tDocu },
    promark_settings: t,
  } = useI18n();
  const { angle, offsetX, offsetY } = field;

  return (
    <Flex className={styles.block} gap={8} vertical>
      <div className={styles.title}>{t.field}</div>
      {width !== undefined && (
        <Flex align="center" className={styles.row} justify="space-between">
          <Flex align="center">
            <span className={styles.label}>{tDocu.workarea}</span>
            <Tooltip title={t.workarea_hint}>
              <QuestionCircleOutlined className={styles.tooltip} />
            </Tooltip>
          </Flex>
          <UnitInput addonAfter="mm" className={styles.input} disabled size="small" value={width} />
        </Flex>
      )}
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetX}</span>
        <RangeTooltip isInch={isInch} issue={issues?.['field.offsetX']}>
          <UnitInput
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            clipValue={false}
            data-testid="offset-x"
            isInch={isInch}
            onChange={(val) => setField((cur) => ({ ...cur, offsetX: val }))}
            precision={isInch ? 5 : 3}
            size="small"
            status={issues?.['field.offsetX']?.level}
            value={offsetX}
          />
        </RangeTooltip>
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetY}</span>
        <RangeTooltip isInch={isInch} issue={issues?.['field.offsetY']}>
          <UnitInput
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            clipValue={false}
            data-testid="offset-y"
            isInch={isInch}
            onChange={(val) => setField((cur) => ({ ...cur, offsetY: val }))}
            precision={isInch ? 5 : 3}
            size="small"
            status={issues?.['field.offsetY']?.level}
            value={offsetY}
          />
        </RangeTooltip>
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.angle}</span>
        <RangeTooltip issue={issues?.['field.angle']}>
          <UnitInput
            addonAfter="deg"
            className={styles.input}
            clipValue={false}
            data-testid="angle"
            onChange={(val) => setField((cur) => ({ ...cur, angle: val }))}
            precision={3}
            size="small"
            status={issues?.['field.angle']?.level}
            step={0.001}
            value={angle}
          />
        </RangeTooltip>
      </Flex>
    </Flex>
  );
};

export default FieldBlock;
