import React from 'react';

import { render } from '@testing-library/react';

import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';

import MonitorTask from './MonitorTask';

jest.mock('@core/app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

const formatDuration = jest.fn();

jest.mock('@core/helpers/duration-formatter', () => (sec: number) => formatDuration(sec));

jest.mock('./MonitorControl', () => () => <div>Dummy MonitorControl</div>);

jest.mock('@core/helpers/device/framing', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    startFraming: jest.fn(),
    stopFraming: jest.fn(),
  })),
  FramingType: {
    Framing: 'Framing',
  },
}));

// Mock MessageCaller
jest.mock('@core/app/actions/message-caller', () => ({
  closeMessage: jest.fn(),
  openMessage: jest.fn(),
}));

// Mock useI18n
jest.mock('@core/helpers/useI18n', () => () => ({
  framing: {
    framing: 'Framing',
  },
  monitor: {
    left: 'left',
    task: {
      BEAMBOX: 'BEAMBOX',
    },
  },
}));

describe('should render correctly', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    formatDuration.mockReturnValue('1m 30s');

    const { container } = render(
      <MonitorContext.Provider
        value={
          {
            fileInfo: ['filename'],
            mode: Mode.PREVIEW,
            report: {
              prog: 123,
              st_id: 1,
            },
            taskImageURL: 'img/flux.svg',
            taskTime: 90,
            uploadProgress: null,
          } as any
        }
      >
        <MonitorTask device={{ name: 'device' } as any} />
      </MonitorContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(formatDuration).toHaveBeenCalledTimes(1);
    expect(formatDuration).toHaveBeenNthCalledWith(1, 90);
  });

  it('should render correctly when completed', () => {
    const { container } = render(
      <MonitorContext.Provider
        value={
          {
            fileInfo: ['filename'],
            mode: Mode.WORKING,
            report: {
              prog: 0,
              st_id: 64,
            },
            taskImageURL: 'img/flux.svg',
            taskTime: 0,
            uploadProgress: null,
          } as any
        }
      >
        <MonitorTask device={{ name: 'device' } as any} />
      </MonitorContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });
});
