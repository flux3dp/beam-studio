import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

import TimeEstimationButton from './TimeEstimationButton';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockCheckConnection = jest.fn();

jest.mock('@core/helpers/api/discover', () => ({
  discoverManager: {
    checkConnection: (...args) => mockCheckConnection(...args),
  },
}));

const mockEstimateTime = jest.fn();

jest.mock('@core/app/actions/beambox/export-funcs', () => ({
  estimateTime: (...args) => mockEstimateTime(...args),
}));

const mockToggleUnsavedChangedDialog = jest.fn();

jest.mock('@core/helpers/file/export', () => ({
  toggleUnsavedChangedDialog: (...args) => mockToggleUnsavedChangedDialog(...args),
}));

describe('should render correctly', () => {
  beforeEach(() => {
    useCanvasStore.getState().setMode(CanvasMode.Draw);
    jest.clearAllMocks();
  });

  it('should render correctly with estimatedTime', () => {
    const { container } = render(
      <TimeEstimationButtonContext
        value={{
          estimatedTime: 60,
          setEstimatedTime: () => {},
        }}
      >
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when isPathPreviewing', () => {
    useCanvasStore.getState().setMode(CanvasMode.PathPreview);

    const { container } = render(
      <TimeEstimationButtonContext
        value={{
          estimatedTime: 60,
          setEstimatedTime: () => {},
        }}
      >
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    expect(container).toMatchSnapshot();
  });

  test('when WITHOUT estimatedTime', async () => {
    const mockSetEstimatedTime = jest.fn();
    const { container } = render(
      <TimeEstimationButtonContext
        value={{
          estimatedTime: null,
          setEstimatedTime: mockSetEstimatedTime,
        }}
      >
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    expect(container).toMatchSnapshot();

    mockEstimateTime.mockResolvedValue(90);
    await act(async () => {
      fireEvent.click(container.querySelector('div.btn'));
    });
    expect(mockSetEstimatedTime).toHaveBeenCalledTimes(1);
    expect(mockSetEstimatedTime).toHaveBeenNthCalledWith(1, 90);
  });

  test('web check connection', async () => {
    Object.defineProperty(window, 'FLUX', {
      value: {
        version: 'web',
      },
    });

    const mockSetEstimatedTime = jest.fn();
    const { container } = render(
      <TimeEstimationButtonContext
        value={{
          estimatedTime: null,
          setEstimatedTime: mockSetEstimatedTime,
        }}
      >
        <TimeEstimationButton />
      </TimeEstimationButtonContext>,
    );

    expect(container).toMatchSnapshot();

    mockCheckConnection.mockReturnValueOnce(false);
    await act(async () => {
      fireEvent.click(container.querySelector('div.btn'));
    });
    expect(mockCheckConnection).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledTimes(1);

    mockEstimateTime.mockResolvedValue(90);
    mockCheckConnection.mockReturnValueOnce(true);
    await act(async () => {
      fireEvent.click(container.querySelector('div.btn'));
    });
    expect(mockSetEstimatedTime).toHaveBeenCalledTimes(1);
    expect(mockSetEstimatedTime).toHaveBeenNthCalledWith(1, 90);
  });
});
