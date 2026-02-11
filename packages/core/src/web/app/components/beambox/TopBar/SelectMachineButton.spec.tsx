import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';

import SelectMachineButton from './SelectMachineButton';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

const mockGetIsPreviewMode = jest.fn();
const mockEndPreviewMode = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-controller', () => ({
  end: () => mockEndPreviewMode(),
  get isPreviewMode() {
    return mockGetIsPreviewMode();
  },
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
    mockGetIsPreviewMode.mockReturnValue(false);
    mockGetDevice.mockResolvedValue({
      device: {
        uuid: '1234',
      },
    });
  });

  test('should render correctly', () => {
    const { container } = render(
      <CanvasContext value={{ selectedDevice: null } as any}>
        <SelectMachineButton />
      </CanvasContext>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockEndPreviewMode).toHaveBeenCalledTimes(0);
  });

  test('mobile', () => {
    useIsMobile.mockReturnValue(true);

    const { container } = render(
      <CanvasContext value={{ selectedDevice: null } as any}>
        <SelectMachineButton />
      </CanvasContext>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockEndPreviewMode).toHaveBeenCalledTimes(0);
  });

  test('with device', () => {
    const { container } = render(
      <CanvasContext value={{ selectedDevice: { model: 'fbm1', name: 'device name' } } as any}>
        <SelectMachineButton />
      </CanvasContext>,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockEndPreviewMode).toHaveBeenCalledTimes(0);
  });

  test('when is preview mode', async () => {
    mockGetIsPreviewMode.mockReturnValue(true);

    const { container } = render(
      <CanvasContext value={{ selectedDevice: null } as any}>
        <SelectMachineButton />
      </CanvasContext>,
    );

    expect(container).toMatchSnapshot();
    await act(() => fireEvent.click(container.querySelector('div[class*="button"]')));
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockEndPreviewMode).toHaveBeenCalledTimes(1);
  });
});
