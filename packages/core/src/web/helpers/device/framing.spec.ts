/**
 * Unit tests for the frame-preview (外框預覽) coordinate logic in framing.ts.
 *
 * Focus: the pure-ish `getCoords` extent computation, exercised through the public
 * `FramingTaskManager.startFraming(FramingType.Framing)` path. The single most important
 * behaviour under test is the hidden-layer exclusion at framing.ts:123
 * (`if (layer.getAttribute('display') === 'none') return;`) which backs the release-test
 * sheet row 外框預覽「隱藏的圖層不會進行外框預覽」.
 *
 * The device-motion half of that sheet row (websocket task lifecycle, raw moves) is a
 * human/machine-tier check and is intentionally mocked thin here — we only assert the
 * computed frame corners handed to `deviceMaster.startFraming`.
 */
import { FramingType } from './framing';

// --- mock fns (declared before jest.mock, hoisted) ---
const mockConvertVariableText = jest.fn();
const mockHasVariableText = jest.fn();
const mockGetAllLayers = jest.fn();
const mockGetData = jest.fn();
const mockGetVisibleElementsAndBBoxes = jest.fn();
const mockCheckDeviceStatus = jest.fn();
const mockStartFraming = jest.fn();
const mockStopFraming = jest.fn();
const mockGetRotaryInfo = jest.fn();
const mockGetAddOnInfo = jest.fn();
const mockSwiftrayOn = jest.fn();
const mockSwiftrayOff = jest.fn();
const mockPromarkGet = jest.fn();
const mockClearSelection = jest.fn();
const mockOpenMessage = jest.fn();
const mockCloseMessage = jest.fn();

jest.mock('@core/helpers/variableText', () => ({
  convertVariableText: (...args: any[]) => mockConvertVariableText(...args),
  hasVariableText: (...args: any[]) => mockHasVariableText(...args),
}));

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getAllLayers: (...args: any[]) => mockGetAllLayers(...args),
}));

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (...args: any[]) => mockGetData(...args),
}));

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb: any) =>
    cb({
      Canvas: {
        getVisibleElementsAndBBoxes: (...args: any[]) => mockGetVisibleElementsAndBBoxes(...args),
      },
    }),
}));

// workareaManager: width 3000px, minY 0, maxY 2100 (px). dpmm = 10.
jest.mock('@core/app/svgedit/workarea', () => ({
  __esModule: true,
  default: { maxY: 2100, minY: 0, width: 3000 },
}));

jest.mock('@core/helpers/check-device-status', () => ({
  __esModule: true,
  default: (...args: any[]) => mockCheckDeviceStatus(...args),
}));

jest.mock('@core/helpers/device-master', () => ({
  __esModule: true,
  default: {
    startFraming: (...args: any[]) => mockStartFraming(...args),
    stopFraming: (...args: any[]) => mockStopFraming(...args),
    getReport: jest.fn().mockResolvedValue({ st_id: 0 }),
    setField: jest.fn(),
    setGalvoParameters: jest.fn(),
  },
}));

jest.mock('@core/helpers/addOn/rotary', () => ({
  getRotaryInfo: (...args: any[]) => mockGetRotaryInfo(...args),
}));

jest.mock('@core/app/constants/addOn', () => ({
  ...jest.requireActual('@core/app/constants/addOn'),
  getAddOnInfo: (...args: any[]) => mockGetAddOnInfo(...args),
}));

jest.mock('@core/helpers/api/swiftray-client', () => ({
  swiftrayClient: {
    on: (...args: any[]) => mockSwiftrayOn(...args),
    off: (...args: any[]) => mockSwiftrayOff(...args),
    checkVersion: () => true,
  },
}));

jest.mock('./promark/promark-data-store', () => ({
  __esModule: true,
  default: { get: (...args: any[]) => mockPromarkGet(...args) },
}));

jest.mock('@core/app/svgedit/selection', () => ({
  __esModule: true,
  default: { clearSelection: (...args: any[]) => mockClearSelection(...args) },
}));

jest.mock('@core/app/actions/message-caller', () => ({
  __esModule: true,
  default: {
    openMessage: (...args: any[]) => mockOpenMessage(...args),
    closeMessage: (...args: any[]) => mockCloseMessage(...args),
  },
  MessageLevel: { INFO: 'info', LOADING: 'loading', WARNING: 'warning' },
}));

// version checker: meetRequirement always false → skip job-origin machinery
jest.mock('@core/helpers/version-checker', () => ({
  __esModule: true,
  default: () => ({ meetRequirement: () => false }),
}));

