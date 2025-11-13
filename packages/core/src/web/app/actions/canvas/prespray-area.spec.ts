const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
    subscribe: () => jest.fn(),
  },
}));

import { LayerModule, type LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import presprayArea from './prespray-area';

const mockGetWidth = jest.fn();
const mockGetHeight = jest.fn();
const mockGetExpansion = jest.fn();
const mockGetMinY = jest.fn();
const mockGetModel = jest.fn();
const mockGetBoundary = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  get boundary() {
    return mockGetBoundary();
  },
  get expansion() {
    return mockGetExpansion();
  },
  get height() {
    return mockGetHeight();
  },
  get minY() {
    return mockGetMinY();
  },
  get model() {
    return mockGetModel();
  },
  get modelHeight() {
    return mockGetHeight();
  },
  get width() {
    return mockGetWidth();
  },
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockHasModuleLayer = jest.fn();

jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({
  hasModuleLayer: (...args) => mockHasModuleLayer(...args),
}));

const setHasModuleLayer = (value: LayerModuleType | null) => {
  if (value === null) {
    mockHasModuleLayer.mockReturnValue(false);
  } else {
    mockHasModuleLayer.mockImplementation((modules: LayerModuleType[]) => modules.includes(value));
  }
};
const mockRequestAnimationFrame = jest.fn();

describe('test canvas/prespray-area', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetWidth.mockReturnValue(4300);
    mockGetHeight.mockReturnValue(4000);
    mockGetMinY.mockReturnValue(0);
    mockGetBoundary.mockReturnValue({ maxX: 4300, maxY: 4000, minX: 0, minY: 0 });
    mockGetModel.mockReturnValue('ado1');
    mockGetExpansion.mockReturnValue([0, 0]);
    mockRequestAnimationFrame.mockImplementation((cb) => cb());
    mockGetState.mockReturnValue({
      'enable-4c-prespray-area': false,
      'enable-job-origin': false,
      rotary_mode: false,
    });
    mockHasModuleLayer.mockReturnValue(false);
    window.requestAnimationFrame = mockRequestAnimationFrame;
    document.body.innerHTML = '<svg id="fixedSizeSvg"></svg>';
    setHasModuleLayer(LayerModule.PRINTER);
  });

  test('generate prespray area for PRINTER', () => {
    presprayArea.generatePresprayArea();
    expect(document.getElementById('fixedSizeSvg').innerHTML).toMatchSnapshot();
    expect(document.getElementById('presprayAreaImage')).not.toBeNull();
    expect(document.getElementById('presprayAreaRect')).not.toBeNull();
    expect(document.getElementById('presprayAreaImage').getAttribute('display')).not.toBe('none');
    expect(document.getElementById('presprayAreaRect').getAttribute('display')).toBe('none');
  });

  test('generate prespray area for PRINTER_4C', () => {
    mockGetModel.mockReturnValue('fbm2');
    setHasModuleLayer(LayerModule.PRINTER_4C);
    mockGetState.mockReturnValue({
      'enable-4c-prespray-area': true,
      'enable-job-origin': false,
      rotary_mode: false,
    });
    presprayArea.generatePresprayArea();
    expect(document.getElementById('presprayAreaImage')).not.toBeNull();
    expect(document.getElementById('presprayAreaRect')).not.toBeNull();
    expect(document.getElementById('presprayAreaImage').getAttribute('display')).toBe('none');
    expect(document.getElementById('presprayAreaRect').getAttribute('display')).not.toBe('none');
  });

  test('hide prespray area when rotary mode is on', () => {
    mockGetState.mockReturnValue({
      'enable-job-origin': false,
      rotary_mode: true,
    });
    presprayArea.generatePresprayArea();
    expect(document.getElementById('presprayAreaImage')).not.toBeNull();
    expect(document.getElementById('presprayAreaRect')).not.toBeNull();
    expect(document.getElementById('presprayAreaImage').getAttribute('display')).toBe('none');
    expect(document.getElementById('presprayAreaRect').getAttribute('display')).toBe('none');
  });

  test('toggle prespray area', () => {
    presprayArea.generatePresprayArea();
    expect(document.getElementById('presprayAreaImage')).not.toBeNull();
    expect(document.getElementById('presprayAreaRect')).not.toBeNull();
    setHasModuleLayer(null);
    presprayArea.togglePresprayArea();
    expect(document.getElementById('presprayAreaImage').getAttribute('display')).toBe('none');
    expect(document.getElementById('presprayAreaRect').getAttribute('display')).toBe('none');
  });

  test('checkMouseTarget', () => {
    presprayArea.generatePresprayArea();

    const imageTarget = document.getElementById('presprayAreaImage');
    const rectTarget = document.getElementById('presprayAreaRect');

    expect(presprayArea.checkMouseTarget(imageTarget)).toBe(true);
    expect(presprayArea.checkMouseTarget(rectTarget)).toBe(true);

    const otherTarget = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    expect(presprayArea.checkMouseTarget(otherTarget)).toBe(false);
  });

  test('drag prespray area for PRINTER (free movement)', () => {
    presprayArea.generatePresprayArea();
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 4000, y: 2400 });
    presprayArea.startDrag();
    presprayArea.drag(-1000, -1000);
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 3000, y: 1400 });
    presprayArea.drag(-3000, -3000);
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 1000, y: 0 });
    presprayArea.startDrag();
    presprayArea.drag(100, 100);
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 1100, y: 100 });
    presprayArea.drag(10000, 10000);
    expect(presprayArea.getPosition()).toEqual({ h: 300, w: 300, x: 4000, y: 3700 });
    presprayArea.endDrag();
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  test('drag prespray area for PRINTER_4C (horizontal only)', () => {
    setHasModuleLayer(LayerModule.PRINTER_4C);
    mockGetModel.mockReturnValue('fbm2');
    mockGetState.mockReturnValue({
      'enable-4c-prespray-area': true,
      'enable-job-origin': false,
      rotary_mode: false,
    });
    document.body.innerHTML = '<svg id="fixedSizeSvg"></svg>';
    presprayArea.generatePresprayArea();
    expect(presprayArea.getPosition()).toEqual({ h: 0, w: 103, x: 4197, y: 0 });
    presprayArea.startDrag();
    presprayArea.drag(-1000, -1000);
    // Y should remain at 0 for PRINTER_4C
    expect(presprayArea.getPosition()).toEqual({ h: 0, w: 103, x: 3197, y: 0 });
    presprayArea.drag(-3000, -3000);
    expect(presprayArea.getPosition()).toEqual({ h: 0, w: 103, x: 1197, y: 0 });
    presprayArea.startDrag();
    presprayArea.drag(100, 100);
    // Y should still remain at 0
    expect(presprayArea.getPosition()).toEqual({ h: 0, w: 103, x: 1297, y: 0 });
    presprayArea.drag(10000, 10000);
    expect(presprayArea.getPosition()).toEqual({ h: 0, w: 103, x: 4197, y: 0 });
    presprayArea.endDrag();
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });
});
