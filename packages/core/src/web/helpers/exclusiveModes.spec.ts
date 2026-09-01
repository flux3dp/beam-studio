import type { AddOnInfo } from '@core/app/constants/addOn';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { LaserType } from '@core/app/constants/promark-constants';

const mockDocumentState = {
  'auto-feeder': false,
  borderless: false,
  'inner-engraving': false,
  'pass-through': false,
  rotary_mode: false,
  workarea: 'fbb2',
};
const mockChangeMultipleDocumentStoreValues = jest.fn();
const mockDocumentSubscribe = jest.fn(() => jest.fn());

jest.mock('@core/app/stores/documentStore', () => ({
  changeMultipleDocumentStoreValues: mockChangeMultipleDocumentStoreValues,
  useDocumentStore: {
    getState: () => mockDocumentState,
    subscribe: mockDocumentSubscribe,
  },
}));

const mockCanvasState = { mode: CanvasMode.Draw };
const mockCanvasSubscribe = jest.fn(() => jest.fn());

jest.mock('@core/app/stores/canvas/canvasStore', () => ({
  useCanvasStore: {
    getState: () => mockCanvasState,
    subscribe: mockCanvasSubscribe,
  },
}));

const mockCurveState = { hasData: false };
const mockCurveSubscribe = jest.fn(() => jest.fn());

jest.mock('@core/app/stores/curveEngravingStore', () => ({
  setCurveEngravingState: jest.fn(),
  useCurveEngravingStore: {
    getState: () => mockCurveState,
    subscribe: mockCurveSubscribe,
  },
}));

const mockGetAddOnInfo = jest.fn();

jest.mock('@core/app/constants/addOn', () => ({
  getAddOnInfo: (...args: unknown[]) => mockGetAddOnInfo(...args),
}));

const mockGetPromarkInfo = jest.fn();
const mockSetPromarkInfo = jest.fn();

jest.mock('@core/helpers/device/promark/promark-info', () => ({
  getPromarkInfo: () => mockGetPromarkInfo(),
  setPromarkInfo: (...args: unknown[]) => mockSetPromarkInfo(...args),
}));

jest.mock('@core/helpers/checkFeature', () => ({
  checkBM2: () => false,
  checkBM2CurveEngraving: () => false,
  checkBM2UV: () => false,
  checkBM24C: () => false,
  checkFpm1: () => true,
  checkFpm1UV: () => true,
  checkFUV1: () => false,
  checkHxRf: () => false,
}));

jest.mock('@core/app/actions/canvas/rotary-axis', () => ({ getPosition: jest.fn() }));

import { registerCurveEngravingRuntimeCleanup } from './addOn/curveEngraving';
import {
  applyExclusiveModePatch,
  canEnableExclusiveMode,
  getActiveExclusiveMode,
  setExclusiveMode,
  subscribeExclusiveModeGate,
} from './exclusiveModes';

const allAddOns = {
  autoFeeder: {},
  curveEngraving: {},
  innerEngraving: {},
  passThrough: {},
  rotary: {},
} as unknown as AddOnInfo;

describe('exclusive modes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockDocumentState, {
      'auto-feeder': false,
      borderless: false,
      'inner-engraving': false,
      'pass-through': false,
      rotary_mode: false,
      workarea: 'fbb2',
    });
    mockCanvasState.mode = CanvasMode.Draw;
    mockCurveState.hasData = false;
    mockGetAddOnInfo.mockReturnValue(allAddOns);
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });
  });

  test('builds an exclusive draft without touching the live document or curve runtime', () => {
    const cleanup = jest.fn();
    const patch = {};

    registerCurveEngravingRuntimeCleanup(cleanup);
    expect(applyExclusiveModePatch(patch, 'rotary', true, { addOnInfo: allAddOns })).toBe(true);
    expect(patch).toEqual({
      'auto-feeder': false,
      'inner-engraving': false,
      'pass-through': false,
      rotary_mode: true,
    });
    expect(cleanup).not.toHaveBeenCalled();
    expect(mockChangeMultipleDocumentStoreValues).not.toHaveBeenCalled();
  });

  test('force-applying a live mode clears conflicting runtime data', () => {
    const cleanup = jest.fn();
    const update = jest.fn();

    registerCurveEngravingRuntimeCleanup(cleanup);
    mockCurveState.hasData = true;
    expect(setExclusiveMode('rotary', true, { addOnInfo: allAddOns, update })).toBe(true);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      'auto-feeder': false,
      'inner-engraving': false,
      'pass-through': false,
      rotary_mode: true,
    });
  });

  test('inner engraving activation applies both its flag and UV PromarkInfo', () => {
    const promarkInfo = { laserType: LaserType.UV, watt: 5 } as const;
    const update = jest.fn();

    expect(
      setExclusiveMode('inner-engraving', true, {
        addOnInfo: allAddOns,
        promarkInfo,
        update,
        workarea: 'fpm1',
      }),
    ).toBe(true);
    expect(mockSetPromarkInfo).toHaveBeenCalledWith(promarkInfo);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ 'inner-engraving': true, rotary_mode: false }));
  });

  test('gates a supported mode when another effective mode is active', () => {
    const context = { addOnInfo: allAddOns, values: { rotary_mode: true } };

    expect(getActiveExclusiveMode(context)).toBe('rotary');
    expect(canEnableExclusiveMode('curve-engraving', context)).toBe(false);
    expect(canEnableExclusiveMode('rotary', context)).toBe(true);
  });

  test('owns all subscriptions used by an imperative gate', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeExclusiveModeGate('curve-engraving', listener);

    expect(mockDocumentSubscribe).toHaveBeenCalledTimes(1);
    expect(mockCanvasSubscribe).toHaveBeenCalledTimes(1);
    expect(mockCurveSubscribe).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(mockDocumentSubscribe.mock.results[0].value).toHaveBeenCalledTimes(1);
    expect(mockCanvasSubscribe.mock.results[0].value).toHaveBeenCalledTimes(1);
    expect(mockCurveSubscribe.mock.results[0].value).toHaveBeenCalledTimes(1);
  });
});
