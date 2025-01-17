import React from 'react';
import { render } from '@testing-library/react';

import { FullWindowPanelContext } from './FullWindowPanel';

import Sider from './Sider';

jest.mock('app/widgets/FullWindowPanel/FullWindowPanel', () => ({
  FullWindowPanelContext: React.createContext({
    isDesktop: false,
    isMobile: false,
    isWindows: false,
  }),
}));

describe('test Sider', () => {
  it('should render correctly', () => {
    const { container, rerender } = render(
      <FullWindowPanelContext.Provider
        value={{
          isDesktop: false,
          isMobile: false,
          isWindows: false,
        }}
      >
        <Sider className='class'>Sider</Sider>
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
        <Sider className='class class2'>Sider</Sider>
      </FullWindowPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
