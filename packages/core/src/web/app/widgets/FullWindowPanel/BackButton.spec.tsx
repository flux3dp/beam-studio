import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { FullWindowPanelContext } from './FullWindowPanel';

import BackButton from './BackButton';

jest.mock('app/widgets/FullWindowPanel/FullWindowPanel', () => ({
  FullWindowPanelContext: React.createContext({
    isDesktop: true,
    isMobile: false,
    isWindows: false,
  }),
}));

const mockOnClose = jest.fn();

describe('test BackButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container, rerender } = render(
      <FullWindowPanelContext.Provider
        value={{
          isDesktop: true,
          isMobile: true,
          isWindows: true,
        }}
      >
        <BackButton>Back</BackButton>
      </FullWindowPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    rerender(
      <FullWindowPanelContext.Provider
        value={{
          isDesktop: false,
          isMobile: false,
          isWindows: false,
        }}
      >
        <BackButton>Back</BackButton>
      </FullWindowPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should call onClose when clicked', () => {
    const { getByRole } = render(<BackButton onClose={mockOnClose}>Back</BackButton>);
    fireEvent.click(getByRole('button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
