import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';

import Monitor from './Monitor';

jest.mock('@core/app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));
jest.mock('./MonitorCamera', () => ({ device }: any) => <div>Dummy MonitorCamera {device.name}</div>);
jest.mock('./MonitorFilelist', () => ({ path }: any) => <div>Dummy MonitorFilelist {path}</div>);
jest.mock('./MonitorTabExtraContent', () => () => <div>Dummy MonitorTabExtraContent</div>);
jest.mock('./MonitorTask', () => () => <div>Dummy MonitorTask</div>);

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    popup: {
      progress: {
        uploading: 'uploading',
      },
    },
  },
  monitor: {
    camera: 'camera',
    connecting: 'connecting',
    taskTab: 'taskTab',
  },
  topmenu: { file: { label: 'label' } },
}));

const mockGetDisplayStatus = jest.fn();

jest.mock('@core/helpers/monitor-status', () => ({
  getDisplayStatus: (...args) => mockGetDisplayStatus(...args),
}));

const mockOnClose = jest.fn();
const mockSetMonitorMode = jest.fn();
const mockContext = {
  currentPath: ['SD', 'test'],
  mode: Mode.FILE,
  onClose: mockOnClose,
  report: { st_label: 1 },
  setMonitorMode: mockSetMonitorMode,
  taskImageURL: 'taskImageURL',
};

const mockIsNorthAmerica = jest.fn();

jest.mock('@core/helpers/locale-helper', () => ({
  get isNorthAmerica() {
    return mockIsNorthAmerica();
  },
}));

describe('test Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsNorthAmerica.mockReturnValue(false);
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <MonitorContext value={mockContext as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext>,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockGetDisplayStatus).toHaveBeenCalledTimes(1);
    expect(mockGetDisplayStatus).toHaveBeenLastCalledWith(mockContext.report.st_label);
  });

  it('should render correctly when isNorthAmerica', () => {
    mockIsNorthAmerica.mockReturnValue(true);

    const { baseElement } = render(
      <MonitorContext value={mockContext as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext>,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockGetDisplayStatus).toHaveBeenCalledTimes(1);
    expect(mockGetDisplayStatus).toHaveBeenLastCalledWith(mockContext.report.st_label);
  });

  it('should display uploading when has upload progress', () => {
    const { baseElement } = render(
      <MonitorContext value={{ ...mockContext, uploadProgress: 50 } as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext>,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockGetDisplayStatus).not.toHaveBeenCalled();
  });

  test('should call onClose when click close button', () => {
    const { baseElement } = render(
      <MonitorContext value={mockContext as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext>,
    );

    fireEvent.click(baseElement.querySelector('.ant-modal-close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('should call setMonitorMode when click tab', () => {
    const { getByText, rerender } = render(
      <MonitorContext value={mockContext as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext>,
    );

    fireEvent.click(getByText('camera'));
    expect(mockSetMonitorMode).toHaveBeenCalledTimes(1);
    expect(mockSetMonitorMode).toHaveBeenLastCalledWith(Mode.CAMERA);
    rerender(
      <MonitorContext value={{ ...mockContext, mode: Mode.CAMERA } as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext>,
    );
    fireEvent.click(getByText('label'));
    expect(mockSetMonitorMode).toHaveBeenCalledTimes(2);
    expect(mockSetMonitorMode).toHaveBeenLastCalledWith(Mode.FILE);
  });
});
