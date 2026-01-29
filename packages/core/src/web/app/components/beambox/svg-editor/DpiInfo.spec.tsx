import React from 'react';

import { render } from '@testing-library/react';

import DpiInfo from './DpiInfo';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockUseConfigPanelStore = jest.fn();
const mockState = {
  dpi: { value: 'low' },
  module: { value: LayerModule.LASER_UNIVERSAL },
};

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test DpiInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.dpi = { value: 'low' };
    mockUseIsMobile.mockReturnValue(false);
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
    mockUseIsMobile.mockReturnValue(true);
    mockState.dpi = { value: 'ultra' };

    const { container } = render(<DpiInfo />);

    expect(container).toMatchSnapshot();
  });
});
