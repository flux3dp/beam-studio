import type { ReactNode } from 'react';
import React, { memo, useCallback, useState } from 'react';

import { Button } from 'antd';

import { ElementPanelContent } from '@core/app/components/dialogs/ElementPanel/ElementPanel';
import { ElementPanelProvider } from '@core/app/contexts/ElementPanelContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import useI18n from '@core/helpers/useI18n';

import { loadShape } from '../../../buildKeychainElement';

import styles from './ElementControl.module.scss';
import PresetSelector from './PresetSelector';

interface ElementPickerProps {
  onChange: (shapeKey: string) => void;
  selectedKey: string;
  title?: string;
}

const ElementPicker = ({ onChange, selectedKey, title }: ElementPickerProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const [browserOpen, setBrowserOpen] = useState(false);

  const handleSelect = useCallback(
    async (shapeKey: string) => {
      if (shapeKey) await loadShape(shapeKey);

      onChange(shapeKey);
    },
    [onChange],
  );

  const closeBrowser = useCallback(() => setBrowserOpen(false), []);
  const handleElementSelect = useCallback(
    (shapeKey: string) => {
      handleSelect(shapeKey);
      closeBrowser();
    },
    [handleSelect, closeBrowser],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>{title ?? t.element}</div>
        <Button className={styles.button} onClick={() => setBrowserOpen(true)} size="small" title={t.more_shapes}>
          <LeftPanelIcons.Element />
        </Button>
      </div>
      <PresetSelector onSelect={handleSelect} selectedKey={selectedKey} />
      <ElementPanelProvider onClose={closeBrowser} onElementSelect={handleElementSelect} open={browserOpen}>
        <ElementPanelContent drawerPlacement="right" />
      </ElementPanelProvider>
    </div>
  );
};

ElementPicker.displayName = 'ElementPicker';

export default memo(ElementPicker);
