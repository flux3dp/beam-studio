import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import i18n from '@core/helpers/i18n';

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

import ParameterTitle from './ParameterTitle';

const mockShowPresetsManagementPanel = jest.fn();

jest.mock('@core/app/components/dialogs/PresetsManagementPanel/PresetsManagementPanel', () => ({
  showPresetsManagementPanel: (...args) => mockShowPresetsManagementPanel(...args),
}));

jest.mock('./SaveConfigButton', () => () => <div>MockSaveConfigButton</div>);

const mockUseConfigPanelStore = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test ParameterTitle', () => {
  beforeEach(() => {
    mockUseConfigPanelStore.mockReturnValue({
      configName: { value: 'pre1' },
      module: { value: 1 },
    });
  });

  it('should render correctly', () => {
    const { container } = render(<ParameterTitle />);

    expect(container).toMatchSnapshot();
  });

  it('should call showPresetsManagementPanel when button is clicked', () => {
    const { getByTitle } = render(<ParameterTitle />);

    fireEvent.click(getByTitle(i18n.lang.beambox.right_panel.laser_panel.preset_management.title));
    expect(mockShowPresetsManagementPanel).toHaveBeenCalledTimes(1);
    expect(mockShowPresetsManagementPanel).toHaveBeenCalledWith({
      currentModule: 1,
      initPreset: 'pre1',
      onClose: mockInitState,
    });
  });
});
