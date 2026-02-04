import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import useLayerStore from '@core/app/stores/layer/layerStore';

import SaveConfigButton from './SaveConfigButton';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockPromptDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  promptDialog: (...args) => mockPromptDialog(...args),
}));

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getConfigKeys: () => ['speed', 'power', 'minPower', 'repeat', 'height', 'zStep', 'focus', 'focusStep'],
  writeData: (...args) => mockWriteData(...args),
}));

const mockGetAllPresets = jest.fn();
const mockSavePreset = jest.fn();

jest.mock('@core/helpers/presets/preset-helper', () => ({
  getAllPresets: (...args) => mockGetAllPresets(...args),
  savePreset: (...args) => mockSavePreset(...args),
}));

const mockGetState = jest.fn();
const mockRename = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: () => ({
    getState: () => mockGetState(),
    rename: (...args) => mockRename(...args),
  }),
}));

describe('test SaveConfigButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayerStore.setState({ selectedLayers: ['layer1'] });
    mockGetState.mockReturnValue({
      focus: { hasMultiValue: false, value: -2 },
      focusStep: { hasMultiValue: false, value: -2 },
      height: { hasMultiValue: false, value: -3 },
      minPower: { hasMultiValue: false, value: 0 },
      module: { hasMultiValue: false, value: 15 },
      power: { hasMultiValue: false, value: 77 },
      repeat: { hasMultiValue: false, value: 1 },
      speed: { hasMultiValue: false, value: 87 },
      zStep: { hasMultiValue: false, value: 0.1 },
    });
  });

  it('should render correctly', () => {
    const { container } = render(<SaveConfigButton />);

    expect(container).toMatchSnapshot();
  });

  test('button should work when customized config is empty', () => {
    const { container } = render(<SaveConfigButton />);

    expect(mockPromptDialog).not.toHaveBeenCalled();

    const btn = container.querySelector('.container');

    fireEvent.click(btn);
    expect(mockPromptDialog).toHaveBeenCalledTimes(1);

    const handleSaveConfig = mockPromptDialog.mock.calls[0][0].onYes;

    expect(mockGetAllPresets).not.toHaveBeenCalled();
    expect(mockSavePreset).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    mockGetAllPresets.mockReturnValueOnce([]);
    handleSaveConfig('new_config_name');
    expect(mockSavePreset).toHaveBeenCalledTimes(1);
    expect(mockSavePreset).toHaveBeenLastCalledWith({
      focus: -2,
      focusStep: -2,
      height: -3,
      minPower: 0,
      name: 'new_config_name',
      power: 77,
      repeat: 1,
      speed: 87,
      zStep: 0.1,
    });
    expect(mockWriteData).toHaveBeenCalledTimes(1);
    expect(mockWriteData).toHaveBeenLastCalledWith('layer1', 'configName', 'new_config_name');
    expect(mockRename).toHaveBeenCalledTimes(1);
    expect(mockRename).toHaveBeenLastCalledWith('new_config_name');
  });
});
