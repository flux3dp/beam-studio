import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import useI18n from '@core/helpers/useI18n';

import { DEFAULT_OUTLINE_OFFSET } from '../../../categories';
import useKeychainShapeStore from '../../../useKeychainShapeStore';
import NumberControl from '../Controls/NumberControl';

const OutlineOffsetControl = (): ReactNode => {
  const outlineOffset = useKeychainShapeStore((s) => s.state.outlineOffset);
  const { keychain_generator: t } = useI18n();

  const handleOutlineOffsetChange = useCallback(async (outlineOffset: number) => {
    const { applyOptions, buildBaseShape, category, updateState } = useKeychainShapeStore.getState();

    updateState({ outlineOffset });

    const isFresh = await buildBaseShape(category);

    if (isFresh) applyOptions();
  }, []);

  return (
    <NumberControl
      defaultValue={DEFAULT_OUTLINE_OFFSET}
      label={t.outline_offset}
      max={10}
      min={0.5}
      onChange={handleOutlineOffsetChange}
      step={0.5}
      unit="mm"
      value={outlineOffset}
    />
  );
};

OutlineOffsetControl.displayName = 'OutlineOffsetControl';

export default memo(OutlineOffsetControl);
