import React, { createContext } from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';
import ParameterTitle from './ParameterTitle';

const mockInitState = jest.fn();
const mockState = {
  module: { value: 1 },
  configName: { value: 'pre1' },
};

const mockShowPresetsManagementPanel = jest.fn();
jest.mock('app/components/dialogs/PresetsManagementPanel/PresetsManagementPanel', () => ({
  showPresetsManagementPanel: (...args) => mockShowPresetsManagementPanel(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        parameters: 'parameters',
        preset_management: {
          title: 'preset_management_title',
        },
      },
    },
  },
}));

jest.mock('./SaveConfigButton', () => () => <div>MockSaveConfigButton</div>);

jest.mock('./ConfigPanelContext', () => createContext({}));

describe('test ParameterTitle', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider value={{ initState: mockInitState, state: mockState } as any}>
        <ParameterTitle />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should call showPresetsManagementPanel when button is clicked', () => {
    const { getByTitle } = render(
      <ConfigPanelContext.Provider value={{ initState: mockInitState, state: mockState } as any}>
        <ParameterTitle />
      </ConfigPanelContext.Provider>
    );
    fireEvent.click(getByTitle('preset_management_title'));
    expect(mockShowPresetsManagementPanel).toHaveBeenCalledTimes(1);
    expect(mockShowPresetsManagementPanel).toHaveBeenCalledWith({
      currentModule: 1,
      initPreset: 'pre1',
      onClose: mockInitState,
    });
  });
});