// --- heavy transitive imports of framing.ts, stubbed so the worker/canvas chains don't load ---
jest.mock('@core/app/actions/beambox/export-funcs', () => ({
  __esModule: true,
  default: { getMetadata: jest.fn() },
}));
jest.mock('@core/app/actions/beambox/export-funcs-swiftray', () => ({
  fetchFramingTaskCode: jest.fn(),
}));
jest.mock('@core/helpers/symbol-helper/symbolMaker', () => ({
  __esModule: true,
  default: { switchImageSymbolForAll: jest.fn() },
}));
jest.mock('@core/helpers/image/svgStringToCanvas', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@core/helpers/api/utils-ws', () => ({ __esModule: true, default: jest.fn() }));

// Import AFTER mocks.
import FramingTaskManager from './framing';

const PROMARK_DEVICE = {
  model: 'fpm1',
  name: 'Promark Test',
  serial: 'PM-0001',
  version: '4.0.0',
} as any;

/**
 * Build a layer <g> with a given display attribute. The real SVG structure is a
 * `g.layer` group; getCoords only reads `getAttribute('display')` off it.
 */
const makeLayer = (id: string, display?: string): SVGGElement => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;

  g.setAttribute('class', 'layer');
  g.setAttribute('data-testid', id);

  if (display) g.setAttribute('display', display);

  return g;
};

/** IRect-shaped bbox helper. elem tag defaults to 'rect' so the (g && 0x0) guard is not hit. */
const bbox = (x: number, y: number, width: number, height: number, tag = 'rect') => ({
  bbox: { height, width, x, y },
  elem: { tagName: tag },
});

