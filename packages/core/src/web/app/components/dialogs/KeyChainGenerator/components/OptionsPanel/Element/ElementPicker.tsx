import type { ReactNode } from 'react';
import React, { memo, useCallback, useState } from 'react';

import ElementPanelContent from '@core/app/components/dialogs/ElementPanel/ElementPanelContent';
import { ElementPanelProvider } from '@core/app/contexts/ElementPanelContext';

import PresetSelector from './PresetSelector';

interface ElementPickerProps {
  onChange: (shapeKey: string) => void;
  onClear?: () => void;
  options: string[];
  selectedKey: string;
  title?: string;
}

const ElementPicker = ({ onChange, onClear, options, selectedKey }: ElementPickerProps): ReactNode => {
  const [browserOpen, setBrowserOpen] = useState(false);

  const handleSelect = useCallback(async (shapeKey: string) => onChange(shapeKey), [onChange]);
  const openBrowser = useCallback(() => setBrowserOpen(true), []);
  const closeBrowser = useCallback(() => setBrowserOpen(false), []);
  const handleElementSelect = useCallback(
    (shapeKey: string) => {
      handleSelect(shapeKey);
    },
    [handleSelect],
  );

  return (
    <>
      <PresetSelector
        onClear={onClear}
        onMore={openBrowser}
        onSelect={handleSelect}
        options={options}
        selectedKey={selectedKey}
      />
      {browserOpen && (
        <ElementPanelProvider onClose={closeBrowser} onElementSelect={handleElementSelect} open>
          <ElementPanelContent drawerPlacement="right" />
        </ElementPanelProvider>
      )}
    </>
  );
};

ElementPicker.displayName = 'ElementPicker';

export default memo(ElementPicker);
