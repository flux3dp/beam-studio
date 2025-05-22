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
    destroy: jest.fn(),
    on: jest.fn(),
    startFraming: jest.fn(),
    stopFraming: jest.fn(),
  })),
  framingOptions: {
    Framing: {
      description: 'framing_desc',
      title: 'framing',
    },
  },
  FramingType: {
    Framing: 'Framing',
  },
  getFramingOptions: () => ['Framing'],
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
            totalTaskTime: 90,
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
    formatDuration.mockReturnValue('1m 30s');

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
            totalTaskTime: 90,
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

  it('should render correctly for Promark', () => {
    formatDuration.mockReturnValue('1m 30s');

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
            totalTaskTime: 90,
            uploadProgress: null,
          } as any
        }
      >
        <MonitorTask device={{ model: 'fpm1', name: 'device' } as any} />
      </MonitorContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(formatDuration).toHaveBeenCalledTimes(1);
    expect(formatDuration).toHaveBeenNthCalledWith(1, 90);
  });

  it('should render correctly for Promark without task data', () => {
    const { container } = render(
      <MonitorContext.Provider
        value={
          {
            mode: Mode.WORKING,
            report: {
              prog: 0,
              st_id: 64,
            },
            totalTaskTime: 0,
            uploadProgress: null,
          } as any
        }
      >
        <MonitorTask device={{ model: 'fpm1', name: 'device' } as any} />
      </MonitorContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });
});
