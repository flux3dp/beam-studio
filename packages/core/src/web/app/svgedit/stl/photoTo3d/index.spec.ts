import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';

import { decodePointCloud } from '../pointCloud';

const mockProcessImageWithAiJson = jest.fn();

jest.mock('@core/helpers/api/ai-image-process', () => ({
  processImageWithAiJson: (...args: unknown[]) => mockProcessImageWithAiJson(...args),
}));

const mockRunPhotoTo3d = jest.fn();

jest.mock('./runPhotoTo3d', () => ({
  PhotoTo3dCancelledError: class extends Error {},
  runPhotoTo3d: (...args: unknown[]) => mockRunPhotoTo3d(...args),
}));
jest.mock('../photoPointCloudGenerator', () => ({
  loadRasterData: async () => ({ data: new Uint8ClampedArray(16), height: 2, width: 2 }),
}));
jest.mock('@core/app/actions/progress-caller', () => ({
  openSteppingProgress: jest.fn(),
  popById: jest.fn(),
  update: jest.fn(),
}));

const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUpError: (...args: unknown[]) => mockPopUpError(...args),
}));
jest.mock('@core/helpers/image-edit', () => ({
  generateBase64Image: async () => 'data:image/png;base64,cut-out',
  getImageAttributes: () => ({ isFullColor: false }),
}));
jest.mock('@core/helpers/i18n', () => ({
  lang: {
    inner_engraving_settings: {
      photo_to_3d: 'Convert to 3D',
      photo_to_3d_failed: 'Conversion failed',
      photo_to_3d_flat: 'flat',
      photo_to_3d_no_points: 'no points',
      photo_to_3d_processing: 'processing',
      photo_to_3d_too_many_points: 'too many',
    },
  },
}));

const mockIsUvDev = jest.fn();

jest.mock('@core/helpers/is-dev', () => ({ __esModule: true, default: () => false, isUvDev: () => mockIsUvDev() }));

const mockPointSpacing = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  attributeMap: { stlPointSpacing: 'data-stl-point-spacing' },
}));
jest.mock('../engravingParams', () => ({
  getStlEngravingParams: () => ({ pointSpacing: mockPointSpacing() }),
}));
// 60 × 60 × 20 mm engravable, centred at 10 mm height (scene units are 0.1 mm)
jest.mock('@core/app/components/beambox/InnerEngraving/utils/engravable', () => ({
  getEngravableBox: () => ({ center: [300, 300, 100], depth: 600, height: 200, isValid: true, width: 600 }),
}));

const mockApplyPhotoPointCloud = jest.fn();

jest.mock('../photoPointCloud', () => ({
  applyPhotoPointCloud: (...args: unknown[]) => mockApplyPhotoPointCloud(...args),
}));

const mockAddCommandToHistory = jest.fn();
const mockAppendCommandToLast = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: unknown[]) => mockAddCommandToHistory(...args),
  appendCommandToLast: (...args: unknown[]) => mockAppendCommandToLast(...args),
}));

import {
  convertPhotoTo3d,
  isPhotoTo3dStale,
  refreshStalePhotoTo3d,
  updatePhotoTo3d,
  usePhotoTo3dBusy,
  watchStalePhotoTo3d,
} from '.';
import { PhotoTo3dError } from './generate';

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const response = (image: null | string = null) => ({
  depth: toBase64(new Uint8Array(Float32Array.from([1, 2, 3, 4]).buffer)),
  height: 2,
  image,
  mask: toBase64(Uint8Array.from([1, 1, 1, 1])),
  width: 2,
});

const photo: StlObject = {
  geometry: {} as StlObject['geometry'],
  id: 'photo',
  initialTransform: { flip: [false, false, false], position: [300, 300, 100], rotation: [0, 0, 0], scale: [1, 1, 1] },
  kind: 'photo',
  // 40 × 20 mm shown at half size, sitting 1 mm above the engravable floor
  transform: { flip: [false, false, false], position: [300, 300, 10], rotation: [0, 0, 0], scale: [0.5, 0.5, 1] },
};

