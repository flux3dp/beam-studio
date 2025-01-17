/* eslint-disable import/first */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';
import { TimeEstimationButtonContext } from 'app/contexts/TimeEstimationButtonContext';

import TimeEstimationButton from './TimeEstimationButton';

// for duration-formatter and connection helper
jest.mock('helpers/i18n', () => ({
  lang: {
    alert: {
      oops: 'Oops...',
    },
    device_selection: {
      no_beambox: '#801',
    },
    monitor: {
      hour: 'h',
      minute: 'm',
      second: 's',
    },
    topbar: {
      menu: {
        add_new_machine: 'Machine Setup',
      },
    },
  },
}));

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    time_est_button: {
      calculate: 'Estimate time',
      estimate_time: 'Estimated Time:',
    },
  },
}));

const mockPopUp = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockCheckConnection = jest.fn();
jest.mock('helpers/api/discover', () => ({
  checkConnection: (...args) => mockCheckConnection(...args),
}));

const mockEstimateTime = jest.fn();
jest.mock('app/actions/beambox/export-funcs', () => ({
  estimateTime: (...args) => mockEstimateTime(...args),
}));

const mockToggleUnsavedChangedDialog = jest.fn();
jest.mock('helpers/file-export-helper', () => ({
  toggleUnsavedChangedDialog: (...args) => mockToggleUnsavedChangedDialog(...args),
}));

jest.mock('app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ mode: CanvasMode.Draw }),
}));

describe('should render correctly', () => {
  it('should render correctly with estimatedTime', () => {
    Object.defineProperty(window, 'os', {
      value: 'MacOS',
    });
    const { container } = render(
      <TimeEstimationButtonContext.Provider
        value={{
          setEstimatedTime: () => {},
          estimatedTime: 60,
        }}
      >
        <TimeEstimationButton />
      </TimeEstimationButtonContext.Provider>
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when isPathPreviewing', () => {
    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.PathPreview,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
      >
        <TimeEstimationButtonContext.Provider
          value={{
            setEstimatedTime: () => {},
            estimatedTime: 60,
          }}
        >
          <TimeEstimationButton />
        </TimeEstimationButtonContext.Provider>
      </CanvasContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('when WITHOUT estimatedTime', async () => {
    Object.defineProperty(window, 'os', {
      value: 'Windows',
    });
    const mockSetEstimatedTime = jest.fn();
    const { container } = render(
      <TimeEstimationButtonContext.Provider
        value={{
          setEstimatedTime: mockSetEstimatedTime,
          estimatedTime: null,
        }}
      >
        <TimeEstimationButton />
      </TimeEstimationButtonContext.Provider>
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
    Object.defineProperty(window, 'os', {
      value: 'MacOS',
    });
    Object.defineProperty(window, 'FLUX', {
      value: {
        version: 'web',
      },
    });
    const mockSetEstimatedTime = jest.fn();
    const { container } = render(
      <TimeEstimationButtonContext.Provider
        value={{
          setEstimatedTime: mockSetEstimatedTime,
          estimatedTime: null,
        }}
      >
        <TimeEstimationButton />
      </TimeEstimationButtonContext.Provider>
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
