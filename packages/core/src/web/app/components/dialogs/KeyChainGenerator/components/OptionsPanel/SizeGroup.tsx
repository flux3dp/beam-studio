import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import useI18n from '@core/helpers/useI18n';

import useKeychainShapeStore from '../../useKeychainShapeStore';

import NumberControl from './Controls/NumberControl';

const SizeGroup = (): ReactNode => {
  const { keychain_generator: t } = useI18n();
  // Percentage of the category's default size (100 = default), shown directly as the scale value.
  const ratio = useKeychainShapeStore((s) => s.state.ratio);

  const handleChange = useCallback(async (nextRatio: number) => {
    const { applyOptions, buildBaseShape, category, updateState } = useKeychainShapeStore.getState();
    const { dimension, value: defaultValue } = category.defaultSize;

    updateState({ ratio: nextRatio, size: { dimension, value: (defaultValue * nextRatio) / 100 } });

    const isFresh = await buildBaseShape(category);

    if (isFresh) applyOptions();
  }, []);

  return (
    <NumberControl
      boldLabel
      defaultValue={100}
      label={t.size_scale}
      max={1000}
      min={1}
      onChange={handleChange}
      sliderMax={150}
      sliderMin={50}
      step={1}
      unit="%"
      value={ratio}
    />
  );
};

SizeGroup.displayName = 'SizeGroup';

export default memo(SizeGroup);
