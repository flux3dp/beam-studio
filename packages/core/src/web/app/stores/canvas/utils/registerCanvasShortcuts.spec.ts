import { CanvasMode } from '@core/app/constants/canvasMode';

import { registerCanvasShortcuts } from './registerCanvasShortcuts';

const handlers: Record<string, () => void> = {};
const mockUnsubscribe = jest.fn();

jest.mock('@core/helpers/shortcuts', () => ({
  on: (keys: string[], handler: () => void) => {
    keys.forEach((key) => {
      handlers[key] = handler;
    });

    return mockUnsubscribe;
  },
}));

const mockIsAtPage = jest.fn();

jest.mock('@core/helpers/hashHelper', () => ({ isAtPage: () => mockIsAtPage() }));

const mockIsInnerEngravingActive = jest.fn();

jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  isInnerEngravingActive: () => mockIsInnerEngravingActive(),
}));

const mockSetMouseMode = jest.fn();

jest.mock('./mouseMode', () => ({ setMouseMode: (...args: unknown[]) => mockSetMouseMode(...args) }));

const mockToggleDrawerMode = jest.fn();
const mockGetState = jest.fn();

jest.mock('../canvasStore', () => ({ useCanvasStore: { getState: () => mockGetState() } }));

const mockImportImage = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({ importImage: () => mockImportImage() }));

describe('registerCanvasShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAtPage.mockReturnValue(true);
    mockIsInnerEngravingActive.mockReturnValue(false);
    mockGetState.mockReturnValue({ mode: CanvasMode.Draw, toggleDrawerMode: mockToggleDrawerMode });
    registerCanvasShortcuts();
  });

  test('the drawing tools switch the mouse mode on the 2D canvas', () => {
    handlers.m();
    expect(mockSetMouseMode).toHaveBeenLastCalledWith('rect');
    handlers.c();
    expect(mockSetMouseMode).toHaveBeenLastCalledWith('ellipse');
    handlers.p();
    expect(mockSetMouseMode).toHaveBeenLastCalledWith('path');
    handlers['\\']();
    expect(mockSetMouseMode).toHaveBeenLastCalledWith('line');
    expect(mockSetMouseMode).toHaveBeenCalledTimes(4);
  });

  test('the drawing tools are ignored in inner engraving, the other shortcuts still work', () => {
    mockIsInnerEngravingActive.mockReturnValue(true);

    handlers.m();
    handlers.c();
    handlers.p();
    handlers['\\']();
    expect(mockSetMouseMode).not.toHaveBeenCalled();

    handlers.v();
    expect(mockSetMouseMode).toHaveBeenLastCalledWith('select');
    handlers.e();
    expect(mockToggleDrawerMode).toHaveBeenCalledWith('element-panel');
    handlers.i();
    expect(mockImportImage).toHaveBeenCalledTimes(1);
  });

  test('nothing fires outside the draw mode', () => {
    mockGetState.mockReturnValue({ mode: CanvasMode.Preview, toggleDrawerMode: mockToggleDrawerMode });

    handlers.m();
    handlers.v();
    expect(mockSetMouseMode).not.toHaveBeenCalled();
  });
});
