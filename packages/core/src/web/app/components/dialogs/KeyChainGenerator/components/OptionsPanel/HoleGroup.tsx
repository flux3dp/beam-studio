import type { ReactNode } from 'react';
import React, { memo, useCallback, useEffect, useMemo } from 'react';

import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import { PUNCH_HOLE_OFFSET } from '../../constants';
import type { HoleOptionDef, HoleOptionValues, HoleType } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import GroupControl from './GroupControl';
import styles from './GroupControl.module.scss';
import NumberControl from './NumberControl';

interface HoleGroupProps {
  optionDef: HoleOptionDef;
}

const HoleGroup = ({ optionDef }: HoleGroupProps): ReactNode => {
  const { defaults, id } = optionDef;
  const hole = useKeychainShapeStore((s) => s.state.holes[id]);
  const { keychain_generator: t } = useI18n();
  const isRing = useMemo(() => hole.type === 'ring', [hole.type]);

  const maxOffset = useMemo(
    () => (isRing ? hole.diameter / 2 + hole.thickness - 0.5 : -(hole.diameter / 2 + 0.5) - PUNCH_HOLE_OFFSET),
    [isRing, hole.diameter, hole.thickness],
  );
  const minOffset = useMemo(
    () => (isRing ? -(hole.diameter / 2) - hole.thickness + 0.5 : -5),
    [isRing, hole.diameter, hole.thickness],
  );

  const handleChange = useCallback(
    (updates: Partial<HoleOptionValues>) => {
      const {
        applyOptions,
        state: { holes },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ holes: { ...holes, [id]: { ...holes[id], ...updates } } });
      applyOptions();
    },
    [id],
  );

  const handleEnabledChange = useCallback((enabled: boolean) => handleChange({ enabled }), [handleChange]);
  const handleDiameterChange = useCallback((diameter: number) => handleChange({ diameter }), [handleChange]);
  const handlePositionChange = useCallback((position: number) => handleChange({ position }), [handleChange]);
  const handleOffsetChange = useCallback((offset: number) => handleChange({ offset }), [handleChange]);
  const handleThicknessChange = useCallback((thickness: number) => handleChange({ thickness }), [handleChange]);
  const handleTypeChange = useCallback(
    (type: HoleType) => {
      handleChange({ offset: defaults.offset, type });
    },
    [handleChange, defaults.offset],
  );

  useEffect(() => {
    if (hole.offset > maxOffset) {
      handleChange({ offset: maxOffset });
    } else if (hole.offset < minOffset) {
      handleChange({ offset: minOffset });
    }
  }, [maxOffset, minOffset, hole.offset, handleChange]);

  const typeOptions = useMemo(
    () => [
      { label: t.hole_type_ring, value: 'ring' as const },
      { label: t.hole_type_punch, value: 'punch' as const },
    ],
    [t],
  );

  return (
    <GroupControl enabled={hole.enabled} id={id} onToggle={handleEnabledChange} title={t.hole}>
      <div className={styles.content}>
        <Select onChange={handleTypeChange} options={typeOptions} value={hole.type} />
        <NumberControl
          defaultValue={defaults.diameter}
          label={t.hole_diameter}
          max={5}
          min={1}
          onChange={handleDiameterChange}
          step={0.5}
          unit="mm"
          value={hole.diameter}
        />
        <NumberControl
          defaultValue={defaults.position}
          label={t.hole_position}
          max={100}
          min={0}
          onChange={handlePositionChange}
          step={1}
          unit="%"
          value={hole.position}
        />
        <NumberControl
          defaultValue={defaults.offset}
          label={t.hole_offset}
          max={maxOffset}
          min={minOffset}
          onChange={handleOffsetChange}
          step={0.5}
          unit="mm"
          value={hole.offset}
        />
        {isRing && (
          <NumberControl
            defaultValue={defaults.thickness}
            label={t.hole_thickness}
            max={5}
            min={1}
            onChange={handleThicknessChange}
            step={0.5}
            unit="mm"
            value={hole.thickness}
          />
        )}
      </div>
    </GroupControl>
  );
};

HoleGroup.displayName = 'HoleGroup';

export default memo(HoleGroup);
