import React from 'react';

import { render } from '@testing-library/react';

import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';
import i18n from '@core/helpers/i18n';

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
  const originalTimeLeft = i18n.lang.monitor.time_left;

  afterEach(() => {
    i18n.lang.monitor.time_left = originalTimeLeft;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [Mode.WORKING, 0, 90, 'remaining 1m 30s'],
    [Mode.WORKING, 0.5, 45, 'remaining 1m 30s'],
    [Mode.WORKING, 1, 1, 'remaining 1m 30s'],
    [Mode.PREVIEW, 0.5, 90, '1m 30s'],
  ])('formats time in mode %s with progress %s', (mode, prog, expectedSeconds, expectedText) => {
    i18n.lang.monitor.time_left = 'remaining %s';
    formatDuration.mockReturnValue('1m 30s');

    const { container } = render(
      <MonitorContext
        value={
          {
            mode,
            report: { prog, st_id: 1 },
            totalTaskTime: 90,
            uploadProgress: null,
          } as React.ContextType<typeof MonitorContext>
        }
      >
        <MonitorTask device={{ name: 'device' } as React.ComponentProps<typeof MonitorTask>['device']} />
      </MonitorContext>,
    );

    expect(container.querySelector('.right-text')?.textContent?.trim()).toBe(expectedText);
    expect(formatDuration).toHaveBeenCalledWith(expectedSeconds);
  });

  it('should render correctly', () => {
    formatDuration.mockReturnValue('1m 30s');

    const { container } = render(
      <MonitorContext
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
      </MonitorContext>,
    );

    expect(container).toMatchSnapshot();
    expect(formatDuration).toHaveBeenCalledTimes(1);
    expect(formatDuration).toHaveBeenNthCalledWith(1, 90);
  });

  it('should render correctly when completed', () => {
    formatDuration.mockReturnValue('1m 30s');

    const { container } = render(
      <MonitorContext
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
      </MonitorContext>,
    );

    expect(container).toMatchSnapshot();
    expect(formatDuration).toHaveBeenCalledTimes(1);
    expect(formatDuration).toHaveBeenNthCalledWith(1, 90);
  });

  it('should render correctly for Promark', () => {
    formatDuration.mockReturnValue('1m 30s');

    const { container } = render(
      <MonitorContext
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
      </MonitorContext>,
    );

    expect(container).toMatchSnapshot();
    expect(formatDuration).toHaveBeenCalledTimes(1);
    expect(formatDuration).toHaveBeenNthCalledWith(1, 90);
  });

  it('should render correctly for Promark without task data', () => {
    const { container } = render(
      <MonitorContext
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
      </MonitorContext>,
    );

    expect(container).toMatchSnapshot();
  });
});
