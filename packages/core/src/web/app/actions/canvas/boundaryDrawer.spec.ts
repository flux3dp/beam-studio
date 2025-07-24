import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

jest.useFakeTimers();

const registeredEvents: any = { store: {} };

const defaultBeamboxPreference = {
  borderless: false,
  diode_offset_x: 70,
  diode_offset_y: 7,
  'enable-diode': false,
  'enable-uv-print-file': false,
  rotary_mode: false,
  'use-real-boundary': false,
  'use-union-boundary': true,
};
const mockBeamboxPreference = { ...defaultBeamboxPreference };
const mockRead = jest.fn().mockImplementation((key) => mockBeamboxPreference[key]);

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: mockRead,
}));

const mockGetModuleBoundary = jest.fn();

jest.mock('@core/app/constants/layer-module/module-boundary', () => ({
  getModuleBoundary: mockGetModuleBoundary,
}));

const mockState = { diode: { value: 0 }, module: { value: 15 } };
const mockGetStore = jest.fn().mockReturnValue(mockState);

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: {
    getState: mockGetStore,
    subscribe: (selector: any, listener: any) => {
      const key = selector({ diode: { value: 'diode' }, module: { value: 'module' }, repeat: 'repeat' });

      registeredEvents.store[key] = listener;
    },
  },
}));

const defaultWorkarea = {
  bb2: {
    expansion: [0, 0],
    height: 3750,
    maxY: 3750,
    minY: 0,
    model: 'fbb2',
    width: 6000,
  },
  bm1: {
    expansion: [0, 0],
    height: 2100,
    maxY: 2100,
    minY: 0,
    model: 'fbm1',
    width: 3000,
  },
  bm2: {
    expansion: [400, 0],
    height: 2800,
    maxY: 2400,
    minY: -400,
    model: 'fbm2',
    width: 3600,
  },
  bm2NoExpansion: {
    expansion: [0, 0],
    height: 2400,
    maxY: 2400,
    minY: 0,
    model: 'fbm2',
    width: 3600,
  },
};
const mockWorkarea = Object.assign({}, defaultWorkarea.bb2);

jest.mock('@core/app/svgedit/workarea', () => mockWorkarea);

const mockGetAutoFeeder = jest.fn();
const mockGetPassThrough = jest.fn();

jest.mock('@core/helpers/addOn', () => ({
  getAutoFeeder: mockGetAutoFeeder,
  getPassThrough: mockGetPassThrough,
}));

const mockGetModuleOffsets = jest.fn();

jest.mock('@core/helpers/device/moduleOffsets', () => ({
  getModuleOffsets: mockGetModuleOffsets,
}));

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (key: string) => {
    registeredEvents[key] = {};

    return {
      on: (event: string, listener: any) => {
        registeredEvents[key][event] = listener;
      },
    };
  },
}));

const mockHasModuleLayer = jest.fn();

jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({
  hasModuleLayer: mockHasModuleLayer,
}));

import type { BoundaryDrawer } from './boundaryDrawer';

let boundaryDrawer: BoundaryDrawer;

const resetBoundaryDrawer = async () => {
  jest.resetModules();
  // @ts-ignore
  ({ boundaryDrawer } = await import('./boundaryDrawer'));
  expect(mockRead).toHaveBeenNthCalledWith(1, 'use-real-boundary');
  expect(mockRead).toHaveBeenNthCalledWith(2, 'use-union-boundary');
  jest.clearAllMocks();
  boundaryDrawer.registerEvents();
};

const expectBoundaryResult = (d: string) => {
  const boundary = document.querySelector('#boundary-path');

  expect(boundary).toBeInTheDocument();
  expect(boundary).toHaveAttribute('d', d);
};

