import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { ElementOptionDef } from '../../../types';
import useKeychainShapeStore from '../../../useKeychainShapeStore';
import GroupCollapse from '../Controls/GroupCollapse';
import SwitchControl from '../Controls/SwitchControl';

import ElementPicker from './ElementPicker';

interface ElementControlProps {
  optionDef: ElementOptionDef;
}

const ElementControl = ({ optionDef }: ElementControlProps): ReactNode => {
  const { id } = optionDef;
  const element = useKeychainShapeStore((s) => s.state.elements[id]);
  const { keychain_generator: t } = useI18n();

  const handleChange = useCallback(
    (shapeKey: string) => {
      const {
        applyOptions,
        state: { elements },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ elements: { ...elements, [id]: { ...elements[id], enabled: true, shapeKey } } });
      applyOptions();
    },
    [id],
  );

  const handleClear = useCallback(() => {
    const {
      applyOptions,
      state: { elements },
      updateState,
    } = useKeychainShapeStore.getState();

    updateState({ elements: { ...elements, [id]: { ...elements[id], enabled: false, shapeKey: '' } } });
    applyOptions();
  }, [id]);

  const handleEmbossChange = useCallback(
    (emboss: boolean) => {
      const {
        applyOptions,
        state: { elements },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ elements: { ...elements, [id]: { ...elements[id], emboss } } });
      applyOptions();
    },
    [id],
  );

  return (
    <GroupCollapse title={t.element}>
      <ElementPicker
        onChange={handleChange}
        onClear={element.enabled ? handleClear : undefined}
        options={optionDef.options}
        selectedKey={element.shapeKey}
      />
      <SwitchControl label={t.emboss} onChange={handleEmbossChange} value={element.emboss} />
    </GroupCollapse>
  );
};

ElementControl.displayName = 'ElementControl';

export default memo(ElementControl);
