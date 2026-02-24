import React from 'react';

import { render } from '@testing-library/react';

import { FullWindowPanelContext } from './FullWindowPanel';
import Header from './Header';

jest.mock('@core/app/widgets/FullWindowPanel/FullWindowPanel', () => ({
  FullWindowPanelContext: React.createContext({
    isDesktop: false,
    isMobile: false,
    isWindows: false,
  }),
}));

describe('test Header', () => {
  it('should render correctly', () => {
    const { container, rerender } = render(
      <FullWindowPanelContext
        value={{
          isDesktop: false,
          isMobile: false,
          isWindows: false,
        }}
      >
        <Header className="class">Header</Header>
      </FullWindowPanelContext>,
    );

    expect(container).toMatchSnapshot();
    rerender(
      <FullWindowPanelContext
        value={{
          isDesktop: true,
          isMobile: true,
          isWindows: true,
        }}
      >
        <Header className="class class2">Header</Header>
      </FullWindowPanelContext>,
    );
    expect(container).toMatchSnapshot();
  });
});
