import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import type { ElementOptionDef } from '../../../types';
import useKeychainShapeStore from '../../../useKeychainShapeStore';

import ElementPicker from './ElementPicker';

interface ElementControlProps {
  optionDef: ElementOptionDef;
}

const ElementControl = ({ optionDef }: ElementControlProps): ReactNode => {
  const { id } = optionDef;
  const element = useKeychainShapeStore((s) => s.state.elements[id]);

  const handleChange = useCallback(
    (shapeKey: string) => {
      const {
        applyOptions,
        state: { elements },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ elements: { ...elements, [id]: { ...elements[id], shapeKey } } });
      applyOptions();
    },
    [id],
  );

  return <ElementPicker onChange={handleChange} selectedKey={element.shapeKey} />;
};

ElementControl.displayName = 'ElementControl';

export default memo(ElementControl);
