import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import { objectPanelInputTheme } from '@core/app/constants/antd-config';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import { ControlType } from '@core/helpers/element/editable/base';
import type { PositionKey } from '@core/interfaces/ObjectPanel';

import styles from './DimensionPanel.module.scss';
import { subscribeDimensionValues } from './utils';

interface Props {
  onChange: (type: PositionKey, value: number) => void;
  type: PositionKey;
  value: number;
}

const typeMap: Record<PositionKey, { controlType: ControlType; label: string; sub?: string }> = {
  cx: { controlType: ControlType.POSITION_X, label: 'X', sub: 'C' },
  cy: { controlType: ControlType.POSITION_Y, label: 'Y', sub: 'C' },
  x: { controlType: ControlType.POSITION_X, label: 'X' },
  x1: { controlType: ControlType.POSITION_X, label: 'X', sub: '1' },
  x2: { controlType: ControlType.POSITION_X2, label: 'X', sub: '2' },
  y: { controlType: ControlType.POSITION_Y, label: 'Y' },
  y1: { controlType: ControlType.POSITION_Y, label: 'Y', sub: '1' },
  y2: { controlType: ControlType.POSITION_Y2, label: 'Y', sub: '2' },
};

const PositionInput = ({ onChange, type, value }: Props): React.JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isTablet = useIsTabletOrMobile();
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);
  const isInch = useStorageStore((state) => state.isInch);
  const { precision, unit } = useMemo<{ precision: number; unit: 'in' | 'mm' }>(
    () => (isInch ? { precision: 4, unit: 'in' } : { precision: 2, unit: 'mm' }),
    [isInch],
  );

  useEffect(() => subscribeDimensionValues(inputRef, type, unit, precision), [type, unit, precision]);

  const { controlType, label } = useMemo(() => {
    const config = typeMap[type];

    return {
      controlType: config.controlType,
      label: config.sub ? (
        <>
          {config.label}
          <sub>{config.sub}</sub>
        </>
      ) : (
        config.label
      ),
    };
  }, [type]);
  const editable = useSelectedElementStore((state) => state.editableInfo[controlType]?.value);
  const disabled = useMemo(() => isWithinTemplateModes && !editable, [isWithinTemplateModes, editable]);
  const inputId = useMemo(() => `${type}_position`, [type]);
  const handleChange = useCallback(
    (val: null | number) => {
      if (val !== null) onChange(type, val);
    },
    [type, onChange],
  );

  return (
    <ControlBlock className={styles.dimension} forceVisible label={label} type={controlType}>
      {!isTablet && <div className={styles.label}>{label}</div>}
      <UnitInput
        className={styles.input}
        controls={false}
        disabled={disabled}
        id={inputId}
        isInch={isInch}
        onChange={handleChange}
        precision={isInch ? 4 : 2}
        ref={inputRef}
        step={isInch ? 2.54 : 1}
        theme={isTablet ? undefined : objectPanelInputTheme}
        underline={!isTablet}
        unit={unit}
        value={value}
      />
    </ControlBlock>
  );
};

export default memo(PositionInput);
