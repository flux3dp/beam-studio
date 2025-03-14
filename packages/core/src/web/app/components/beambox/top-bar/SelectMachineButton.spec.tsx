import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';

import SelectMachineButton from './SelectMachineButton';

jest.mock('@core/helpers/useI18n', () => () => ({
  topbar: {
    select_machine: 'Select a machine',
  },
}));

const mockSetupPreviewMode = jest.fn();

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({
    mode: CanvasMode.Draw,
    selectedDevice: null,
    setupPreviewMode: (...args) => mockSetupPreviewMode(...args),
  }),
}));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const mockGetDevice = jest.fn();

jest.mock(
  '@core/helpers/device/get-device',
  () =>
    (...args) =>
      mockGetDevice(...args),
);

describe('test SelectMachineButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobile.mockReturnValue(false);
  });

  test('should render correctly', () => {
    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.Draw,
            selectedDevice: null,
            setupPreviewMode: mockSetupPreviewMode,
          } as any
        }
      >
        <SelectMachineButton />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toBeCalledTimes(1);
    expect(mockSetupPreviewMode).toBeCalledTimes(0);
  });

  test('mobile', () => {
    useIsMobile.mockReturnValue(true);

    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.Draw,
            selectedDevice: null,
            setupPreviewMode: mockSetupPreviewMode,
          } as any
        }
      >
        <SelectMachineButton />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toBeCalledTimes(1);
    expect(mockSetupPreviewMode).toBeCalledTimes(0);
  });

  test('with device', () => {
    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.Draw,
            selectedDevice: { model: 'fbm1', name: 'device name' },
            setupPreviewMode: mockSetupPreviewMode,
          } as any
        }
      >
        <SelectMachineButton />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toBeCalledTimes(1);
    expect(mockSetupPreviewMode).toBeCalledTimes(0);
  });

  test('when previewing', () => {
    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.Preview,
            selectedDevice: null,
            setupPreviewMode: mockSetupPreviewMode,
          } as any
        }
      >
        <SelectMachineButton />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toBeCalledTimes(0);
    expect(mockSetupPreviewMode).toBeCalledTimes(1);
  });
});
