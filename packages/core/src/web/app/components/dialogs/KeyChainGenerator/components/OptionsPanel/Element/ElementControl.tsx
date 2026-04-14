import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import { Switch } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { ElementOptionDef } from '../../../types';
import useKeychainShapeStore from '../../../useKeychainShapeStore';

import styles from './ElementControl.module.scss';
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

      updateState({ elements: { ...elements, [id]: { ...elements[id], shapeKey } } });
      applyOptions();
    },
    [id],
  );

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
    <div className={styles.container}>
      <ElementPicker onChange={handleChange} selectedKey={element.shapeKey} />
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span>{t.emboss}</span>
        <Switch checked={element.emboss} onChange={handleEmbossChange} size="small" />
      </div>
    </div>
  );
};

ElementControl.displayName = 'ElementControl';

export default memo(ElementControl);
