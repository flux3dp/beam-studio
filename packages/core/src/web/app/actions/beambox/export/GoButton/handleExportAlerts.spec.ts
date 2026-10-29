import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

import { handleExportAlerts } from './handleExportAlerts';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
}));

const mockExecuteFirmwareUpdate = jest.fn();

jest.mock('@core/app/actions/beambox/menuDeviceActions', () => ({
  executeFirmwareUpdate: (...args: any[]) => mockExecuteFirmwareUpdate(...args),
}));

jest.mock('@core/app/actions/canvas/curveEngravingModeController', () => ({ hasArea: () => false }));
jest.mock('@core/app/actions/dialog-caller', () => ({ showConfirmPromptDialog: jest.fn() }));
jest.mock('@core/helpers/addOn', () => ({ getAutoFeeder: () => false }));
jest.mock('@core/helpers/addOn/innerEngraving', () => ({ isInnerEngravingActive: () => false }));
jest.mock('@core/helpers/api/swiftray-client', () => ({ swiftrayClient: { checkVersion: () => true } }));
jest.mock('@core/helpers/symbol-helper/symbolMaker', () => ({ switchImageSymbolForAll: jest.fn() }));
// shared __mocks__ stub returns 'configName' for every key; read the two keys this check needs
jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (layer: Element, key: string) =>
    key === 'module' ? Number(layer.getAttribute('data-module') || 15) : Number(layer.getAttribute(`data-${key}`) || 0),
}));
jest.mock('@core/helpers/layer/layer-helper', () => ({ getLayerName: jest.fn() }));
jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({ hasModuleLayer: () => false }));
// never reached (inner engraving is off for these models); importing it drags undoManager → camera.ts → p-queue ESM
jest.mock('./checkInnerEngravingObjects', () => ({
  checkInnerEngravingObjects: jest.fn(),
  hasInnerEngravingObjectWarnings: () => false,
}));

const mockShowPromarkSettings = jest.fn();

jest.mock('@core/app/components/dialogs/promark/PromarkSettings', () => ({
  showPromarkSettings: (...args: any[]) => mockShowPromarkSettings(...args),
}));

jest.mock('@core/app/components/dialogs/promark/useLensProfiles', () => ({
  describeLensProfileKey: ({ workarea }: { workarea: number }) => `${workarea} mm`,
}));

const mockGetDocumentLensProfile = jest.fn();

jest.mock('@core/helpers/device/promark/lens-profiles', () => ({
  getDocumentLensProfile: (...args: any[]) => mockGetDocumentLensProfile(...args),
}));

jest.mock('@core/helpers/device/promark/promark-data-store', () => ({
  get: () => ({ laserType: 1, watt: 20 }),
}));

const mockRead = jest.fn();
const mockWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args: any[]) => mockRead(...args),
  write: (...args: any[]) => mockWrite(...args),
}));

const lang = {
  beambox: { popup: {} },
  topbar: { alerts: { laser_frequency_unavailable: 'laser_frequency_unavailable' } },
} as unknown as ILang;

const setLayer = (attrs: Record<string, string>) => {
  // innerHTML would lowercase data-laserFrequency, the app writes it with setAttribute
  document.body.innerHTML = '<svg id="svgcontent"><g class="layer"></g></svg>';

  const layer = document.querySelector('g.layer')!;

  Object.entries(attrs).forEach(([key, value]) => layer.setAttribute(key, value));
};

const laserFrequencyAlerts = () =>
  mockPopUp.mock.calls.filter(([args]) => args.message === 'laser_frequency_unavailable');

describe('test handleExportAlerts laser frequency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // every "don't show again" alert is skipped, so only the frequency alert can show
    mockRead.mockReturnValue(true);
  });

  it('should block and offer firmware update on old firmware', async () => {
    setLayer({ 'data-laserFrequency': '72' });
    mockPopUp.mockImplementation(({ onConfirm }) => onConfirm());

    const device = { model: 'fbm2', version: '6.5.2' } as IDeviceInfo;

    expect(await handleExportAlerts(device, lang)).toBe(false);
    expect(laserFrequencyAlerts()).toHaveLength(1);
    expect(mockExecuteFirmwareUpdate).toHaveBeenCalledWith(device);
  });

  it.each([
    ['firmware meets requirement', 'fbm2', '6.5.3', { 'data-laserFrequency': '72' }],
    ['unsupported device model', 'ado1', '5.3.9', { 'data-laserFrequency': '72' }],
    ['layer off', 'fbm2', '6.5.2', { 'data-laserFrequency': '0' }],
    ['non-CO2 module', 'fbm2', '6.5.2', { 'data-laserFrequency': '72', 'data-module': '4' }],
    ['hidden layer', 'fbm2', '6.5.2', { 'data-laserFrequency': '72', display: 'none' }],
  ])('should not alert for %s', async (_, model, version, attrs) => {
    setLayer(attrs);

    await handleExportAlerts({ model, version } as IDeviceInfo, lang);
    expect(laserFrequencyAlerts()).toHaveLength(0);
  });
});

const promark = { model: 'fpm1', serial: 'serial', version: '5.0.0' } as IDeviceInfo;
const key = { innerEngraving: false, workarea: 110 };

describe('test handleExportAlerts lens profile warning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    mockRead.mockReturnValue(false);
    mockGetDocumentLensProfile.mockReturnValue({ key, source: 'fallback' });
  });

  test('warns when the document lens has only factory values', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[1]());

    expect(await handleExportAlerts(promark, i18n.lang)).toBe(true);
    expect(mockGetDocumentLensProfile).toHaveBeenCalledWith('serial');
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp.mock.lastCall[0]).toMatchObject({
      buttonLabels: ['Go to Settings', 'Skip'],
      caption: 'Distortion Parameters Not Set',
      message:
        'No distortion parameters have been saved for 110 mm. The job will use factory values, so the result may be distorted.',
    });
    expect(mockWrite).not.toHaveBeenCalled();
  });

  test('Go to Settings cancels the job and opens the settings', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[0]());

    expect(await handleExportAlerts(promark, i18n.lang)).toBe(false);
    expect(mockShowPromarkSettings).toHaveBeenCalledWith(promark);
  });

  test('closing the warning cancels the job without opening the settings', async () => {
    mockPopUp.mockImplementation(({ onClose }) => onClose());

    expect(await handleExportAlerts(promark, i18n.lang)).toBe(false);
    expect(mockShowPromarkSettings).not.toHaveBeenCalled();
  });

  test('"Don\'t show again" with Skip stops the warning', async () => {
    mockPopUp.mockImplementation(({ checkbox }) => checkbox.callbacks[1]());

    expect(await handleExportAlerts(promark, i18n.lang)).toBe(true);
    expect(mockWrite).toHaveBeenCalledWith('skip-lens-not-calibrated-warning', true);

    mockRead.mockImplementation((alertKey) => alertKey === 'skip-lens-not-calibrated-warning');
    mockPopUp.mockClear();
    expect(await handleExportAlerts(promark, i18n.lang)).toBe(true);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test.each(['exact', 'default', 'legacy'])('no warning when the lens is %s', async (source) => {
    mockGetDocumentLensProfile.mockReturnValue({ key, source });

    expect(await handleExportAlerts(promark, i18n.lang)).toBe(true);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('other machines are not checked', async () => {
    await handleExportAlerts({ model: 'fbm1', serial: 'serial', version: '5.0.0' } as IDeviceInfo, i18n.lang);
    expect(mockGetDocumentLensProfile).not.toHaveBeenCalled();
  });
});
