import React from 'react';

import { render } from '@testing-library/react';

import Footer from './Footer';
import { FullWindowPanelContext } from './FullWindowPanel';

jest.mock('@core/app/widgets/FullWindowPanel/FullWindowPanel', () => ({
  FullWindowPanelContext: React.createContext({
    isDesktop: false,
    isMobile: false,
    isWindows: false,
  }),
}));

describe('test Footer', () => {
  it('should render correctly', () => {
    const { container, rerender } = render(
      <FullWindowPanelContext
        value={{
          isDesktop: false,
          isMobile: false,
          isWindows: false,
        }}
      >
        <Footer className="class">Footer</Footer>
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
        <Footer className="class class2">Footer</Footer>
      </FullWindowPanelContext>,
    );
    expect(container).toMatchSnapshot();
  });
});
