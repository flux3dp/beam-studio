const mockLoadCurveData = jest.fn();
const mockImportBvgString = jest.fn();
const mockParseStl = jest.fn();
const mockSyncStlObjectsWithDom = jest.fn();

jest.mock('@core/app/actions/canvas/curveEngravingModeController', () => ({
  data: null,
  loadData: (...args: unknown[]) => mockLoadCurveData(...args),
}));
jest.mock('@core/app/actions/progress-caller', () => ({ popById: jest.fn() }));
jest.mock('@core/app/components/dialogs/PrintAndCut/resumeConfigStore', () => ({
  useResumeConfigStore: { getState: () => ({ config: null }), setState: jest.fn() },
}));
jest.mock('@core/app/stores/variableText', () => ({
  useVariableTextState: { getState: () => ({}), setState: jest.fn() },
}));
jest.mock('@core/app/svgedit/history/history', () => ({ BatchCommand: class {} }));
jest.mock('@core/app/svgedit/history/undoManager', () => ({ addCommandToHistory: jest.fn() }));
jest.mock('@core/app/svgedit/operations/import/importBvg', () => ({
  importBvgString: (...args: unknown[]) => mockImportBvgString(...args),
}));
jest.mock('@core/app/svgedit/stl/photoPlane', () => ({ readPhotoPlaneObjects: () => [] }));
jest.mock('@core/app/svgedit/stl/sync', () => ({
  syncStlObjectsWithDom: (...args: unknown[]) => mockSyncStlObjectsWithDom(...args),
}));
jest.mock('@core/app/svgedit/workarea', () => ({ resetView: jest.fn(), setWorkarea: jest.fn() }));
jest.mock('@core/helpers/image/updateImageDisplay', () => jest.fn());
jest.mock('@core/helpers/variableText', () => ({ hasVariableText: () => false }));
jest.mock('three/examples/jsm/loaders/STLLoader.js', () => ({
  STLLoader: class {
    parse = (...args: unknown[]) => mockParseStl(...args);
  },
}));

import { Buffer } from 'buffer';

import { POINT_CLOUD_ATTR } from '@core/app/svgedit/stl/constants';
import { encodePointCloud } from '@core/app/svgedit/stl/pointCloud';

import beamFileHelper from './beam-file-helper';

const readVInt = (buffer: Buffer, start: number): { offset: number; value: number } => {
  let offset = start;
  let shift = 0;
  let value = 0;

  while (true) {
    const byte = buffer.readUInt8(offset++);

    value += (byte & 0x7f) * 2 ** shift;

    if (byte < 0x80) return { offset, value };

    shift += 7;
  }
};

describe('beam-file-helper point cloud block', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = `<svg id="svgcontent"><image id="photo" ${POINT_CLOUD_ATTR.marker}="1" /></svg>`;
  });

  test('writes block 7 last with its versioned binary and metadata', () => {
    const pointCloud = encodePointCloud(new Float32Array([0, 0, 0, 1, 2, 3]));
    const stl = new Uint8Array([1, 2, 3]).buffer;
    const beam = beamFileHelper.generateBeamBuffer('<svg/>', {}, undefined, { mesh: stl }, { photo: pointCloud });
    const headerLength = readVInt(beam, 5);
    const headerStart = headerLength.offset;
    const headerEnd = headerStart + headerLength.value;
    const metadataLength = readVInt(beam, headerStart);
    const metadata = JSON.parse(
      beam.toString('utf8', metadataLength.offset, metadataLength.offset + metadataLength.value),
    );

    expect(metadata).toMatchObject({ contents: [1, 2, 4, 6, 7], innerEngraving: true });

    const blockTypes: number[] = [];
    let offset = headerEnd;
    let pointCloudPayload: Buffer | null = null;

    while (beam.readUInt8(offset) !== 0) {
      const type = beam.readUInt8(offset++);
      const length = readVInt(beam, offset);
      const end = length.offset + length.value;

      blockTypes.push(type);

      if (type === 7) pointCloudPayload = beam.subarray(length.offset, end);

      offset = end;
    }

    expect(blockTypes).toEqual([1, 2, 4, 6, 7]);
    expect(pointCloudPayload).not.toBeNull();

    const idLength = pointCloudPayload!.readUInt8(0);
    const idEnd = 1 + idLength;
    const binaryLength = readVInt(pointCloudPayload!, idEnd);

    expect(pointCloudPayload!.toString('utf8', 1, idEnd)).toBe('photo');
    expect(binaryLength.value).toBe(pointCloud.byteLength);
    expect(pointCloudPayload!.subarray(binaryLength.offset)).toEqual(Buffer.from(pointCloud));
  });

  test('rebuilds a point-cloud runtime object when the beam file is read', async () => {
    const transform = {
      initialTransform: {
        flip: [false, false, false],
        position: [10, 20, 30],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      transform: {
        flip: [false, false, false],
        position: [40, 50, 60],
        rotation: [0, 0, 0],
        scale: [2, 2, 1],
      },
    };
    const pointCloud = encodePointCloud(new Float32Array([-1, -2, 0, 1, 2, 3]));

    mockImportBvgString.mockImplementation(async () => {
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');

      image.id = 'photo';
      image.setAttribute('data-stl-photo', '1');
      image.setAttribute(POINT_CLOUD_ATTR.marker, '1');
      image.setAttribute('data-stl-transform', JSON.stringify(transform));
      document.getElementById('svgcontent')!.appendChild(image);
    });

    const beam = beamFileHelper.generateBeamBuffer('<svg/>', {}, undefined, {}, { photo: pointCloud });

    document.body.innerHTML = '<svg id="svgcontent"></svg>';
    await beamFileHelper.readBeam(new File([beam], 'relief.beam'));

    expect(mockSyncStlObjectsWithDom).toHaveBeenCalledTimes(1);

    const [objects] = mockSyncStlObjectsWithDom.mock.calls[0];
    const object = objects[0];

    expect(object).toMatchObject({
      id: 'photo',
      initialTransform: transform.initialTransform,
      kind: 'point-cloud',
      pointCloudBuffer: expect.any(ArrayBuffer),
      transform: transform.transform,
    });
    expect(object.geometry.getAttribute('position').count).toBe(2);
    expect(Array.from(new Uint8Array(object.pointCloudBuffer))).toEqual(Array.from(new Uint8Array(pointCloud)));
  });

  test('does not materialize binary 3D data after the SVG projections were downgraded to 2D', async () => {
    mockImportBvgString.mockImplementation(async () => {
      document.body.innerHTML = '<svg id="svgcontent"><rect id="mesh" fill="none" /></svg>';
    });

    const pointCloud = encodePointCloud(new Float32Array([0, 0, 0]));
    const beam = beamFileHelper.generateBeamBuffer(
      '<svg/>',
      {},
      undefined,
      { mesh: new Uint8Array([1, 2, 3]).buffer },
      { photo: pointCloud },
    );

    await beamFileHelper.readBeam(new File([beam], 'declined-inner-engraving.beam'));

    expect(mockParseStl).not.toHaveBeenCalled();
    expect(mockSyncStlObjectsWithDom).toHaveBeenCalledWith([]);
  });
});
