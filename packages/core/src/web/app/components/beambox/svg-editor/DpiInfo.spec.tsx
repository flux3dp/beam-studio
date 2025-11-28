import React from 'react';

import { render } from '@testing-library/react';

import DpiInfo from './DpiInfo';

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockUseDocumentStore = jest.fn();
const mockState = {
  engrave_dpi: 'low',
};

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: (...args) => mockUseDocumentStore(...args),
}));

describe('test DpiInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.engrave_dpi = 'low';
    mockUseIsMobile.mockReturnValue(false);
    mockUseDocumentStore.mockImplementation((selector) => {
      return selector(mockState);
    });
  });

  it('should render correctly', async () => {
    const { container, rerender } = render(<DpiInfo />);

    expect(container).toMatchSnapshot();

    mockState.engrave_dpi = 'high';
    rerender(<DpiInfo />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);
    mockState.engrave_dpi = 'ultra';

    const { container } = render(<DpiInfo />);

    expect(container).toMatchSnapshot();
  });
});
