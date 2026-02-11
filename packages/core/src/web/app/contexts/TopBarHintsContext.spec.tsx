import React, { act, use } from 'react';

import { render } from '@testing-library/react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { TopBarHintsContext, TopBarHintsContextProvider } from './TopBarHintsContext';

const Children = () => {
  const { hintType } = use(TopBarHintsContext);

  return <>{hintType}</>;
};

test('should render correctly', () => {
  const topBarHintsEventEmitter = eventEmitterFactory.createEventEmitter('top-bar-hints');

  const { container, unmount } = render(
    <TopBarHintsContextProvider>
      <Children />
    </TopBarHintsContextProvider>,
  );

  expect(container).toHaveTextContent('');
  expect(topBarHintsEventEmitter.eventNames().length).toBe(2);

  act(() => topBarHintsEventEmitter.emit('SET_HINT', 'POLYGON'));
  expect(container).toHaveTextContent('POLYGON');

  act(() => topBarHintsEventEmitter.emit('REMOVE_HINT'));
  expect(container).toHaveTextContent('');

  unmount();
  expect(topBarHintsEventEmitter.eventNames().length).toBe(0);
});
