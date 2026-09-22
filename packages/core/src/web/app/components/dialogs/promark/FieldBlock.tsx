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
  isInch: boolean;
  /**
   * Offsets to show in place of the field's own. HEXA II keeps the head's position relative to the
   * nozzle in toolhead_shift, so the dialog owns those two numbers rather than the galvo config.
   */
  offsets?: { x: number; y: number };
  onFocusHeightChange?: (value: number) => void;
  onOffsetsChange?: (offsets: { x: number; y: number }) => void;
  /** given when the field lens size is chosen rather than derived from the workarea */
  onWidthChange?: (value: number) => void;
  setField: Dispatch<SetStateAction<Field>>;
  width: number;
  widthOptions?: ReadonlyArray<number>;
}

const FieldBlock = ({
  field,
  focusHeight,
  isInch,
  offsets,
  onFocusHeightChange,
  onOffsetsChange,
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
  const shownOffsets = offsets ?? { x: offsetX, y: offsetY };
  // UnitInput reports null while its box is empty; Field has no room for that
  const handleChange = (key: keyof Field) => (val: null | number) => {
    if (val !== null) setField((cur) => ({ ...cur, [key]: val }));
  };
  const handleOffsetChange = (axis: 'x' | 'y') => (val: null | number) => {
    if (val === null) return;

    if (offsets) onOffsetsChange?.({ ...offsets, [axis]: val });
    else handleChange(axis === 'x' ? 'offsetX' : 'offsetY')(val);
  };

  return (
    <Flex className={styles.block} gap={8} vertical>
      <div className={styles.title}>{t.field}</div>
      <Flex align="center" className={styles.row} justify="space-between">
        <Flex align="center">
          <span className={styles.label}>{tDocu.workarea}</span>
          {!widthOptions && (
            <Tooltip title={t.workarea_hint}>
              <QuestionCircleOutlined className={styles.tooltip} />
            </Tooltip>
          )}
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
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetX}</span>
        <UnitInput
          addonAfter={isInch ? 'in' : 'mm'}
          className={styles.input}
          data-testid="offset-x"
          isInch={isInch}
          onChange={handleOffsetChange('x')}
          precision={isInch ? 5 : 3}
          size="small"
          value={shownOffsets.x}
        />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.offsetY}</span>
        <UnitInput
          addonAfter={isInch ? 'in' : 'mm'}
          className={styles.input}
          data-testid="offset-y"
          isInch={isInch}
          onChange={handleOffsetChange('y')}
          precision={isInch ? 5 : 3}
          size="small"
          value={shownOffsets.y}
        />
      </Flex>
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.angle}</span>
        <UnitInput
          addonAfter="deg"
          className={styles.input}
          data-testid="angle"
          onChange={handleChange('angle')}
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
