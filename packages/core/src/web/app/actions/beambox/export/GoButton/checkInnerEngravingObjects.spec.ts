import { Box3, Vector3 } from 'three';

import { checkInnerEngravingObjects } from './checkInnerEngravingObjects';

const mockGetEngravableBox = jest.fn();
const mockGetWorldBox = jest.fn();
const mockObjects: Record<string, { id: string }> = {};

jest.mock('@core/app/components/beambox/InnerEngraving/utils/engravable', () => ({
  getEngravableBox: () => mockGetEngravableBox(),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/transform', () => ({
  getWorldBox: (...args: unknown[]) => mockGetWorldBox(...args),
}));
jest.mock('@core/app/stores/stlStore', () => ({
  useStlStore: { getState: () => ({ objects: mockObjects }) },
}));

const box = (min: [number, number, number], max: [number, number, number]) =>
  new Box3(new Vector3(...min), new Vector3(...max));

const addLayer = (ids: string[]) => {
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  layer.classList.add('layer');
  ids.forEach((id) => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    elem.id = id;
    elem.setAttribute('data-stl', '1');
    layer.appendChild(elem);
    mockObjects[id] = { id };
  });
  document.querySelector('#svgcontent')!.appendChild(layer);
};

describe('checkInnerEngravingObjects', () => {
  beforeEach(() => {
    document.body.innerHTML = '<svg><g id="svgcontent"></g></svg>';
    Object.keys(mockObjects).forEach((id) => delete mockObjects[id]);
    mockGetEngravableBox.mockReturnValue({ isValid: true, max: [100, 100, 100], min: [0, 0, 0] });
    mockGetWorldBox.mockImplementation(({ id }: { id: string }) =>
      id === 'outside' ? box([90, 10, 10], [110, 20, 20]) : box([10, 10, 10], [20, 20, 20]),
    );
  });

  it('reports objects outside the engravable area and overlapping objects', () => {
    addLayer(['inside', 'outside']);

    mockGetWorldBox.mockImplementation(({ id }: { id: string }) =>
      id === 'outside' ? box([15, 15, 15], [110, 25, 25]) : box([10, 10, 10], [20, 20, 20]),
    );

    const result = checkInnerEngravingObjects();

    expect(result.outOfRange).toBe(1);
    expect(result.overlaps).toBe(1);
  });

  it('uses reverse DOM layer order and warns when a later layer is lower', () => {
    addLayer(['later']);
    addLayer(['first']);
    mockGetWorldBox.mockImplementation(({ id }: { id: string }) =>
      id === 'first' ? box([10, 10, 30], [20, 20, 40]) : box([10, 10, 10], [20, 20, 20]),
    );

    expect(checkInnerEngravingObjects().wrongLayerOrder).toBe(1);
  });

  it('ignores touching boundaries because they do not overlap in volume', () => {
    addLayer(['a', 'b']);
    mockGetWorldBox.mockImplementation(({ id }: { id: string }) =>
      id === 'a' ? box([10, 10, 10], [20, 20, 20]) : box([20, 10, 10], [30, 20, 20]),
    );

    expect(checkInnerEngravingObjects().overlaps).toBe(0);
  });
});
