import React from 'react';

import { render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useScreenStore } from '@core/app/stores/screenStore';

const mockUseConfigPanelStore = jest.fn();
const mockState = {
  dpi: { value: 'low' },
  module: { value: LayerModule.LASER_UNIVERSAL },
};

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

import DpiInfo from './DpiInfo';

describe('test DpiInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.dpi = { value: 'low' };
    useScreenStore.setState({ isMobile: false });
    mockUseConfigPanelStore.mockImplementation((selector) => {
      return selector(mockState);
    });
  });

  it('should render correctly', async () => {
    const { container, rerender } = render(<DpiInfo />);

    expect(container).toMatchSnapshot();

    mockState.dpi = { value: 'high' };
    rerender(<DpiInfo />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly in mobile', () => {
    useScreenStore.setState({ isMobile: true });
    mockState.dpi = { value: 'ultra' };

    const { container } = render(<DpiInfo />);

    expect(container).toMatchSnapshot();
  });
});
