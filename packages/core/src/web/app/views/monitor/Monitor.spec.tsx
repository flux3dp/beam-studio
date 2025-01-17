import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { Mode } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/MonitorContext';

import Monitor from './Monitor';

jest.mock('app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));
jest.mock('./MonitorCamera', () => ({ device }: any) => (
  <div>Dummy MonitorCamera {device.name}</div>
));
jest.mock('./MonitorFilelist', () => ({ path }: any) => <div>Dummy MonitorFilelist {path}</div>);
jest.mock('./MonitorTabExtraContent', () => () => <div>Dummy MonitorTabExtraContent</div>);
jest.mock('./MonitorTask', () => () => <div>Dummy MonitorTask</div>);

jest.mock('helpers/useI18n', () => () => ({
  topmenu: { file: { label: 'label' } },
  monitor: {
    camera: 'camera',
    taskTab: 'taskTab',
    connecting: 'connecting',
  },
  beambox: {
    popup: {
      progress: {
        uploading: 'uploading',
      },
    },
  },
}));

const mockGetDisplayStatus = jest.fn();
jest.mock('helpers/monitor-status', () => ({
  getDisplayStatus: (...args) => mockGetDisplayStatus(...args),
}));

const mockOnClose = jest.fn();
const mockSetMonitorMode = jest.fn();
const mockContext = {
  currentPath: ['SD', 'test'],
  mode: Mode.FILE,
  onClose: mockOnClose,
  setMonitorMode: mockSetMonitorMode,
  report: { st_label: 1 },
  taskImageURL: 'taskImageURL',
};

const mockIsNorthAmerica = jest.fn();
jest.mock('helpers/locale-helper', () => ({
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
      <MonitorContext.Provider value={mockContext as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext.Provider>
    );
    expect(baseElement).toMatchSnapshot();
    expect(mockGetDisplayStatus).toBeCalledTimes(1);
    expect(mockGetDisplayStatus).toHaveBeenLastCalledWith(mockContext.report.st_label);
  });

  it('should render correctly when isNorthAmerica', () => {
    mockIsNorthAmerica.mockReturnValue(true);
    const { baseElement } = render(
      <MonitorContext.Provider value={mockContext as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext.Provider>
    );
    expect(baseElement).toMatchSnapshot();
    expect(mockGetDisplayStatus).toBeCalledTimes(1);
    expect(mockGetDisplayStatus).toHaveBeenLastCalledWith(mockContext.report.st_label);
  });

  it('should display uploading when has upload progress', () => {
    const { baseElement } = render(
      <MonitorContext.Provider value={{ ...mockContext, uploadProgress: 50 } as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext.Provider>
    );
    expect(baseElement).toMatchSnapshot();
    expect(mockGetDisplayStatus).not.toBeCalled();
  });

  test('should call onClose when click close button', () => {
    const { baseElement } = render(
      <MonitorContext.Provider value={mockContext as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext.Provider>
    );
    fireEvent.click(baseElement.querySelector('.ant-modal-close'));
    expect(mockOnClose).toBeCalledTimes(1);
  });

  test('should call setMonitorMode when click tab', () => {
    const { getByText, rerender } = render(
      <MonitorContext.Provider value={mockContext as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext.Provider>
    );
    fireEvent.click(getByText('camera'));
    expect(mockSetMonitorMode).toBeCalledTimes(1);
    expect(mockSetMonitorMode).toHaveBeenLastCalledWith(Mode.CAMERA);
    rerender(
      <MonitorContext.Provider value={{ ...mockContext, mode: Mode.CAMERA } as any}>
        <Monitor device={{ name: 'device' } as any} />
      </MonitorContext.Provider>
    );
    fireEvent.click(getByText('label'));
    expect(mockSetMonitorMode).toBeCalledTimes(2);
    expect(mockSetMonitorMode).toHaveBeenLastCalledWith(Mode.FILE);
  });
});
