import type { ReactNode } from 'react';
import React, { memo, useEffect, useMemo } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { HoleOptionValues } from '../../types';

import GroupControl from './GroupControl';
import styles from './GroupControl.module.scss';
import SliderControl from './SliderControl';

interface HoleGroupProps {
  defaults: HoleOptionValues;
  hole: HoleOptionValues;
  id: string;
  onHoleChange: (updates: Partial<HoleOptionValues>) => void;
}

const HoleGroup = ({ defaults, hole, id, onHoleChange }: HoleGroupProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const maxOffset = useMemo(() => hole.diameter / 2 + hole.thickness - 0.5, [hole.thickness, hole.diameter]);
  const minOffset = useMemo(() => -2 * hole.diameter, [hole.diameter]);

  useEffect(() => {
    if (hole.offset > maxOffset) {
      onHoleChange({ offset: maxOffset });
    } else if (hole.offset < minOffset) {
      onHoleChange({ offset: minOffset });
    }
  }, [maxOffset, minOffset, hole.offset, onHoleChange]);

  return (
    <GroupControl
      enabled={hole.enabled}
      id={id}
      onToggle={(checked) => onHoleChange({ enabled: checked })}
      title={t.hole}
    >
      <div className={styles.content}>
        <SliderControl
          defaultValue={defaults.diameter}
          label={t.hole_diameter}
          max={5}
          min={1}
          onChange={(val) => onHoleChange({ diameter: val })}
          step={0.5}
          unit="mm"
          value={hole.diameter}
        />
        <SliderControl
          defaultValue={defaults.position}
          label={t.hole_position}
          max={100}
          min={0}
          onChange={(val) => onHoleChange({ position: val })}
          step={1}
          unit="%"
          value={hole.position}
        />
        <SliderControl
          defaultValue={defaults.offset}
          label={t.hole_offset}
          max={maxOffset}
          min={minOffset}
          onChange={(val) => onHoleChange({ offset: val })}
          step={0.5}
          unit="mm"
          value={hole.offset}
        />
        <SliderControl
          defaultValue={defaults.thickness}
          label={t.hole_thickness}
          max={5}
          min={1}
          onChange={(val) => onHoleChange({ thickness: val })}
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
