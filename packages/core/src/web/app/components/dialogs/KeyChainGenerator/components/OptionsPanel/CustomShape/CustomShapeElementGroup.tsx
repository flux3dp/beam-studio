import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { CustomShapeElementOptionDef, CustomShapeElementValues } from '../../../types';
import useKeychainShapeStore from '../../../useKeychainShapeStore';
import GroupCollapse from '../Controls/GroupCollapse';
import NumberControl from '../Controls/NumberControl';
import ElementPicker from '../Element/ElementPicker';

interface CustomShapeElementGroupProps {
  elementDef: CustomShapeElementOptionDef;
}

const CustomShapeElementGroup = ({ elementDef }: CustomShapeElementGroupProps): ReactNode => {
  const { defaults } = elementDef;
  const customShapeElement = useKeychainShapeStore((s) => s.state.customShapeElement);
  const { keychain_generator: t } = useI18n();

  const handleElementChange = useCallback(async (updates: Partial<CustomShapeElementValues>) => {
    const {
      applyOptions,
      buildBaseShape,
      category,
      state: { customShapeElement },
      updateState,
    } = useKeychainShapeStore.getState();

    updateState({ customShapeElement: { ...customShapeElement, ...updates } });

    const isFresh = await buildBaseShape(category);

    if (isFresh) applyOptions();
  }, []);

  const handleClearElement = useCallback(() => {
    handleElementChange({ enabled: false, shapeKey: '' });
  }, [handleElementChange]);

  const handleElementShapeChange = useCallback(
    (shapeKey: string) => {
      handleElementChange({ enabled: true, shapeKey });
    },
    [handleElementChange],
  );

  const handleElementSizeChange = useCallback(
    (size: number) => {
      handleElementChange({ size });
    },
    [handleElementChange],
  );

  return (
    <GroupCollapse title={t.element}>
      <ElementPicker
        onChange={handleElementShapeChange}
        onClear={handleClearElement}
        options={elementDef.options}
        selectedKey={customShapeElement.shapeKey}
        title={t.element}
      />
      {customShapeElement.shapeKey && (
        <NumberControl
          defaultValue={defaults.size}
          label={t.element_size}
          max={200}
          min={0}
          onChange={handleElementSizeChange}
          step={1}
          unit="%"
          value={customShapeElement.size}
        />
      )}
    </GroupCollapse>
  );
};

CustomShapeElementGroup.displayName = 'CustomShapeElementGroup';

export default memo(CustomShapeElementGroup);
