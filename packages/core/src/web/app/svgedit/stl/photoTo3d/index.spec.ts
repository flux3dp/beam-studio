import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';

import { decodePointCloud } from '../pointCloud';

const mockProcessImageWithAiJson = jest.fn();

jest.mock('@core/helpers/api/ai-image-process', () => ({
  processImageWithAiJson: (...args: unknown[]) => mockProcessImageWithAiJson(...args),
}));

const mockRunPhotoTo3d = jest.fn();

jest.mock('./runPhotoTo3d', () => ({
  PhotoTo3dCancelledError: class PhotoTo3dCancelledError extends Error {},
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

const mockGetObjectLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: (...args: unknown[]) => mockGetObjectLayer(...args),
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
import { PhotoTo3dCancelledError } from './runPhotoTo3d';

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
    mockGetObjectLayer.mockReturnValue(undefined);
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
    expect(job.params).toEqual({ edgeRoundMm: 0, pointSpacing: 0.5, sharpenAmount: 1, sharpenRadius: 4 });

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
    expect(elem.getAttribute('data-stl-depth-round-percent')).toBe('0');
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

  test('the edge processing starts off', async () => {
    mockProcessImageWithAiJson.mockResolvedValue(response());

    await convert();

    expect(mockRunPhotoTo3d.mock.lastCall[1].params.edgeRoundMm).toBe(0);
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
        'data-stl-depth-round-percent': '0',
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

    test('the roll-off follows the size it is computed at', async () => {
      await updatePhotoTo3d(elem, { edgeRoundPercent: 5 }, 'new');
      // 5% of the 20 mm world width
      expect(mockRunPhotoTo3d.mock.lastCall[1].params.edgeRoundMm).toBeCloseTo(1);
      expect(elem.getAttribute('data-stl-depth-round-percent')).toBe('5');

      resize([1, 1, 1]);
      await updatePhotoTo3d(elem, {}, 'append');
      expect(mockRunPhotoTo3d.mock.lastCall[1].params.edgeRoundMm).toBeCloseTo(2);
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

    describe('a computation that ends late', () => {
      const deferred = () => {
        let resolve: (points: Float32Array) => void = () => {};
        const promise = new Promise<Float32Array>((res) => {
          resolve = res;
        });

        return { promise, resolve };
      };
      const points = Float32Array.from([10, -5, 0, -10, 5, 4.4]);

      test('is dropped when the conversion was undone meanwhile', async () => {
        const run = deferred();

        mockRunPhotoTo3d.mockReturnValueOnce(run.promise);

        const update = updatePhotoTo3d(elem, { sharpenAmount: 2 }, 'new');

        await Promise.resolve();
        expect(usePhotoTo3dBusy.getState().ids).toEqual(['photo']);
        // undoing the conversion takes the marker off and makes the object a plain photo again
        elem.removeAttribute('data-stl-depth');
        useStlStore.setState({ objects: { photo } });
        run.resolve(points);

        await expect(update).rejects.toBeInstanceOf(PhotoTo3dCancelledError);
        expect(mockApplyPhotoPointCloud).not.toHaveBeenCalled();
        expect(mockAddCommandToHistory).not.toHaveBeenCalled();
        expect(elem.getAttribute('data-stl-depth-sharpen')).toBe('1');
        expect(usePhotoTo3dBusy.getState().ids).toEqual([]);
      });

      test('is dropped when its size was undone meanwhile', async () => {
        const run = deferred();

        resize([1, 1, 1]);
        mockRunPhotoTo3d.mockReturnValueOnce(run.promise);

        const update = updatePhotoTo3d(elem, {}, 'append');

        await Promise.resolve();
        resize([0.5, 0.5, 1]);
        run.resolve(points);

        await expect(update).rejects.toBeInstanceOf(PhotoTo3dCancelledError);
        expect(mockAppendCommandToLast).not.toHaveBeenCalled();
        expect(elem.getAttribute('data-stl-depth-grid')).toBe('40,20');
      });

      test('is dropped when a newer one started, even when it ends after the newer one', async () => {
        const first = deferred();
        const second = deferred();

        mockRunPhotoTo3d.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

        const older = updatePhotoTo3d(elem, { sharpenAmount: 2 }, 'new');

        await new Promise((resolve) => setTimeout(resolve));

        const newer = updatePhotoTo3d(elem, { sharpenAmount: 2, sharpenRadius: 6 }, 'new');

        await new Promise((resolve) => setTimeout(resolve));
        second.resolve(points);
        await expect(newer).resolves.toBe(true);
        first.resolve(points);
        await expect(older).rejects.toBeInstanceOf(PhotoTo3dCancelledError);

        expect(mockApplyPhotoPointCloud).toHaveBeenCalledTimes(1);
        expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
        expect(elem.getAttribute('data-stl-depth-sharpen')).toBe('2');
        expect(elem.getAttribute('data-stl-depth-radius')).toBe('6');
      });

      test('keeps the object busy until the newest one ends', async () => {
        const first = deferred();
        const second = deferred();

        mockRunPhotoTo3d.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

        const older = updatePhotoTo3d(elem, { sharpenAmount: 2 }, 'new');
        const newer = updatePhotoTo3d(elem, { sharpenAmount: 3 }, 'new');

        await new Promise((resolve) => setTimeout(resolve));
        first.resolve(points);
        await expect(older).rejects.toBeInstanceOf(PhotoTo3dCancelledError);
        expect(usePhotoTo3dBusy.getState().ids).toEqual(['photo']);

        second.resolve(points);
        await newer;
        expect(usePhotoTo3dBusy.getState().ids).toEqual([]);
        expect(elem.getAttribute('data-stl-depth-sharpen')).toBe('3');
      });
    });

    describe('before a job', () => {
      test('waits for a computation still going, so the job sends its result', async () => {
        let resolveRun: (points: Float32Array) => void = () => {};

        mockRunPhotoTo3d.mockReturnValueOnce(
          new Promise<Float32Array>((resolve) => {
            resolveRun = resolve;
          }),
        );

        const update = updatePhotoTo3d(elem, { sharpenAmount: 2 }, 'new');
        let refreshed = false;
        const refresh = refreshStalePhotoTo3d().then(() => {
          refreshed = true;
        });

        await new Promise((resolve) => setTimeout(resolve));
        expect(refreshed).toBe(false);

        resolveRun(Float32Array.from([10, -5, 0, -10, 5, 4.4]));
        await update;
        await refresh;
        expect(refreshed).toBe(true);
        expect(mockApplyPhotoPointCloud).toHaveBeenCalledTimes(1);
      });

      test('a stale cloud that cannot be recomputed fails the job instead of sending the old cloud', async () => {
        mockRunPhotoTo3d.mockRejectedValue(new PhotoTo3dError('too-many-points', 'too many'));
        mockPointSpacing.mockReturnValue(0.01);

        await expect(refreshStalePhotoTo3d()).rejects.toBeInstanceOf(PhotoTo3dError);
        expect(mockApplyPhotoPointCloud).not.toHaveBeenCalled();
        expect(elem.getAttribute('data-stl-depth-grid')).toBe('40,20');
      });
    });

    describe('while the canvas watches', () => {
      const flush = () => jest.advanceTimersByTimeAsync(500);

      beforeEach(() => jest.useFakeTimers());
      afterEach(() => jest.useRealTimers());

      test('a changed layer point spacing recomputes the cloud once it settles, folded into that step', async () => {
        const layer = document.getElementById('svgcontent')!;
        const stop = watchStalePhotoTo3d();

        mockGetObjectLayer.mockReturnValue({ elem: layer });

        mockPointSpacing.mockReturnValue(0.25);
        document.getElementById('svgcontent')!.setAttribute('data-stl-point-spacing', '0.25');
        await jest.advanceTimersByTimeAsync(100);
        expect(mockRunPhotoTo3d).not.toHaveBeenCalled();
        await flush();
        expect(mockRunPhotoTo3d).toHaveBeenCalledTimes(1);
        expect(mockRunPhotoTo3d.mock.lastCall[1].params.pointSpacing).toBe(0.25);
        expect(elem.getAttribute('data-stl-depth-grid')).toBe('80,40');
        // the spacing step was recorded on the layer, a resize on the object: either one takes it
        expect(mockAppendCommandToLast).toHaveBeenCalledWith(expect.anything(), 'Update photo to 3D', [elem, layer]);

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
