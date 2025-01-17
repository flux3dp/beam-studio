import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import PresetList from './PresetList';

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        preset_management: {
          preset: 'preset',
        },
      },
    },
  },
}));

describe('test PresetList', () => {
  it('should be rendered correctly', () => {
    const presets = [
      {
        name: 'preset1',
        isDefault: false,
        hide: false
      },
      {
        name: 'preset2',
        isDefault: true,
        hide: false,
        key: 'pre2'
      },
      {
        name: 'preset3',
        isDefault: false,
        hide: true
      },
      {
        name: 'preset4',
        isDefault: true,
        hide: true,
        key: 'pre4'
      }
    ];
    const displayList = presets;
    const editingValues = {};
    const selected = presets[0];
    const setSelectedPreset = jest.fn();
    const toggleHidePreset = jest.fn();
    const onReorder = jest.fn();
    const outerRef = { current: null };
    const { container, getByText } = render(
      <PresetList
        presets={presets}
        displayList={displayList}
        editingValues={editingValues}
        selected={selected}
        setSelectedPreset={setSelectedPreset}
        toggleHidePreset={toggleHidePreset}
        onReorder={onReorder}
        ref={outerRef}
      />,
      { container: document.body.appendChild(document.createElement('div')) }
    );
    expect(container).toMatchSnapshot();
    const preset1 = getByText('preset1');
    fireEvent.click(preset1);
    expect(setSelectedPreset).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelectorAll('.eye')[1]);
    expect(toggleHidePreset).toHaveBeenCalledTimes(1);
  });
});
