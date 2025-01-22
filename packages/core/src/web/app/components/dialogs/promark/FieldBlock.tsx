import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip } from 'antd';

import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';
import type { Field } from '@core/interfaces/Promark';

import styles from './Block.module.scss';

interface Props {
  field: Field;
  isInch: boolean;
  setField: Dispatch<SetStateAction<Field>>;
  width: number;
}

const FieldBlock = ({ field, isInch, setField, width }: Props): React.JSX.Element => {
  const {
    beambox: { document_panel: tDocu },
    promark_settings: t,
  } = useI18n();
  const { angle, offsetX, offsetY } = field;

  return (
    <Flex className={styles.block} gap={8} vertical>
      <div className={styles.title}>{t.field}</div>
      <Flex align="center" className={styles.row} justify="space-between">
        <Flex align="center">
          <span className={styles.label}>{tDocu.workarea}</span>
          <Tooltip title={t.workarea_hint}>
            <QuestionCircleOutlined className={styles.tooltip} />
          </Tooltip>
        </Flex>
        <UnitInput addonAfter="mm" className={styles.input} disabled size="small" value={width} />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetX}</span>
        <UnitInput
          addonAfter={isInch ? 'in' : 'mm'}
          className={styles.input}
          data-testid="offset-x"
          isInch={isInch}
          onChange={(val) => setField((cur) => ({ ...cur, offsetX: val }))}
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
          onChange={(val) => setField((cur) => ({ ...cur, offsetY: val }))}
          precision={isInch ? 5 : 3}
          size="small"
          value={offsetY}
        />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.angle}</span>
        <UnitInput
          addonAfter="deg"
          className={styles.input}
          data-testid="angle"
          onChange={(val) => setField((cur) => ({ ...cur, angle: val }))}
          precision={3}
          size="small"
          step={0.001}
          value={angle}
        />
      </Flex>
    </Flex>
  );
};

export default FieldBlock;
