import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';
import SaveConfigButton from './SaveConfigButton';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockPromptDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  promptDialog: (...args) => mockPromptDialog(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        dropdown: {
          save: 'save',
        },
        existing_name: 'existing_name',
      },
    },
  },
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

const mockSelectedLayers = ['layer1'];
const mockContextState = {
  focus: { hasMultiValue: false, value: -2 },
  focusStep: { hasMultiValue: false, value: -2 },
  height: { hasMultiValue: false, value: -3 },
  minPower: { hasMultiValue: false, value: 0 },
  module: { hasMultiValue: false, value: 15 },
  power: { hasMultiValue: false, value: 77 },
  repeat: { hasMultiValue: false, value: 1 },
  speed: { hasMultiValue: false, value: 87 },
  zStep: { hasMultiValue: false, value: 0.1 },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

describe('test SaveConfigButton', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <SaveConfigButton />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('button should work when customized config is empty', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <SaveConfigButton />
      </ConfigPanelContext.Provider>,
    );

    expect(mockPromptDialog).not.toBeCalled();

    const btn = container.querySelector('.container');

    fireEvent.click(btn);
    expect(mockPromptDialog).toBeCalledTimes(1);

    const handleSaveConfig = mockPromptDialog.mock.calls[0][0].onYes;

    expect(mockGetAllPresets).not.toBeCalled();
    expect(mockSavePreset).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockDispatch).not.toBeCalled();
    mockGetAllPresets.mockReturnValueOnce([]);
    handleSaveConfig('new_config_name');
    expect(mockSavePreset).toBeCalledTimes(1);
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
    expect(mockWriteData).toBeCalledTimes(1);
    expect(mockWriteData).toHaveBeenLastCalledWith('layer1', 'configName', 'new_config_name');
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({ payload: 'new_config_name', type: 'rename' });
  });
});
