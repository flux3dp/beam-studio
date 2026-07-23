const mockGetLayerElementByName = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getLayerElementByName: (name: string) => mockGetLayerElementByName(name),
}));

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: jest.fn() }));
jest.mock('@core/app/svgedit/history/undoManager', () => ({ addCommandToHistory: jest.fn() }));
jest.mock('@core/app/svgedit/operations/clipboard', () => ({ handlePastedRef: jest.fn() }));
jest.mock('@core/app/svgedit/selection', () => ({}));
jest.mock('@core/helpers/color/updateLayerColor', () => jest.fn());
jest.mock('@core/helpers/color/updateLayerColorFilter', () => jest.fn());
jest.mock('@core/helpers/layer/moveToLayer', () => ({ moveSelectedToLayer: jest.fn() }));
jest.mock('@core/helpers/svg-editor-helper', () => ({ getSVGAsync: jest.fn() }));

jest.mock('./deleteLayer', () => ({ deleteLayerByName: jest.fn() }));

import { getObjectLayer } from './layer-helper';

describe('getObjectLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('returns the raw layer name when it contains characters that html-escape', () => {
    document.body.innerHTML =
      '<svg id="svgcontent"><g class="layer"><title>A &amp; B</title><rect id="elem" /></g></svg>';

    const elem = document.getElementById('elem') as unknown as SVGElement;
    const result = getObjectLayer(elem);

    expect(result?.title).toBe('A & B');
    expect(result?.elem).toBe(document.querySelector('g.layer'));
  });

  it('returns the layer name for a plain name', () => {
    document.body.innerHTML =
      '<svg id="svgcontent"><g class="layer"><title>Layer 1</title><rect id="elem" /></g></svg>';

    const elem = document.getElementById('elem') as unknown as SVGElement;

    expect(getObjectLayer(elem)?.title).toBe('Layer 1');
  });

  it('falls back to data-original-layer when the element is not in a layer', () => {
    document.body.innerHTML =
      '<svg id="svgcontent"><g class="layer" id="layer"><title>A &amp; B</title></g>' +
      '<g><rect id="elem" data-original-layer="A &amp; B" /></g></svg>';

    const layer = document.getElementById('layer');

    mockGetLayerElementByName.mockReturnValue(layer);

    const elem = document.getElementById('elem') as unknown as SVGElement;
    const result = getObjectLayer(elem);

    expect(mockGetLayerElementByName).toHaveBeenCalledWith('A & B');
    expect(result?.elem).toBe(layer);
    expect(result?.title).toBe('A & B');
  });

  it('returns null when the element has no layer and no data-original-layer', () => {
    document.body.innerHTML = '<svg id="svgcontent"><g><rect id="elem" /></g></svg>';

    const elem = document.getElementById('elem') as unknown as SVGElement;

    expect(getObjectLayer(elem)).toBeNull();
  });
});
