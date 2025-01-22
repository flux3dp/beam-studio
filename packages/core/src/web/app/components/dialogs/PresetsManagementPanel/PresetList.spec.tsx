import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import PresetList from './PresetList';

jest.mock('@core/helpers/useI18n', () => () => ({
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
        hide: false,
        isDefault: false,
        name: 'preset1',
      },
      {
        hide: false,
        isDefault: true,
        key: 'pre2',
        name: 'preset2',
      },
      {
        hide: true,
        isDefault: false,
        name: 'preset3',
      },
      {
        hide: true,
        isDefault: true,
        key: 'pre4',
        name: 'preset4',
      },
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
        displayList={displayList}
        editingValues={editingValues}
        onReorder={onReorder}
        presets={presets}
        ref={outerRef}
        selected={selected}
        setSelectedPreset={setSelectedPreset}
        toggleHidePreset={toggleHidePreset}
      />,
      { container: document.body.appendChild(document.createElement('div')) },
    );

    expect(container).toMatchSnapshot();

    const preset1 = getByText('preset1');

    fireEvent.click(preset1);
    expect(setSelectedPreset).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelectorAll('.eye')[1]);
    expect(toggleHidePreset).toHaveBeenCalledTimes(1);
  });
});
