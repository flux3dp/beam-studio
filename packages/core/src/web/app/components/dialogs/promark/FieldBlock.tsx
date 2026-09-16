import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip } from 'antd';

import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';
import type { Field } from '@core/interfaces/Promark';

import styles from './Block.module.scss';

interface Props {
  field: Field;
  /** shown when the head focuses independently of the gantry; omitted leaves the row out */
  focusHeight?: number;
  /** offsets are hidden when the head's position is handled as a module offset instead */
  hideOffsets?: boolean;
  isInch: boolean;
  onFocusHeightChange?: (value: number) => void;
  /** given when the field lens size is chosen rather than derived from the workarea */
  onWidthChange?: (value: number) => void;
  setField: Dispatch<SetStateAction<Field>>;
  width: number;
  widthOptions?: ReadonlyArray<number>;
}

const FieldBlock = ({
  field,
  focusHeight,
  hideOffsets = false,
  isInch,
  onFocusHeightChange,
  onWidthChange,
  setField,
  width,
  widthOptions,
}: Props): React.JSX.Element => {
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
        {widthOptions ? (
          <Select
            className={styles.input}
            data-testid="field-width"
            onChange={onWidthChange}
            options={widthOptions.map((value) => ({ label: `${value} mm`, value }))}
            size="small"
            value={width}
          />
        ) : (
          <UnitInput addonAfter="mm" className={styles.input} disabled size="small" value={width} />
        )}
      </Flex>
      {!hideOffsets && (
        <>
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
        </>
      )}
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
      {focusHeight !== undefined && (
        <Flex align="center" className={styles.row} justify="space-between">
          <span className={styles.label}>{t.focus_height}</span>
          <UnitInput
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            data-testid="focus-height"
            isInch={isInch}
            onChange={(val) => {
              if (val !== null) onFocusHeightChange?.(val);
            }}
            precision={isInch ? 5 : 2}
            size="small"
            value={focusHeight}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default FieldBlock;
