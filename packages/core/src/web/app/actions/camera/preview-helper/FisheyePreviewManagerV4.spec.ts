import type { FisheyeCameraParametersV4, PerspectiveGrid } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const mockSetFisheyeParam = jest.fn();
const mockSetFisheyeObjectHeight = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  setFisheyeObjectHeight: (...args: any[]) => mockSetFisheyeObjectHeight(...args),
  setFisheyeParam: (...args: any[]) => mockSetFisheyeParam(...args),
}));

jest.mock('@core/app/actions/alert-caller', () => ({}));
jest.mock('@core/app/actions/dialog-caller', () => ({}));
jest.mock('@core/app/actions/progress-caller', () => ({}));
jest.mock('@core/helpers/device/camera/getFocalDistance', () => jest.fn());
jest.mock('./getLevelingData', () => jest.fn());
jest.mock('./rawAndHome', () => jest.fn());

import FisheyePreviewManagerV4 from './FisheyePreviewManagerV4';

const grid: PerspectiveGrid = { x: [0, 360, 10], y: [0, 240, 10] };
const params = {
  offset: [1, 0.5],
  region_offsets: { blend: true, topLeft: [2, 0] },
  v: 4,
} as unknown as FisheyeCameraParametersV4;

describe('FisheyePreviewManagerV4 manual offsets (PRD D7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('full-area sends region_offsets without offset, so a missing table never inherits the region value', async () => {
    const manager = new FisheyePreviewManagerV4({} as IDeviceInfo, { ...params }, grid);

    await manager.updateGrid(grid, true);

    const sent = mockSetFisheyeParam.mock.calls[0][0];

    expect(sent.offset).toBeUndefined();
    expect(sent.region_offsets).toEqual({ blend: true, topLeft: [2, 0] });
  });

  test('region sends offset without region_offsets', async () => {
    const manager = new FisheyePreviewManagerV4({} as IDeviceInfo, { ...params }, grid);

    await manager.updateGrid(grid, false);

    const sent = mockSetFisheyeParam.mock.calls[0][0];

    expect(sent.offset).toEqual([1, 0.5]);
    expect(sent.region_offsets).toBeUndefined();
  });

  test('keeps the stored params intact for the next mode switch', async () => {
    const stored = { ...params };
    const manager = new FisheyePreviewManagerV4({} as IDeviceInfo, stored, grid);

    await manager.updateGrid(grid, true);
    await manager.updateGrid(grid, false);

    expect(stored.offset).toEqual([1, 0.5]);
    expect(stored.region_offsets).toEqual({ blend: true, topLeft: [2, 0] });
    expect(mockSetFisheyeParam.mock.calls[1][0].offset).toEqual([1, 0.5]);
  });
});