let elem: SVGImageElement;

describe('photo to 3D', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsUvDev.mockReturnValue(false);
    mockPointSpacing.mockReturnValue(0.5);
    // world points: X and Y centred on the 20 × 10 mm photo, Z within its 4.4 mm relief
    mockRunPhotoTo3d.mockResolvedValue(Float32Array.from([10, -5, 0, -10, 5, 4.4]));
    URL.createObjectURL = jest.fn(() => 'blob:cut-out');
    document.body.innerHTML = `<svg id="svgcontent"><image id="photo" data-stl-photo="1"
      data-stl-photo-width="40" data-stl-photo-height="20" xlink:href="data:image/png;base64,photo" /></svg>`;
    elem = document.getElementById('photo') as unknown as SVGImageElement;
    useStlStore.setState({ objects: { photo } });
    global.fetch = jest.fn(async () => ({ blob: async () => new Blob(['photo']) })) as unknown as typeof fetch;
  });

  const convert = (removeBackground = false) =>
    convertPhotoTo3d(elem, { removeBackground, sharpenAmount: 1, sharpenRadius: 4 });

  test('turns the photo into a point cloud from its depth, in one undo step', async () => {
    mockProcessImageWithAiJson.mockResolvedValue(response());

    await expect(convert()).resolves.toBe(true);

    expect(mockProcessImageWithAiJson).toHaveBeenCalledWith(expect.any(Blob), {
      cost: 0.06,
      endpoint: '/api/photo-to-3d',
      formData: { remove_background: '0' },
      timeout: 270000,
    });

    // the relief is 22% of its 20 mm world width, and is lifted to fit the engravable height
    const [key, job] = mockRunPhotoTo3d.mock.lastCall;

    expect(key).toBe('photo');
    expect(job.size.width).toBeCloseTo(20);
    expect(job.size.height).toBeCloseTo(10);
    expect(job.size.depth).toBeCloseTo(4.4);
    expect(job.params).toEqual({ edgeRoundMm: 0.8, pointSpacing: 0.5, sharpenAmount: 1, sharpenRadius: 4 });

    const [id, buffer, options] = mockApplyPhotoPointCloud.mock.lastCall;

    expect(id).toBe('photo');
    // world → local: X and Y through the half scale, Z centred on the plane
    expect(Array.from(decodePointCloud(buffer).positions).map((value) => Number(value.toFixed(4)))).toEqual([
      20, -10, -2.2, -20, 10, 2.2,
    ]);
    expect(options.transform.scale).toEqual([0.5, 0.5, 1]);
    expect(options.transform.position[2]).toBeCloseTo(22);
    expect(options.depthSource.byteLength).toBe(16 + 4 * 5);
    expect(options.parentCmd).toBe(mockAddCommandToHistory.mock.lastCall[0]);

    expect(elem.getAttribute('data-stl-depth')).toBe('1');
    expect(elem.getAttribute('data-stl-depth-sharpen')).toBe('1');
    expect(elem.getAttribute('data-stl-depth-radius')).toBe('4');
    expect(elem.getAttribute('data-stl-depth-round')).toBe('0.8');
    expect(elem.getAttribute('data-stl-depth-grid')).toBe('40,20');
    expect(Number(elem.getAttribute('data-stl-depth-thickness'))).toBeCloseTo(4.4);
    // the image stays as it was
    expect(elem.getAttribute('xlink:href')).toBe('data:image/png;base64,photo');
  });

  test('with the background removed, the photo becomes the cut-out first', async () => {
    mockProcessImageWithAiJson.mockResolvedValue(response('iVBORw0KGgo='));

    await expect(convert(true)).resolves.toBe(true);

    expect(mockProcessImageWithAiJson.mock.lastCall[1].formData).toEqual({ remove_background: '1' });
    expect(elem.getAttribute('origImage')).toBe('blob:cut-out');
    expect(elem.getAttribute('xlink:href')).toBe('data:image/png;base64,cut-out');
    expect(elem.getAttribute('data-no-bg')).toBe('true');
  });

  test('the edge roll-off starts at 4% of the width', async () => {
    mockProcessImageWithAiJson.mockResolvedValue(response());

    await convert();

    // 4 mm on a 100 mm photo; this one is 20 mm wide
    expect(mockRunPhotoTo3d.mock.lastCall[1].params.edgeRoundMm).toBe(0.8);
  });

  test('nothing changes when the API gives nothing (cancelled, no credit, failed)', async () => {
    mockProcessImageWithAiJson.mockResolvedValue(null);

    await expect(convert()).resolves.toBe(false);

    expect(mockApplyPhotoPointCloud).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
  });

  test('a point cloud that cannot be made puts the photo back, and trying again is not charged', async () => {
    mockProcessImageWithAiJson.mockResolvedValue(response('iVBORw0KGgo='));
    mockRunPhotoTo3d.mockRejectedValueOnce(new Error('boom'));

    await expect(convert(true)).resolves.toBe(false);

    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'Conversion failed: boom' });
    expect(elem.getAttribute('xlink:href')).toBe('data:image/png;base64,photo');
    expect(elem.hasAttribute('data-stl-depth')).toBe(false);
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();

    await expect(convert(true)).resolves.toBe(true);
    expect(mockProcessImageWithAiJson).toHaveBeenCalledTimes(1);
  });

  describe('a converted photo', () => {
    beforeEach(() => {
      Object.entries({
        'data-stl-depth': '1',
        'data-stl-depth-grid': '40,20',
        'data-stl-depth-radius': '4',
        'data-stl-depth-round': '0',
        'data-stl-depth-sharpen': '1',
        'data-stl-depth-thickness': '4',
      }).forEach(([key, value]) => elem.setAttribute(key, value));
      useStlStore.setState({
        objects: {
          photo: { ...photo, depthSource: new ArrayBuffer(36), kind: 'point-cloud', transform: { ...photo.transform } },
        },
      });
    });

    const resize = (scale: [number, number, number]) =>
      useStlStore.setState(({ objects }) => ({
        objects: { photo: { ...objects.photo, transform: { ...objects.photo.transform, scale } } },
      }));

    test('goes stale when its X or Y size or its layer point spacing changes, not its Z size', () => {
      expect(isPhotoTo3dStale(elem)).toBe(false);
      resize([0.5, 0.5, 3]);
      expect(isPhotoTo3dStale(elem)).toBe(false);
      resize([0.6, 0.5, 1]);
      expect(isPhotoTo3dStale(elem)).toBe(true);
      resize([0.5, 0.5, 1]);
      mockPointSpacing.mockReturnValue(0.25);
      expect(isPhotoTo3dStale(elem)).toBe(true);
    });

    test('recomputes from the saved depth with the changed setting, as its own undo step', async () => {
      await updatePhotoTo3d(elem, { sharpenAmount: 2 }, 'new');

      expect(mockProcessImageWithAiJson).not.toHaveBeenCalled();
      expect(mockRunPhotoTo3d.mock.lastCall[1].params.sharpenAmount).toBe(2);
      expect(mockRunPhotoTo3d.mock.lastCall[1].size.depth).toBeCloseTo(4);
      expect(elem.getAttribute('data-stl-depth-sharpen')).toBe('2');
      expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    });

    test('a stale point cloud folds into the step that made it stale, or into nothing before a job', async () => {
      resize([1, 1, 1]);
      await updatePhotoTo3d(elem, {}, 'append');

      expect(elem.getAttribute('data-stl-depth-grid')).toBe('80,40');
      expect(mockAppendCommandToLast).toHaveBeenCalledWith(expect.anything(), 'Update photo to 3D', elem);

      mockPointSpacing.mockReturnValue(1);
      await refreshStalePhotoTo3d();

      expect(elem.getAttribute('data-stl-depth-grid')).toBe('40,20');
      expect(mockAddCommandToHistory).not.toHaveBeenCalled();
      expect(mockAppendCommandToLast).toHaveBeenCalledTimes(1);

      mockRunPhotoTo3d.mockClear();
      await refreshStalePhotoTo3d();
      expect(mockRunPhotoTo3d).not.toHaveBeenCalled();
    });

    describe('while the canvas watches', () => {
      const flush = () => jest.advanceTimersByTimeAsync(500);

      beforeEach(() => jest.useFakeTimers());
      afterEach(() => jest.useRealTimers());

      test('a changed layer point spacing recomputes the cloud once it settles, folded into that step', async () => {
        const stop = watchStalePhotoTo3d();

        mockPointSpacing.mockReturnValue(0.25);
        document.getElementById('svgcontent')!.setAttribute('data-stl-point-spacing', '0.25');
        await jest.advanceTimersByTimeAsync(100);
        expect(mockRunPhotoTo3d).not.toHaveBeenCalled();
        await flush();
        expect(mockRunPhotoTo3d).toHaveBeenCalledTimes(1);
        expect(mockRunPhotoTo3d.mock.lastCall[1].params.pointSpacing).toBe(0.25);
        expect(elem.getAttribute('data-stl-depth-grid')).toBe('80,40');
        expect(mockAppendCommandToLast).toHaveBeenCalledWith(expect.anything(), 'Update photo to 3D', elem);

        // another attribute, or a spacing the cloud already matches, recomputes nothing
        document.getElementById('svgcontent')!.setAttribute('data-stl-layer-spacing', '1');
        await flush();
        expect(mockRunPhotoTo3d).toHaveBeenCalledTimes(1);

        stop();
        mockPointSpacing.mockReturnValue(1);
        document.getElementById('svgcontent')!.setAttribute('data-stl-point-spacing', '1');
        await flush();
        expect(mockRunPhotoTo3d).toHaveBeenCalledTimes(1);
      });

      test('a grid the cloud cannot be computed on is reported once, until the grid changes again', async () => {
        const stop = watchStalePhotoTo3d();

        mockRunPhotoTo3d.mockRejectedValue(new PhotoTo3dError('too-many-points', 'too many'));
        mockPointSpacing.mockReturnValue(0.25);
        document.getElementById('svgcontent')!.setAttribute('data-stl-point-spacing', '0.25');
        await flush();
        await flush();
        await flush();
        expect(mockRunPhotoTo3d).toHaveBeenCalledTimes(1);
        expect(mockPopUpError).toHaveBeenCalledTimes(1);
        expect(mockPopUpError).toHaveBeenCalledWith({ message: 'too many' });
        expect(elem.getAttribute('data-stl-depth-grid')).toBe('40,20');

        // another grid is tried again, and reported again when it fails too
        mockPointSpacing.mockReturnValue(0.2);
        document.getElementById('svgcontent')!.setAttribute('data-stl-point-spacing', '0.2');
        await flush();
        expect(mockRunPhotoTo3d).toHaveBeenCalledTimes(2);
        expect(mockPopUpError).toHaveBeenCalledTimes(2);

        // a grid that fits is computed and clears the failure
        mockRunPhotoTo3d.mockResolvedValue(Float32Array.from([10, -5, 0, -10, 5, 4.4]));
        mockPointSpacing.mockReturnValue(1);
        document.getElementById('svgcontent')!.setAttribute('data-stl-point-spacing', '1');
        await flush();
        expect(mockRunPhotoTo3d).toHaveBeenCalledTimes(3);
        expect(elem.getAttribute('data-stl-depth-grid')).toBe('20,10');
        stop();
      });

      test('a resize recomputes the cloud too; a busy cloud waits for its computation', async () => {
        const stop = watchStalePhotoTo3d();

        usePhotoTo3dBusy.setState({ ids: ['photo'] });
        resize([1, 1, 1]);
        await flush();
        expect(mockRunPhotoTo3d).not.toHaveBeenCalled();

        usePhotoTo3dBusy.setState({ ids: [] });
        await flush();
        expect(mockRunPhotoTo3d).toHaveBeenCalledTimes(1);
        expect(mockRunPhotoTo3d.mock.lastCall[1].size.width).toBeCloseTo(40);
        stop();
      });
    });
  });
});
