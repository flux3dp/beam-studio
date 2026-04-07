import type { ReactNode } from 'react';
import React, { memo, useCallback, useState } from 'react';

import { Button } from 'antd';

import { ElementPanelContent } from '@core/app/components/dialogs/ElementPanel/ElementPanel';
import { ElementPanelProvider } from '@core/app/contexts/ElementPanelContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import useI18n from '@core/helpers/useI18n';

import { loadShape } from '../../buildKeychainElement';
import type { ElementOptionDef, ElementOptionValues } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import styles from './ElementControl.module.scss';
import ShapeSelector from './ShapeSelector';

interface ElementControlProps {
  optionDef: ElementOptionDef;
}

const ElementControl = ({ optionDef }: ElementControlProps): ReactNode => {
  const { id } = optionDef;
  const element = useKeychainShapeStore((s) => s.state.elements[id]);
  const { keychain_generator: t } = useI18n();
  const [browserOpen, setBrowserOpen] = useState(false);

  const handleChange = useCallback(
    async (updates: Partial<ElementOptionValues>) => {
      if (updates.shapeKey) {
        await loadShape(updates.shapeKey);
      }

      const {
        state: { elements },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ elements: { ...elements, [id]: { ...elements[id], ...updates } } });
    },
    [id],
  );

  const handleShapeChange = useCallback((shapeKey: string) => handleChange({ shapeKey }), [handleChange]);
  const handleClear = useCallback(() => handleChange({ shapeKey: '' }), [handleChange]);
  const closeBrowser = useCallback(() => setBrowserOpen(false), []);
  const handleElementSelect = useCallback(
    (shapeKey: string) => {
      handleShapeChange(shapeKey);
      closeBrowser();
    },
    [handleShapeChange, closeBrowser],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{t.element}</div>
        <Button className={styles.button} onClick={() => setBrowserOpen(true)} size="small" title={t.more_shapes}>
          <LeftPanelIcons.Element />
        </Button>
      </div>
      <ShapeSelector onClear={handleClear} onSelect={handleShapeChange} selectedKey={element.shapeKey} />
      <ElementPanelProvider onClose={closeBrowser} onElementSelect={handleElementSelect} open={browserOpen}>
        <ElementPanelContent drawerPlacement="right" />
      </ElementPanelProvider>
    </div>
  );
};

ElementControl.displayName = 'ElementControl';

export default memo(ElementControl);
