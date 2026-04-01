import type { ReactNode } from 'react';
import React, { memo, useCallback, useEffect, useMemo } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { HoleOptionValues } from '../../types';

import GroupControl from './GroupControl';
import styles from './GroupControl.module.scss';
import NumberControl from './NumberControl';

interface HoleGroupProps {
  defaults: HoleOptionValues;
  hole: HoleOptionValues;
  id: string;
  onHoleChange: (id: string, updates: Partial<HoleOptionValues>) => void;
}

const HoleGroup = ({ defaults, hole, id, onHoleChange }: HoleGroupProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const maxOffset = useMemo(() => hole.diameter / 2 + hole.thickness - 0.5, [hole.thickness, hole.diameter]);
  const minOffset = useMemo(() => -2 * hole.diameter, [hole.diameter]);

  // Prevent memo from rerender
  const handleEnabledChange = useCallback((enabled: boolean) => onHoleChange(id, { enabled }), [id, onHoleChange]);
  const handleDiameterChange = useCallback((diameter: number) => onHoleChange(id, { diameter }), [id, onHoleChange]);
  const handlePositionChange = useCallback((position: number) => onHoleChange(id, { position }), [id, onHoleChange]);
  const handleOffsetChange = useCallback((offset: number) => onHoleChange(id, { offset }), [id, onHoleChange]);
  const handleThicknessChange = useCallback((thickness: number) => onHoleChange(id, { thickness }), [id, onHoleChange]);

  useEffect(() => {
    if (hole.offset > maxOffset) {
      handleOffsetChange(maxOffset);
    } else if (hole.offset < minOffset) {
      handleOffsetChange(minOffset);
    }
  }, [maxOffset, minOffset, hole.offset, handleOffsetChange]);

  return (
    <GroupControl enabled={hole.enabled} id={id} onToggle={handleEnabledChange} title={t.hole}>
      <div className={styles.content}>
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
      </div>
    </GroupControl>
  );
};

HoleGroup.displayName = 'HoleGroup';

export default memo(HoleGroup);
