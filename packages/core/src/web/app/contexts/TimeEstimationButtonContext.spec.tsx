import React, { act, use } from 'react';

import { render } from '@testing-library/react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { TimeEstimationButtonContext, TimeEstimationButtonContextProvider } from './TimeEstimationButtonContext';

const Children = () => {
  const { estimatedTime } = use(TimeEstimationButtonContext);

  return <>{estimatedTime}</>;
};

test('should render correctly', () => {
  const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');
  const { container, unmount } = render(
    <TimeEstimationButtonContextProvider>
      <Children />
    </TimeEstimationButtonContextProvider>,
  );

  expect(container).toHaveTextContent('');
  expect(timeEstimationButtonEventEmitter.eventNames().length).toBe(1);

  act(() => timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', 123));
  expect(container).toHaveTextContent('123');

  // Emitting the same value should not cause a state update (dedup optimization)
  act(() => timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', 123));
  expect(container).toHaveTextContent('123');

  unmount();
  expect(timeEstimationButtonEventEmitter.eventNames().length).toBe(0);
});
