import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import Label from '@core/app/components/beambox/RightPanel/common/Label';
import { objectPanelInputTheme } from '@core/app/constants/antd-config';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import { ControlType } from '@core/helpers/element/editable/base';
import type { SizeKey, SizeKeyShort } from '@core/interfaces/ObjectPanel';

import styles from './DimensionPanel.module.scss';
import { subscribeDimensionValues } from './utils';

const typeMap: Record<SizeKeyShort, { key: SizeKey; label: React.ReactNode; ratio: number }> = {
  h: { key: 'height', label: 'H', ratio: 1 },
  rx: { key: 'rx', label: 'W', ratio: 0.5 },
  ry: { key: 'ry', label: 'H', ratio: 0.5 },
  w: { key: 'width', label: 'W', ratio: 1 },
};

interface Props {
  disabled?: boolean;
  onBlur?: () => void;
  onChange: (type: SizeKey, value: number) => void;
  type: SizeKeyShort;
  value: number;
}

const SizeInput = ({ disabled: propDisabled = false, onBlur, onChange, type, value }: Props): React.JSX.Element => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isTablet = useIsTabletOrMobile();
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);
  const editable = useSelectedElementStore((state) => state.editableInfo[ControlType._SIZE]?.value);
  const disabled = useMemo(
    () => propDisabled || (isWithinTemplateModes && !editable),
    [propDisabled, isWithinTemplateModes, editable],
  );
  const isInch = useStorageStore((state) => state.isInch);
  const { precision, unit } = useMemo<{ precision: number; unit: 'in' | 'mm' }>(
    () => (isInch ? { precision: 4, unit: 'in' } : { precision: 2, unit: 'mm' }),
    [isInch],
  );

  useEffect(() => subscribeDimensionValues(inputRef, type, unit, precision), [type, unit, precision]);

  const { key, label, ratio } = useMemo(() => typeMap[type], [type]);
  const handleChange = useCallback(
    (val: null | number) => {
      if (val !== null) onChange(key, val * ratio);
    },
    [onChange, key, ratio],
  );

  return (
    <div className={styles.dimension}>
      {isTablet ? <Label>{label}</Label> : <div className={styles.label}>{label}</div>}
      <UnitInput
        className={styles.input}
        controls={false}
        defaultValue={value}
        disabled={disabled}
        id={`${type}_size`}
        isInch={isInch}
        min={0}
        onBlur={onBlur}
        onChange={handleChange}
        precision={precision}
        ref={inputRef}
        step={isInch ? 2.54 : 1}
        theme={isTablet ? undefined : objectPanelInputTheme}
        underline={!isTablet}
        unit={unit}
      />
    </div>
  );
};

export default memo(SizeInput);
