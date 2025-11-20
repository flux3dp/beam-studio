import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';

import SelectMachineButton from './SelectMachineButton';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

const mockSetupPreviewMode = jest.fn();

jest.mock('@core/app/stores/canvas/utils/previewMode', () => ({
  setupPreviewMode: (...args) => mockSetupPreviewMode(...args),
}));

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({
    selectedDevice: null,
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
    useCanvasStore.getState().setMode(CanvasMode.Draw);
  });

  test('should render correctly', () => {
    const { container } = render(
      <CanvasContext.Provider value={{ selectedDevice: null } as any}>
        <SelectMachineButton />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockSetupPreviewMode).toHaveBeenCalledTimes(0);
  });

  test('mobile', () => {
    useIsMobile.mockReturnValue(true);

    const { container } = render(
      <CanvasContext.Provider value={{ selectedDevice: null } as any}>
        <SelectMachineButton />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockSetupPreviewMode).toHaveBeenCalledTimes(0);
  });

  test('with device', () => {
    const { container } = render(
      <CanvasContext.Provider value={{ selectedDevice: { model: 'fbm1', name: 'device name' } } as any}>
        <SelectMachineButton />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockSetupPreviewMode).toHaveBeenCalledTimes(0);
  });

  test('when previewing', () => {
    useCanvasStore.getState().setMode(CanvasMode.Preview);

    const { container } = render(
      <CanvasContext.Provider value={{ selectedDevice: null } as any}>
        <SelectMachineButton />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toHaveBeenCalledTimes(0);
    expect(mockSetupPreviewMode).toHaveBeenCalledTimes(1);
  });
});