describe('test boundaryDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockBeamboxPreference, defaultBeamboxPreference);
    Object.assign(mockWorkarea, defaultWorkarea.bb2);
    Object.assign(mockState, { diode: { value: 0 }, module: { value: 15 } });
    mockGetModuleBoundary.mockReturnValue({ bottom: 0, left: 0, right: 0, top: 0 });
    mockGetAutoFeeder.mockReturnValue(false);
    mockGetPassThrough.mockReturnValue(false);
    mockGetModuleOffsets.mockReturnValue([0, 0]);
    mockHasModuleLayer.mockReturnValue(false);
    document.body.innerHTML = '<svg id="canvasBackground"><svg id="fixedSizeSvg"></svg>';
  });

  test('update without boundary', async () => {
    await resetBoundaryDrawer();
    registeredEvents.canvas['canvas-change']();
    jest.advanceTimersByTime(100);
    // auto feeder
    expect(mockGetAutoFeeder).toHaveBeenCalledTimes(2);
    expect(boundaryDrawer.boundaries.autoFeeder).toBeUndefined();
    // pass through
    expect(mockGetPassThrough).toHaveBeenCalledTimes(1);
    expect(boundaryDrawer.boundaries.passThrough).toBeUndefined();
    // open bottom
    expect(mockRead).toHaveBeenNthCalledWith(1, 'borderless');
    expect(boundaryDrawer.boundaries.openBottom).toBeUndefined();
    // uv print
    expect(mockRead).toHaveBeenNthCalledWith(2, 'enable-uv-print-file');
    expect(boundaryDrawer.boundaries.uvPrint).toBeUndefined();
    // module
    expect(mockGetModuleBoundary).toHaveBeenNthCalledWith(1, 'fbb2', LayerModule.LASER_UNIVERSAL);
    expect(boundaryDrawer.boundaries.module).toEqual({ bottom: 0, left: 0, right: 0, top: 0 });
    // diode
    expect(mockRead).toHaveBeenNthCalledWith(3, 'enable-diode');
    expect(boundaryDrawer.boundaries.diode).toBeUndefined();
    // final boundary
    expect(mockRead).toHaveBeenNthCalledWith(4, 'rotary_mode');
    expect(mockGetModuleOffsets).toHaveBeenNthCalledWith(1, { module: LayerModule.LASER_UNIVERSAL, workarea: 'fbb2' });
    expectBoundaryResult('');
  });

  test('show boundary with auto feeder', async () => {
    await resetBoundaryDrawer();
    mockGetAutoFeeder.mockReturnValue(true);
    registeredEvents['beambox-preference']['auto-feeder']();
    jest.advanceTimersByTime(100);
    expect(mockGetAutoFeeder).toHaveBeenCalledTimes(2);
    expect(boundaryDrawer.boundaries.autoFeeder).toEqual({ bottom: 0, left: 1000, right: 1000, top: 0 });
    expectBoundaryResult('M0,0H6000V3750H0ZM1000,0H5000V3750H1000Z');
  });

  test('show boundary with pass through', async () => {
    await resetBoundaryDrawer();
    mockGetPassThrough.mockReturnValue(true);
    mockWorkarea.expansion = [0, 123];
    mockWorkarea.height = 3750 + 123;
    mockWorkarea.maxY = 3750 + 123;
    registeredEvents['beambox-preference']['pass-through']();
    jest.advanceTimersByTime(100);
    expect(mockGetPassThrough).toHaveBeenCalledTimes(1);
    expect(boundaryDrawer.boundaries.passThrough).toEqual({ bottom: 123, left: 1000, right: 1000, top: 0 });
    expectBoundaryResult('M0,0H6000V3873H0ZM1000,0H5000V3700H1000Z');
  });

  test('show boundary with open bottom', async () => {
    await resetBoundaryDrawer();
    Object.assign(mockWorkarea, defaultWorkarea.bm1);
    mockBeamboxPreference.borderless = true;
    registeredEvents['beambox-preference']['borderless']();
    jest.advanceTimersByTime(100);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'borderless');
    expect(boundaryDrawer.boundaries.openBottom).toEqual({ bottom: 0, left: 0, right: 400, top: 0 });
    expectBoundaryResult('M0,0H3000V2100H0ZM0,0H2600V2100H0Z');
  });

  test('show boundary with uv print layer', async () => {
    await resetBoundaryDrawer();
    mockBeamboxPreference['enable-uv-print-file'] = true;
    mockState.module.value = LayerModule.UV_PRINT;
    registeredEvents.store['module']();
    jest.advanceTimersByTime(100);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'enable-uv-print-file');
    expect(boundaryDrawer.boundaries.uvPrint).toEqual({ bottom: 1650, left: 0, right: 3030, top: 0 });
    expectBoundaryResult('M0,0H6000V3750H0ZM0,0H2970V2100H0Z');
  });

  test('show boundary with single module', async () => {
    await resetBoundaryDrawer();
    Object.assign(mockWorkarea, defaultWorkarea.bm2NoExpansion);
    mockWorkarea.expansion = [0, 0];
    mockState.module.value = LayerModule.UV_WHITE_INK;
    mockGetModuleBoundary.mockReturnValue({ bottom: 11.1, left: 22.2, right: 33.3, top: 44.4 });
    mockGetModuleOffsets.mockReturnValue([-12.5, -12.5]);
    registeredEvents.store['module']();
    jest.advanceTimersByTime(100);
    expect(mockGetModuleBoundary).toHaveBeenNthCalledWith(1, 'fbm2', LayerModule.UV_WHITE_INK);
    expect(boundaryDrawer.boundaries.module).toEqual({ bottom: 111, left: 222, right: 333, top: 444 });
    expect(mockGetModuleOffsets).toHaveBeenNthCalledWith(1, { module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' });
    expectBoundaryResult('M0,0H3600V2400H0ZM100,400H3100V2100H100Z');
  });

  test('show boundary with printer module', async () => {
    // compare with 'show boundary with single module'
    await resetBoundaryDrawer();
    Object.assign(mockWorkarea, defaultWorkarea.bm2NoExpansion);
    mockWorkarea.expansion = [0, 0];
    mockState.module.value = LayerModule.PRINTER_4C;
    mockGetModuleBoundary.mockReturnValue({ bottom: 11.1, left: 22.2, right: 33.3, top: 44.4 });
    mockGetModuleOffsets.mockReturnValue([-12.5, -12.5]);
    registeredEvents.store['module']();
    jest.advanceTimersByTime(100);
    expect(mockGetModuleBoundary).toHaveBeenNthCalledWith(1, 'fbm2', LayerModule.PRINTER_4C);
    expect(boundaryDrawer.boundaries.module).toEqual({ bottom: 111, left: 222, right: 333, top: 444 });
    expect(mockGetModuleOffsets).toHaveBeenNthCalledWith(1, { module: LayerModule.PRINTER_4C, workarea: 'fbm2' });
    expectBoundaryResult('M0,0H3600V2400H0ZM100,400H3100V2200H100Z');
  });

  test('show boundary with union module', async () => {
    // compare with 'show boundary with single module'
    mockBeamboxPreference['use-union-boundary'] = true;
    await resetBoundaryDrawer();
    Object.assign(mockWorkarea, defaultWorkarea.bm2NoExpansion);
    mockWorkarea.expansion = [0, 0];
    mockState.module.value = LayerModule.UV_WHITE_INK;
    mockGetModuleBoundary.mockImplementation((_, module) =>
      module === LayerModule.UV_WHITE_INK
        ? { bottom: 11.1, left: 22.2, right: 33.3, top: 44.4 }
        : { bottom: 21.1, left: 20.2, right: 43.3, top: 40.4 },
    );
    mockHasModuleLayer.mockImplementation(([module]) =>
      [LayerModule.LASER_1064, LayerModule.LASER_UNIVERSAL].includes(module),
    );
    mockGetModuleOffsets.mockImplementation(({ module }) =>
      module === LayerModule.UV_WHITE_INK ? [-12.5, -12.5] : [7.5, 7.5],
    );
    registeredEvents.canvas['canvas-change']();
    jest.advanceTimersByTime(100);
    expect(mockGetModuleBoundary).toHaveBeenCalledTimes(3);
    expect(mockGetModuleBoundary).toHaveBeenNthCalledWith(1, 'fbm2', LayerModule.UV_WHITE_INK);
    expect(mockGetModuleBoundary).toHaveBeenNthCalledWith(2, 'fbm2', LayerModule.LASER_UNIVERSAL);
    expect(mockGetModuleBoundary).toHaveBeenNthCalledWith(3, 'fbm2', LayerModule.LASER_1064);
    expect(mockHasModuleLayer).toHaveBeenCalledTimes(8);
    expect(mockHasModuleLayer).toHaveBeenNthCalledWith(1, [LayerModule.LASER_UNIVERSAL]);
    expect(mockHasModuleLayer).toHaveBeenNthCalledWith(2, [LayerModule.PRINTER_4C]);
    expect(mockHasModuleLayer).toHaveBeenNthCalledWith(3, [LayerModule.UV_VARNISH]);
    expect(mockHasModuleLayer).toHaveBeenNthCalledWith(4, [LayerModule.LASER_1064]);
    expect(boundaryDrawer.boundaries.module).toEqual({ bottom: 211, left: 222, right: 433, top: 444 });
    expect(mockGetModuleOffsets).toHaveBeenCalledTimes(3);
    expect(mockGetModuleOffsets).toHaveBeenNthCalledWith(1, { module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' });
    expect(mockGetModuleOffsets).toHaveBeenNthCalledWith(2, { module: LayerModule.LASER_UNIVERSAL, workarea: 'fbm2' });
    expect(mockGetModuleOffsets).toHaveBeenNthCalledWith(3, { module: LayerModule.LASER_1064, workarea: 'fbm2' });
    expectBoundaryResult('M0,0H3600V2400H0ZM300,600H3000V2000H300Z');
  });

  test('show boundary with diode module addon', async () => {
    await resetBoundaryDrawer();
    mockBeamboxPreference['enable-diode'] = true;
    Object.assign(mockWorkarea, defaultWorkarea.bm1);
    registeredEvents['beambox-preference']['enable-diode']();
    jest.advanceTimersByTime(100);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'enable-diode');
    expect(boundaryDrawer.boundaries.diode).toEqual({ bottom: 100, left: 0, right: 500, top: 0 });
    expectBoundaryResult('M0,0H3000V2100H0ZM0,0H2500V2000H0Z');
  });

  test('show boundary with diode module layer', async () => {
    await resetBoundaryDrawer();
    mockBeamboxPreference['enable-diode'] = true;
    mockState.diode.value = 1;
    Object.assign(mockWorkarea, defaultWorkarea.bm1);
    registeredEvents['beambox-preference']['enable-diode']();
    jest.advanceTimersByTime(100);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'enable-diode');
    expect(boundaryDrawer.boundaries.diode).toEqual({ bottom: 0, left: 700, right: 0, top: 70 });
    expectBoundaryResult('M0,0H3000V2100H0ZM700,100H3000V2100H700Z');
  });

  test('show boundary with multiple factors', async () => {
    // open bottom + diode
    await resetBoundaryDrawer();
    Object.assign(mockWorkarea, defaultWorkarea.bm1);
    mockBeamboxPreference.borderless = true;
    mockBeamboxPreference['enable-diode'] = true;
    mockState.diode.value = 1;
    registeredEvents.canvas['canvas-change']();
    jest.advanceTimersByTime(100);
    expect(boundaryDrawer.boundaries.openBottom).toEqual({ bottom: 0, left: 0, right: 400, top: 0 });
    expect(boundaryDrawer.boundaries.diode).toEqual({ bottom: 0, left: 700, right: 0, top: 70 });
    expectBoundaryResult('M0,0H3000V2100H0ZM700,100H2600V2100H700Z');
  });

  test('show boundary with top expansion', async () => {
    Object.assign(mockWorkarea, defaultWorkarea.bm2);
    await resetBoundaryDrawer();
    registeredEvents.canvas['canvas-change']();
    jest.advanceTimersByTime(100);
    expectBoundaryResult('M0,-400H3600V2400H0ZM0,0H3600V2400H0Z');
  });

  test('show real boundary', async () => {
    // compare with 'show boundary with single module'
    mockBeamboxPreference['use-real-boundary'] = true;
    await resetBoundaryDrawer();
    Object.assign(mockWorkarea, defaultWorkarea.bm2NoExpansion);
    mockWorkarea.expansion = [0, 0];
    mockState.module.value = LayerModule.UV_WHITE_INK;
    mockGetModuleBoundary.mockReturnValue({ bottom: 11.1, left: 22.2, right: 33.3, top: 44.4 });
    mockGetModuleOffsets.mockReturnValue([-12.5, -12.5]);
    registeredEvents.store['module']();
    jest.advanceTimersByTime(100);
    expect(mockGetModuleBoundary).toHaveBeenNthCalledWith(1, 'fbm2', LayerModule.UV_WHITE_INK);
    expect(boundaryDrawer.boundaries.module).toEqual({ bottom: 111, left: 222, right: 333, top: 444 });
    expect(mockGetModuleOffsets).toHaveBeenNthCalledWith(1, { module: LayerModule.UV_WHITE_INK, workarea: 'fbm2' });
    expectBoundaryResult('M0,0H3600V2400H0ZM97,319H3142V2164H97Z');
  });
});