describe('framing.ts — getCoords frame-preview coordinate logic (via Promark Framing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // convertVariableText returns a revert callback (may be undefined-safe)
    mockConvertVariableText.mockResolvedValue(jest.fn());
    mockHasVariableText.mockReturnValue(false);
    // repeat > 0 for every layer so none are skipped by the repeat===0 guard
    mockGetData.mockReturnValue(1);
    // Promark, no rotary → getRotaryInfo returns null (skips rotary timer branch)
    mockGetRotaryInfo.mockReturnValue(null);
    mockGetAddOnInfo.mockReturnValue({ redLight: false });
    mockCheckDeviceStatus.mockResolvedValue(true);
    mockStartFraming.mockResolvedValue(undefined);
    // no red-dot calibration → skip applyRedDot path
    mockPromarkGet.mockReturnValue({ redDot: null });
  });

  /** Extract the [minX,minY]/[maxX,maxY] corner pair passed to deviceMaster.startFraming. */
  const runFramingAndGetPoints = async (): Promise<Array<[number, number]>> => {
    const manager = new FramingTaskManager(PROMARK_DEVICE);

    await manager.startFraming(FramingType.Framing, {});
    expect(mockStartFraming).toHaveBeenCalledTimes(1);

    return mockStartFraming.mock.calls[0][0].points;
  };

  test('hidden layer (display="none") is excluded from the frame extents', async () => {
    const visibleA = makeLayer('visA');
    const visibleB = makeLayer('visB');
    const hiddenC = makeLayer('hiddenC', 'none');

    mockGetAllLayers.mockReturnValue([visibleA, visibleB, hiddenC]);
    // getCoords calls getVisibleElementsAndBBoxes([layer]) once per *visible* layer.
    // The hidden layer is filtered by the display check before this mock is ever asked,
    // so we route by the layer that was passed in.
    mockGetVisibleElementsAndBBoxes.mockImplementation(([layer]: SVGGElement[]) => {
      if (layer === visibleA) return [bbox(100, 200, 50, 80)]; // right 150, bottom 280
      if (layer === visibleB) return [bbox(400, 100, 200, 60)]; // right 600, bottom 160
      if (layer === hiddenC) return [bbox(1000, 1000, 500, 500)]; // MUST NOT be counted

      return [];
    });

    const points = await runFramingAndGetPoints();

    // Union of A+B only: minX=100,minY=100,maxX=600,maxY=280 → ÷dpmm(10)
    expect(points[0]).toEqual([10, 10]); // [minX, minY]
    expect(points[1]).toEqual([60, 28]); // [maxX, maxY]

    // Proof the hidden layer was never even queried for its bbox.
    const queriedLayers = mockGetVisibleElementsAndBBoxes.mock.calls.map((c) => c[0][0]);

    expect(queriedLayers).toContain(visibleA);
    expect(queriedLayers).toContain(visibleB);
    expect(queriedLayers).not.toContain(hiddenC);
  });

  test('making the third layer visible expands the frame accordingly', async () => {
    const visibleA = makeLayer('visA');
    const visibleB = makeLayer('visB');
    const nowVisibleC = makeLayer('visC'); // no display="none" this time

    mockGetAllLayers.mockReturnValue([visibleA, visibleB, nowVisibleC]);
    mockGetVisibleElementsAndBBoxes.mockImplementation(([layer]: SVGGElement[]) => {
      if (layer === visibleA) return [bbox(100, 200, 50, 80)];
      if (layer === visibleB) return [bbox(400, 100, 200, 60)];
      if (layer === nowVisibleC) return [bbox(1000, 1000, 500, 500)]; // right 1500, bottom 1500

      return [];
    });

    const points = await runFramingAndGetPoints();

    // Union of A+B+C: minX=100,minY=100,maxX=1500,maxY=1500 → ÷10
    expect(points[0]).toEqual([10, 10]);
    expect(points[1]).toEqual([150, 150]);
  });

  test('exclusion is driven by the display attribute, not element absence (same scene, toggled)', async () => {
    const layerA = makeLayer('a');
    const layerToggle = makeLayer('toggle', 'none'); // starts hidden

    mockGetAllLayers.mockReturnValue([layerA, layerToggle]);
    mockGetVisibleElementsAndBBoxes.mockImplementation(([layer]: SVGGElement[]) => {
      if (layer === layerA) return [bbox(100, 100, 100, 100)]; // right/bottom 200
      if (layer === layerToggle) return [bbox(500, 500, 100, 100)]; // right/bottom 600

      return [];
    });

    // hidden → only A counts: [10,10]..[20,20]
    const hiddenManager = new FramingTaskManager(PROMARK_DEVICE);

    await hiddenManager.startFraming(FramingType.Framing, {});
    expect(mockStartFraming.mock.calls[0][0].points[1]).toEqual([20, 20]);

    // Toggle visible by removing the attribute — identical DOM elements otherwise.
    layerToggle.removeAttribute('display');
    mockStartFraming.mockClear();

    const shownManager = new FramingTaskManager(PROMARK_DEVICE);

    await shownManager.startFraming(FramingType.Framing, {});
    // now A+toggle: max becomes 600 → 60
    expect(mockStartFraming.mock.calls[0][0].points[1]).toEqual([60, 60]);
  });

  test('all layers hidden → no content, framing is treated as empty (never sent to device)', async () => {
    const hidden1 = makeLayer('h1', 'none');
    const hidden2 = makeLayer('h2', 'none');

    mockGetAllLayers.mockReturnValue([hidden1, hidden2]);
    mockGetVisibleElementsAndBBoxes.mockReturnValue([bbox(100, 100, 100, 100)]);

    const manager = new FramingTaskManager(PROMARK_DEVICE);
    const result = await manager.startFraming(FramingType.Framing, {});

    // getCoords leaves minX undefined → generateTaskPoints returns [] → isEmpty → returns false
    expect(result).toBe(false);
    expect(mockStartFraming).not.toHaveBeenCalled();
    // getVisibleElementsAndBBoxes never consulted because both layers were display-filtered
    expect(mockGetVisibleElementsAndBBoxes).not.toHaveBeenCalled();
    // user is told to add content first
    expect(mockOpenMessage).toHaveBeenCalledWith(expect.objectContaining({ key: 'no-element-to-frame' }));
  });

  test('layers with repeat === 0 are excluded even when visible', async () => {
    const active = makeLayer('active');
    const disabled = makeLayer('disabled'); // visible, but repeat 0

    mockGetAllLayers.mockReturnValue([active, disabled]);
    // getData(layer,'repeat'): 0 for the disabled layer, 1 for the active one
    mockGetData.mockImplementation((layer: SVGGElement) => (layer === disabled ? 0 : 1));
    mockGetVisibleElementsAndBBoxes.mockImplementation(([layer]: SVGGElement[]) => {
      if (layer === active) return [bbox(100, 100, 100, 100)]; // right/bottom 200
      if (layer === disabled) return [bbox(1000, 1000, 500, 500)];

      return [];
    });

    const points = await runFramingAndGetPoints();

    // only the active layer counts → [10,10]..[20,20]
    expect(points[0]).toEqual([10, 10]);
    expect(points[1]).toEqual([20, 20]);
    expect(mockGetVisibleElementsAndBBoxes.mock.calls.map((c) => c[0][0])).not.toContain(disabled);
  });

  test('extents are clamped to the workarea bounds', async () => {
    const layer = makeLayer('overflow');

    mockGetAllLayers.mockReturnValue([layer]);
    // bbox reaching negative minX and past workarea width(3000)/maxY(2100)
    mockGetVisibleElementsAndBBoxes.mockReturnValue([bbox(-50, -30, 4000, 3000)]);

    const points = await runFramingAndGetPoints();

    // minX clamped to 0, minY clamped to workareaMinY(0); maxX clamped to 3000, maxY to 2100.
    // ÷dpmm(10): [0,0]..[300,210]
    expect(points[0]).toEqual([0, 0]);
    expect(points[1]).toEqual([300, 210]);
  });

  test('empty g elements with zero size are ignored (g && 0x0 guard)', async () => {
    const layer = makeLayer('mixed');

    mockGetAllLayers.mockReturnValue([layer]);
    mockGetVisibleElementsAndBBoxes.mockReturnValue([
      bbox(0, 0, 0, 0, 'g'), // empty group — must be skipped
      bbox(100, 100, 100, 100, 'rect'), // real content
    ]);

    const points = await runFramingAndGetPoints();

    // Only the rect counts: [10,10]..[20,20]. If the 0x0 g were counted, minX/minY would be 0.
    expect(points[0]).toEqual([10, 10]);
    expect(points[1]).toEqual([20, 20]);
  });
});
