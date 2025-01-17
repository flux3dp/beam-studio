import React from 'react';
import { render } from '@testing-library/react';

import { FullWindowPanelContext } from './FullWindowPanel';

import Footer from './Footer';

jest.mock('app/widgets/FullWindowPanel/FullWindowPanel', () => ({
  FullWindowPanelContext: React.createContext({
    isDesktop: false,
    isMobile: false,
    isWindows: false,
  }),
}));

describe('test Footer', () => {
  it('should render correctly', () => {
    const { container, rerender } = render(
      <FullWindowPanelContext.Provider
        value={{
          isDesktop: false,
          isMobile: false,
          isWindows: false,
        }}
      >
        <Footer className='class'>Footer</Footer>
      </FullWindowPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    rerender(
      <FullWindowPanelContext.Provider
        value={{
          isDesktop: true,
          isMobile: true,
          isWindows: true,
        }}
      >
        <Footer className='class class2'>Footer</Footer>
      </FullWindowPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
