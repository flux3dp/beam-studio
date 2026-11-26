const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: unknown[]) => mockPopUp(...args) }));
jest.mock('@core/helpers/api/alert-config', () => ({ read: () => false, write: jest.fn() }));
// the shared __mocks__ return fixed values, the tests need the real key lookup
jest.mock('@core/app/constants/presets', () => ({ __esModule: true, default: { wood_3mm_cutting: {} } }));
jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (layer: Element, key: string) => layer.getAttribute(`data-${key}`),
}));

import { doesLayerContainFill, hasCutLayerWithFill, showCutLayerFillAlert } from './check-cut-layer-fill';

const setup = (defs: string, layer: string, configName = 'wood_3mm_cutting') => {
  document.body.innerHTML = `<svg xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>${defs}</defs>
    <g class="layer">${layer}</g>
  </svg>`;

  const layerElem = document.querySelector('g.layer')!;

  // the HTML parser lowercases attribute names; writeDataLayer keeps the camelCase via setAttribute
  layerElem.setAttribute('data-configName', configName);

  return layerElem;
};

describe('check-cut-layer-fill', () => {
  test('canvas shapes', () => {
    expect(doesLayerContainFill(setup('', '<rect fill="none" /><path fill="#333" fill-opacity="0" />'))).toBe(false);
    expect(doesLayerContainFill(setup('', '<rect fill="none" /><path fill="#333" />'))).toBe(true);
    expect(doesLayerContainFill(setup('', '<image />'))).toBe(true);
  });

  test('white and transparent fills are not engraved', () => {
    expect(doesLayerContainFill(setup('', '<rect fill="#FFF" /><path fill="white" /><text fill="#ffffff" />'))).toBe(
      false,
    );
    expect(doesLayerContainFill(setup('', '<rect fill="rgb(250, 250, 250)" />'))).toBe(false);
    expect(doesLayerContainFill(setup('', '<rect fill="rgba(0, 0, 0, 0)" />'))).toBe(false);
    expect(doesLayerContainFill(setup('', '<rect fill="rgb(240, 240, 240)" />'))).toBe(true);
    expect(doesLayerContainFill(setup('', '<rect fill="url(#gradient)" />'))).toBe(true);
  });

  test('use content', () => {
    const filledSymbol = '<symbol id="s"><clipPath><rect /></clipPath><path fill="#000" /></symbol>';

    expect(doesLayerContainFill(setup(filledSymbol, '<use xlink:href="#s" />'))).toBe(true);
    expect(doesLayerContainFill(setup(filledSymbol, '<use xlink:href="#s" data-wireframe="true" />'))).toBe(false);
    // clipPath children alone never count
    expect(
      doesLayerContainFill(setup('<symbol id="s"><clipPath><rect /></clipPath></symbol>', '<use xlink:href="#s" />')),
    ).toBe(false);
    // image symbol resolves back to the original vector symbol
    expect(
      doesLayerContainFill(
        setup(
          '<symbol id="o"><path fill="none" /></symbol><symbol id="img" data-origin-symbol="o"><image /></symbol>',
          '<use xlink:href="#img" />',
        ),
      ),
    ).toBe(false);
  });

  test('only cut presets count', () => {
    expect(hasCutLayerWithFill([setup('', '<path fill="#000" />')])).toBe(true);
    expect(hasCutLayerWithFill([setup('', '<path fill="#000" />', 'wood_engraving')])).toBe(false);
    expect(hasCutLayerWithFill([setup('', '<path fill="#000" />', 'my_cutting')])).toBe(false);
  });

  test('closing the alert with Esc continues', async () => {
    const promise = showCutLayerFillAlert();

    mockPopUp.mock.calls[0][0].onClose();
    await expect(promise).resolves.toBeUndefined();
  });
});
