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
jest.mock('@core/app/actions/dialog-caller', () => ({}));
jest.mock('@core/helpers/api/alert-config', () => ({ read: () => true }));
jest.mock('@core/helpers/api/swiftray-client', () => ({ swiftrayClient: {} }));
jest.mock('@core/helpers/symbol-helper/symbolMaker', () => ({ switchImageSymbolForAll: jest.fn() }));
// shared __mocks__ stub returns 'configName' for every key; read the two keys this check needs
jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (layer: Element, key: string) =>
    key === 'module' ? Number(layer.getAttribute('data-module') || 15) : Number(layer.getAttribute(`data-${key}`) || 0),
}));
jest.mock('@core/helpers/layer/layer-helper', () => ({ getLayerName: jest.fn() }));
jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({ hasModuleLayer: () => false }));

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
