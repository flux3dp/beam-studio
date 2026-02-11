import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import DeviceConstants from '@core/app/constants/device-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';

import MonitorControl from './MonitorControl';

jest.mock('@core/app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const onPlay = jest.fn();
const onPause = jest.fn();
const onStop = jest.fn();

describe('test MonitorControl', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('should render correctly', () => {
    test('mode is preview', () => {
      const { container } = render(
        <MonitorContext
          value={
            {
              mode: Mode.PREVIEW,
              onPause,
              onPlay,
              onStop,
              report: { st_id: DeviceConstants.status.IDLE },
            } as any
          }
        >
          <MonitorControl
            handleFramingStop={jest.fn()}
            isFraming={false}
            isFramingTask={false}
            isOnPlaying={false}
            isPromark={false}
            setEstimateTaskTime={jest.fn()}
            setIsFramingTask={jest.fn()}
            setIsOnPlaying={jest.fn()}
            setUseEstTime={jest.fn()}
          />
        </MonitorContext>,
      );

      expect(container).toMatchSnapshot();
    });

    test('mode is working', () => {
      const { container, rerender } = render(
        <MonitorContext
          value={
            {
              mode: Mode.WORKING,
              onPause,
              onPlay,
              onStop,
              report: { st_id: DeviceConstants.status.INIT },
            } as any
          }
        >
          <MonitorControl
            handleFramingStop={jest.fn()}
            isFraming={false}
            isFramingTask={false}
            isOnPlaying={false}
            isPromark={false}
            setEstimateTaskTime={jest.fn()}
            setIsFramingTask={jest.fn()}
            setIsOnPlaying={jest.fn()}
            setUseEstTime={jest.fn()}
          />
        </MonitorContext>,
      );

      expect(container).toMatchSnapshot();

      rerender(
        <MonitorContext
          value={
            {
              mode: Mode.WORKING,
              onPause,
              onPlay,
              onStop,
              report: { st_id: DeviceConstants.status.RUNNING },
            } as any
          }
        >
          <MonitorControl
            handleFramingStop={jest.fn()}
            isFraming={false}
            isFramingTask={false}
            isOnPlaying={false}
            isPromark={false}
            setEstimateTaskTime={jest.fn()}
            setIsFramingTask={jest.fn()}
            setIsOnPlaying={jest.fn()}
            setUseEstTime={jest.fn()}
          />
        </MonitorContext>,
      );
      expect(container).toMatchSnapshot();

      rerender(
        <MonitorContext
          value={
            {
              mode: Mode.WORKING,
              onPause,
              onPlay,
              onStop,
              report: { st_id: DeviceConstants.status.PAUSED },
            } as any
          }
        >
          <MonitorControl
            handleFramingStop={jest.fn()}
            isFraming={false}
            isFramingTask={false}
            isOnPlaying={false}
            isPromark={false}
            setEstimateTaskTime={jest.fn()}
            setIsFramingTask={jest.fn()}
            setIsOnPlaying={jest.fn()}
            setUseEstTime={jest.fn()}
          />
        </MonitorContext>,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('should render correctly in mobile', () => {
    beforeEach(() => useIsMobile.mockReturnValue(true));
    test('mode is preview', () => {
      const { container } = render(
        <MonitorContext
          value={
            {
              mode: Mode.PREVIEW,
              onPause,
              onPlay,
              onStop,
              report: { st_id: DeviceConstants.status.IDLE },
            } as any
          }
        >
          <MonitorControl
            handleFramingStop={jest.fn()}
            isFraming={false}
            isFramingTask={false}
            isOnPlaying={false}
            isPromark={false}
            setEstimateTaskTime={jest.fn()}
            setIsFramingTask={jest.fn()}
            setIsOnPlaying={jest.fn()}
            setUseEstTime={jest.fn()}
          />
        </MonitorContext>,
      );

      expect(container).toMatchSnapshot();
    });

    test('mode is working', () => {
      const { container, rerender } = render(
        <MonitorContext
          value={
            {
              mode: Mode.WORKING,
              onPause,
              onPlay,
              onStop,
              report: { st_id: DeviceConstants.status.INIT },
            } as any
          }
        >
          <MonitorControl
            handleFramingStop={jest.fn()}
            isFraming={false}
            isFramingTask={false}
            isOnPlaying={false}
            isPromark={false}
            setEstimateTaskTime={jest.fn()}
            setIsFramingTask={jest.fn()}
            setIsOnPlaying={jest.fn()}
            setUseEstTime={jest.fn()}
          />
        </MonitorContext>,
      );

      expect(container).toMatchSnapshot();

      rerender(
        <MonitorContext
          value={
            {
              mode: Mode.WORKING,
              onPause,
              onPlay,
              onStop,
              report: { st_id: DeviceConstants.status.RUNNING },
            } as any
          }
        >
          <MonitorControl
            handleFramingStop={jest.fn()}
            isFraming={false}
            isFramingTask={false}
            isOnPlaying={false}
            isPromark={false}
            setEstimateTaskTime={jest.fn()}
            setIsFramingTask={jest.fn()}
            setIsOnPlaying={jest.fn()}
            setUseEstTime={jest.fn()}
          />
        </MonitorContext>,
      );
      expect(container).toMatchSnapshot();

      rerender(
        <MonitorContext
          value={
            {
              mode: Mode.WORKING,
              onPause,
              onPlay,
              onStop,
              report: { st_id: DeviceConstants.status.PAUSED },
            } as any
          }
        >
          <MonitorControl
            handleFramingStop={jest.fn()}
            isFraming={false}
            isFramingTask={false}
            isOnPlaying={false}
            isPromark={false}
            setEstimateTaskTime={jest.fn()}
            setIsFramingTask={jest.fn()}
            setIsOnPlaying={jest.fn()}
            setUseEstTime={jest.fn()}
          />
        </MonitorContext>,
      );
      expect(container).toMatchSnapshot();
    });
  });

  test('play button in preview mode', () => {
    const { getByText } = render(
      <MonitorContext
        value={
          {
            mode: Mode.PREVIEW,
            onPause,
            onPlay,
            onStop,
            report: { st_id: DeviceConstants.status.IDLE },
          } as any
        }
      >
        <MonitorControl
          handleFramingStop={jest.fn()}
          isFraming={false}
          isFramingTask={false}
          isOnPlaying={false}
          isPromark={false}
          setEstimateTaskTime={jest.fn()}
          setIsFramingTask={jest.fn()}
          setIsOnPlaying={jest.fn()}
          setUseEstTime={jest.fn()}
        />
      </MonitorContext>,
    );

    expect(onPlay).not.toHaveBeenCalled();
    fireEvent.click(getByText('Start'));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  test('pause and stop in working mode', () => {
    const { getByText } = render(
      <MonitorContext
        value={
          {
            mode: Mode.WORKING,
            onPause,
            onPlay,
            onStop,
            report: { st_id: DeviceConstants.status.RUNNING },
          } as any
        }
      >
        <MonitorControl
          handleFramingStop={jest.fn()}
          isFraming={false}
          isFramingTask={false}
          isOnPlaying={false}
          isPromark={false}
          setEstimateTaskTime={jest.fn()}
          setIsFramingTask={jest.fn()}
          setIsOnPlaying={jest.fn()}
          setUseEstTime={jest.fn()}
        />
      </MonitorContext>,
    );

    expect(onPause).not.toHaveBeenCalled();
    fireEvent.click(getByText('Pause'));
    expect(onPause).toHaveBeenCalledTimes(1);

    expect(onStop).not.toHaveBeenCalled();
    fireEvent.click(getByText('Stop'));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
