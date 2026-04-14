import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';

import TimeEstimationButton from './TimeEstimationButton';

const mockEstimateTime = jest.fn();

jest.mock('@core/app/actions/beambox/export-funcs', () => ({
  estimateTime: (...args) => mockEstimateTime(...args),
}));

jest.mock('@core/helpers/web-need-connection-helper', () => (fn: () => void) => fn());

jest.mock('@core/helpers/duration-formatter', () => (seconds: number) => `${seconds}s`);

describe('TimeEstimationButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with estimatedTime', () => {
    const { container } = render(
      <TimeEstimationButtonContext value={{ estimatedTime: 60, setEstimatedTime: () => {} }}>
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render calculate text when no estimatedTime', () => {
    const { container, getByText } = render(
      <TimeEstimationButtonContext value={{ estimatedTime: null, setEstimatedTime: () => {} }}>
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    expect(getByText('Estimate time')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('when WITHOUT estimatedTime, click to calculate', async () => {
    const mockSetEstimatedTime = jest.fn();
    const { getByText } = render(
      <TimeEstimationButtonContext value={{ estimatedTime: null, setEstimatedTime: mockSetEstimatedTime }}>
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    mockEstimateTime.mockResolvedValue(90);

    await act(async () => {
      fireEvent.click(getByText('Estimate time'));
    });

    expect(mockSetEstimatedTime).toHaveBeenCalledWith(90);
  });
});
