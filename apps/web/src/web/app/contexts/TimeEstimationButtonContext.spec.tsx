import React, { useContext } from 'react';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';

import eventEmitterFactory from 'helpers/eventEmitterFactory';

import {
  TimeEstimationButtonContext,
  TimeEstimationButtonContextProvider,
} from './TimeEstimationButtonContext';

const Children = () => {
  const { estimatedTime } = useContext(TimeEstimationButtonContext);
  return <>{estimatedTime}</>;
};

test('should render correctly', () => {
  const setStateSpy = jest.spyOn(TimeEstimationButtonContextProvider.prototype, 'setState');
  const timeEstimationButtonEventEmitter =
    eventEmitterFactory.createEventEmitter('time-estimation-button');
  const { container, unmount } = render(
    <TimeEstimationButtonContextProvider>
      <Children />
    </TimeEstimationButtonContextProvider>
  );

  expect(container).toHaveTextContent('');
  expect(timeEstimationButtonEventEmitter.eventNames().length).toBe(1);

  act(() => timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', 123));
  expect(setStateSpy).toHaveBeenCalledTimes(1);
  expect(container).toHaveTextContent('123');

  act(() => timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', 123));
  expect(setStateSpy).toHaveBeenCalledTimes(1);

  unmount();
  expect(timeEstimationButtonEventEmitter.eventNames().length).toBe(0);
});
