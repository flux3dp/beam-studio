import React, { Dispatch, SetStateAction } from 'react';
import { Flex, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { Field } from 'interfaces/Promark';

import styles from './Block.module.scss';

interface Props {
  isInch: boolean;
  width: number;
  field: Field;
  setField: Dispatch<SetStateAction<Field>>;
}

const FieldBlock = ({ isInch, width, field, setField }: Props): JSX.Element => {
  const {
    promark_settings: t,
    beambox: { document_panel: tDocu },
  } = useI18n();
  const { offsetX, offsetY, angle } = field;

  return (
    <Flex className={styles.block} vertical gap={8}>
      <div className={styles.title}>{t.field}</div>
      <Flex className={styles.row} justify="space-between" align="center">
        <Flex align="center">
          <span className={styles.label}>{tDocu.workarea}</span>
          <Tooltip title={t.workarea_hint}>
            <QuestionCircleOutlined className={styles.tooltip} />
          </Tooltip>
        </Flex>
        <UnitInput className={styles.input} size="small" value={width} addonAfter="mm" disabled />
      </Flex>
      <Flex className={styles.row} justify="space-between" align="center">
        <span className={styles.label}>{t.offsetX}</span>
        <UnitInput
          data-testid="offset-x"
          size="small"
          className={styles.input}
          value={offsetX}
          precision={isInch ? 5 : 3}
          addonAfter={isInch ? 'in' : 'mm'}
          isInch={isInch}
          onChange={(val) => setField((cur) => ({ ...cur, offsetX: val }))}
        />
      </Flex>
      <Flex className={styles.row} justify="space-between" align="center">
        <span className={styles.label}>{t.offsetY}</span>
        <UnitInput
          data-testid="offset-y"
          size="small"
          className={styles.input}
          value={offsetY}
          precision={isInch ? 5 : 3}
          addonAfter={isInch ? 'in' : 'mm'}
          isInch={isInch}
          onChange={(val) => setField((cur) => ({ ...cur, offsetY: val }))}
        />
      </Flex>
      <Flex className={styles.row} justify="space-between" align="center">
        <span className={styles.label}>{t.angle}</span>
        <UnitInput
          data-testid="angle"
          size="small"
          className={styles.input}
          value={angle}
          precision={3}
          addonAfter="deg"
          step={0.001}
          onChange={(val) => setField((cur) => ({ ...cur, angle: val }))}
        />
      </Flex>
    </Flex>
  );
};

export default FieldBlock;
