import type { ReactNode } from 'react';
import React, { memo, useCallback, useEffect, useMemo } from 'react';

import useI18n from '@core/helpers/useI18n';

import { PUNCH_HOLE_OFFSET } from '../../../constants';
import type { HoleOptionDef, HoleOptionValues, HoleType } from '../../../types';
import useKeychainShapeStore from '../../../useKeychainShapeStore';

import NumberControl from '../Controls/NumberControl';
import SelectControl from '../Controls/SelectControl';

interface HoleControlProps {
  optionDef: HoleOptionDef;
}

const HoleControl = ({ optionDef }: HoleControlProps): ReactNode => {
  const { defaults, id } = optionDef;
  const hole = useKeychainShapeStore((s) => s.state.holes[id]);
  const { keychain_generator: t } = useI18n();
  const isRing = useMemo(() => hole.type === 'ring', [hole.type]);

  const maxOffset = useMemo(
    () => (isRing ? hole.diameter / 2 + hole.thickness - 0.5 : -(hole.diameter / 2 + 0.5) - PUNCH_HOLE_OFFSET),
    [isRing, hole.diameter, hole.thickness],
  );
  const minOffset = useMemo(
    () => (isRing ? -(hole.diameter / 2) - hole.thickness + 0.5 : -3),
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
      { label: t.hole_options.type_ring, value: 'ring' as const },
      { label: t.hole_options.type_punch, value: 'punch' as const },
    ],
    [t],
  );

  return (
    <>
      <SelectControl
        label={t.hole_options.hole_type}
        onChange={handleTypeChange}
        options={typeOptions}
        value={hole.type}
      />
      <NumberControl
        defaultValue={defaults.diameter}
        label={t.hole_options.diameter}
        max={5}
        min={1}
        onChange={handleDiameterChange}
        step={0.5}
        unit="mm"
        value={hole.diameter}
      />
      <NumberControl
        defaultValue={defaults.position}
        label={t.hole_options.position}
        max={100}
        min={0}
        onChange={handlePositionChange}
        step={1}
        unit="%"
        value={hole.position}
      />
      <NumberControl
        defaultValue={defaults.offset}
        label={t.hole_options.offset}
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
          label={t.hole_options.thickness}
          max={5}
          min={1}
          onChange={handleThicknessChange}
          step={0.5}
          unit="mm"
          value={hole.thickness}
        />
      )}
    </>
  );
};

HoleControl.displayName = 'HoleControl';

export default memo(HoleControl);
