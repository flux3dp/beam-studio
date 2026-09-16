import type { Dispatch, SetStateAction } from 'react';
import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip } from 'antd';

import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/UnitInput';
import type { LensParameterIssues } from '@core/helpers/device/promark/validate-lens-parameters';
import useI18n from '@core/helpers/useI18n';
import type { Field } from '@core/interfaces/Promark';

import styles from './Block.module.scss';
import RangeTooltip from './RangeTooltip';

interface Props {
  field: Field;
  /** shown when the head focuses independently of the gantry; omitted leaves the row out */
  focusHeight?: number;
  /** offsets are hidden when the head's position is handled as a module offset instead */
  hideOffsets?: boolean;
  isInch: boolean;
  issues?: LensParameterIssues;
  onFocusHeightChange?: (value: number) => void;
  /** given when the field lens size is chosen rather than derived from the workarea */
  onWidthChange?: (value: number) => void;
  setField: Dispatch<SetStateAction<Field>>;
  /** shown when given; omitted when the lens profile block picks the work area */
  width?: number;
  widthOptions?: ReadonlyArray<number>;
}

const FieldBlock = ({
  field,
  focusHeight,
  hideOffsets = false,
  isInch,
  issues,
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
  // UnitInput reports null while its box is empty; Field has no room for that
  const handleChange = (key: keyof Field) => (val: null | number) => {
    if (val !== null) setField((cur) => ({ ...cur, [key]: val }));
  };

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
      )}
      {!hideOffsets && (
        <>
          <Flex align="center" className={styles.row} justify="space-between">
            <span className={styles.label}>{t.offsetX}</span>
            <RangeTooltip isInch={isInch} issue={issues?.['field.offsetX']}>
              <UnitInput
                addonAfter={isInch ? 'in' : 'mm'}
                className={styles.input}
                clipValue={false}
                data-testid="offset-x"
                isInch={isInch}
                onChange={handleChange('offsetX')}
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
                onChange={handleChange('offsetY')}
                precision={isInch ? 5 : 3}
                size="small"
                status={issues?.['field.offsetY']?.level}
                value={offsetY}
              />
            </RangeTooltip>
          </Flex>
        </>
      )}
      <Flex align="center" className={styles.row} justify="space-between">
        <span className={styles.label}>{t.angle}</span>
        <RangeTooltip issue={issues?.['field.angle']}>
          <UnitInput
            addonAfter="deg"
            className={styles.input}
            clipValue={false}
            data-testid="angle"
            onChange={handleChange('angle')}
            precision={3}
            size="small"
            status={issues?.['field.angle']?.level}
            step={0.001}
            value={angle}
          />
        </RangeTooltip>
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
