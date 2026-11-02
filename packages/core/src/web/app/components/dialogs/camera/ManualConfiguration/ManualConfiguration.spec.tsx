import React from 'react';

import { act, render } from '@testing-library/react';

const mockFetchPncOffset = jest.fn();

jest.mock('../../PrintAndCut/calibration/offsetStore', () => ({
  fetchPncOffset: (...args: any[]) => mockFetchPncOffset(...args),
}));
jest.mock('@core/app/widgets/DraggableModal', () => ({ children, title }: any) => (
  <div>
    {title}
    {children}
  </div>
));
jest.mock('./CameraTab', () => () => <div>mock-camera-tab</div>);
jest.mock('./ModulesTab', () => () => <div>mock-modules-tab</div>);
jest.mock('./PrintAndCutTab', () => () => <div>mock-pnc-tab</div>);

import type { IDeviceInfo } from '@core/interfaces/IDevice';

import ManualConfiguration from './ManualConfiguration';
import { useManualConfigStore } from './store';
import { getManualConfigurationTabs } from './tabs';

const device = (serial: string, model = 'fbm2') => ({ model, name: serial, serial }) as IDeviceInfo;

describe('getManualConfigurationTabs (PRD §5)', () => {
  test.each([
    ['fbm2', { camera: true, modules: true, printAndCut: true }],
    ['fbb2', { camera: true, modules: false, printAndCut: true }],
    ['fhx2rf', { camera: true, modules: false, printAndCut: true }],
    ['ado1', { camera: true, modules: true, printAndCut: true }],
    ['fpm1', { camera: true, modules: false, printAndCut: true }],
    ['fbm1', { camera: true, modules: false, printAndCut: true }],
    ['fuv1', { camera: false, modules: true, printAndCut: true }],
  ])('%s', (model, tabs) => {
    expect(getManualConfigurationTabs(model)).toEqual(tabs);
  });
});

describe('ManualConfiguration Print and Cut fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('stores the fetched offset while open', async () => {
    mockFetchPncOffset.mockResolvedValue({ x: 1, y: 2 });

    render(<ManualConfiguration device={device('A')} onClose={jest.fn()} />);
    await act(async () => {});

    expect(mockFetchPncOffset).toHaveBeenCalledWith('A');
    expect(useManualConfigStore.getState().pnc).toEqual({ x: 1, y: 2 });
  });

  test('a fetch that resolves after close does not reach the store', async () => {
    let resolveA: (value: { x: number; y: number }) => void = () => {};

    mockFetchPncOffset.mockReturnValueOnce(new Promise((resolve) => (resolveA = resolve)));

    const { unmount } = render(<ManualConfiguration device={device('A')} onClose={jest.fn()} />);

    unmount();
    await act(async () => resolveA({ x: 4, y: 5 }));

    expect(useManualConfigStore.getState().pnc).toBeNull();
  });
});
