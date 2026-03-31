import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';

import TimeEstimationButton from './TimeEstimationButton';

const mockEstimateTime = jest.fn();

jest.mock('@core/app/actions/beambox/export-funcs', () => ({
  estimateTime: (...args) => mockEstimateTime(...args),
}));

jest.mock('@core/helpers/web-need-connection-helper', () => (fn: () => void) => fn());

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    time_est_button: {
      calculate: 'Calculate',
      estimate_time: 'Estimated Time:',
    },
  },
}));

jest.mock('@core/helpers/duration-formatter', () => (seconds: number) => `${seconds}s`);

describe('TimeEstimationButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080, writable: true });
    window.dispatchEvent(new Event('resize'));
  });

  it('should render correctly with estimatedTime', () => {
    const { container } = render(
      <TimeEstimationButtonContext value={{ estimatedTime: 60, setEstimatedTime: () => {} }}>
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should return null (hide) when in target screen size', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024, writable: true });
    window.dispatchEvent(new Event('resize'));

    const { container } = render(
      <TimeEstimationButtonContext value={{ estimatedTime: null, setEstimatedTime: () => {} }}>
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    expect(container.firstChild).toBeNull();
  });

  test('when WITHOUT estimatedTime, click to calculate', async () => {
    const mockSetEstimatedTime = jest.fn();
    const { container } = render(
      <TimeEstimationButtonContext value={{ estimatedTime: null, setEstimatedTime: mockSetEstimatedTime }}>
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    mockEstimateTime.mockResolvedValue(90);

    const btn = container.querySelector('div.btn');

    if (btn) {
      await act(async () => {
        fireEvent.click(btn);
      });
      expect(mockSetEstimatedTime).toHaveBeenCalledWith(90);
    }
  });
});
