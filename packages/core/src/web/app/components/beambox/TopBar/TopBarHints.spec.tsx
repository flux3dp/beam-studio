import React from 'react';

import { render } from '@testing-library/react';

import { TopBarHintsContext } from '@core/app/contexts/TopBarHintsContext';

import TopBarHints from './TopBarHints';

test('should render correctly', () => {
  let { container } = render(
    <TopBarHintsContext value={{ hintType: null }}>
      <TopBarHints />
    </TopBarHintsContext>,
  );

  expect(container).toMatchSnapshot();

  ({ container } = render(
    <TopBarHintsContext value={{ hintType: 'POLYGON' }}>
      <TopBarHints />
    </TopBarHintsContext>,
  ));
  expect(container).toMatchSnapshot();

  ({ container } = render(
    <TopBarHintsContext value={{ hintType: 'CIRCLE' }}>
      <TopBarHints />
    </TopBarHintsContext>,
  ));
  expect(container).toMatchSnapshot();
});
