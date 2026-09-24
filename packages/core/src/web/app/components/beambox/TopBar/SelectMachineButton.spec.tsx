import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useScreenStore } from '@core/app/stores/screenStore';

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

const mockGetMouseMode = jest.fn();
const mockSetMouseMode = jest.fn();

jest.mock('@core/app/stores/canvas/utils/mouseMode', () => ({
  getMouseMode: () => mockGetMouseMode(),
  setMouseMode: (mode: string) => mockSetMouseMode(mode),
}));

const mockDeviceList = jest.fn();

jest.mock('@core/helpers/hooks/useDeviceList', () => ({
  useDeviceList: () => mockDeviceList(),
}));

const mockCurrentDevice = jest.fn();

// The real module reaches a worker that jest cannot parse, and only currentDevice is read here.
jest.mock('@core/helpers/device-master', () => ({
  get currentDevice() {
    return mockCurrentDevice();
  },
}));

const mockHexa2GalvoDev = jest.fn();

// The indicator is HEXA II development scaffolding; on for these cases except where stated.
jest.mock('@core/helpers/checkFeature', () => ({
  checkHexa2GalvoDev: () => mockHexa2GalvoDev(),
}));

const mockGetDevice = jest.fn();

jest.mock(
  '@core/helpers/device/get-device',
  () =>
    (...args) =>
      mockGetDevice(...args),
);

import SelectMachineButton from './SelectMachineButton';

describe('test SelectMachineButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScreenStore.setState({ isMobile: false });
    useCanvasStore.getState().setMode(CanvasMode.Draw);
    mockGetIsPreviewMode.mockReturnValue(false);
    mockHexa2GalvoDev.mockReturnValue(true);
    mockDeviceList.mockReturnValue([{ uuid: '1234' }]);
    mockCurrentDevice.mockReturnValue({ control: { isConnected: true }, info: { uuid: '1234' } });
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
    useScreenStore.setState({ isMobile: true });

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
    const { container, queryByTestId } = render(
      <CanvasContext value={{ selectedDevice: { model: 'fbm1', name: 'device name', uuid: '1234' } } as any}>
        <SelectMachineButton />
      </CanvasContext>,
    );

    expect(container).toMatchSnapshot();
    expect(queryByTestId('disconnected')).not.toBeInTheDocument();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockEndPreviewMode).toHaveBeenCalledTimes(0);
  });

  // The selected device survives a reload, so it can name a machine this session never reached.
  describe('disconnected indicator', () => {
    const device = { model: 'fbm1', name: 'device name', uuid: '1234' };
    const renderWith = () =>
      render(
        <CanvasContext value={{ selectedDevice: device } as any}>
          <SelectMachineButton />
        </CanvasContext>,
      );

    test('shows when discovery no longer sees the machine', () => {
      mockDeviceList.mockReturnValue([]);

      expect(renderWith().queryByTestId('disconnected')).toBeInTheDocument();
    });

    test('shows when the open socket belongs to another machine', () => {
      mockCurrentDevice.mockReturnValue({ control: { isConnected: true }, info: { uuid: 'other' } });

      expect(renderWith().queryByTestId('disconnected')).toBeInTheDocument();
    });

    test('shows when the socket dropped', () => {
      mockCurrentDevice.mockReturnValue({ control: { isConnected: false }, info: { uuid: '1234' } });

      expect(renderWith().queryByTestId('disconnected')).toBeInTheDocument();
    });

    // The click renders once before the selection has connected; without a re-read after the
    // await it would sit on that first answer for good.
    test('re-reads once the selection finishes connecting', async () => {
      mockCurrentDevice.mockReturnValue(undefined);

      const { container, queryByTestId } = renderWith();

      expect(queryByTestId('disconnected')).toBeInTheDocument();
      mockCurrentDevice.mockReturnValue({ control: { isConnected: true }, info: { uuid: '1234' } });
      await act(() => fireEvent.click(container.querySelector('div[class*="button"]')));
      expect(queryByTestId('disconnected')).not.toBeInTheDocument();
    });

    // It is scaffolding for one machine being brought up; an unrelated session should not see it.
    test('stays hidden when the HEXA II dev flag is off, however disconnected things look', () => {
      mockHexa2GalvoDev.mockReturnValue(false);
      mockDeviceList.mockReturnValue([]);
      mockCurrentDevice.mockReturnValue(undefined);

      expect(renderWith().queryByTestId('disconnected')).not.toBeInTheDocument();
    });

    test('stays hidden when no machine is selected', () => {
      mockDeviceList.mockReturnValue([]);
      mockCurrentDevice.mockReturnValue(undefined);

      const { queryByTestId } = render(
        <CanvasContext value={{ selectedDevice: null } as any}>
          <SelectMachineButton />
        </CanvasContext>,
      );

      expect(queryByTestId('disconnected')).not.toBeInTheDocument();
    });
  });

  test('when in pre preview mode', async () => {
    mockGetMouseMode.mockReturnValue('pre_preview');

    const { container } = render(
      <CanvasContext value={{ selectedDevice: null } as any}>
        <SelectMachineButton />
      </CanvasContext>,
    );

    await act(() => fireEvent.click(container.querySelector('div[class*="button"]')));
    expect(mockEndPreviewMode).toHaveBeenCalledTimes(0);
    expect(mockSetMouseMode).toHaveBeenCalledWith('select');
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
