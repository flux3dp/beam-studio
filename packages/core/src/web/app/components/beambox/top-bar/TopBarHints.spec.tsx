import React from 'react';

import { render } from '@testing-library/react';

import { TopBarHintsContext } from '@core/app/contexts/TopBarHintsContext';

import TopBarHints from './TopBarHints';

test('should render correctly', () => {
  let { container } = render(
    <TopBarHintsContext.Provider value={{ hintType: null }}>
      <TopBarHints />
    </TopBarHintsContext.Provider>,
  );

  expect(container).toMatchSnapshot();

  ({ container } = render(
    <TopBarHintsContext.Provider value={{ hintType: 'POLYGON' }}>
      <TopBarHints />
    </TopBarHintsContext.Provider>,
  ));
  expect(container).toMatchSnapshot();

  ({ container } = render(
    <TopBarHintsContext.Provider value={{ hintType: 'CIRCLE' }}>
      <TopBarHints />
    </TopBarHintsContext.Provider>,
  ));
  expect(container).toMatchSnapshot();
});
