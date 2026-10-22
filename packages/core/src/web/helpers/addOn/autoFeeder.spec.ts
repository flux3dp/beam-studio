import type { AddOnInfo } from '@core/app/constants/addOn';

import { checkAutoFeeder, disableAutoFeeder, enableAutoFeeder, getAutoFeeder } from './autoFeeder';

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

const mockGetAddOnInfo = jest.fn();

jest.mock('@core/app/constants/addOn', () => ({
  getAddOnInfo: (...args: unknown[]) => mockGetAddOnInfo(...args),
}));

describe('auto feeder add-on', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('checks support from explicit or current add-on info', () => {
    expect(checkAutoFeeder({ addOnInfo: { autoFeeder: false } as unknown as AddOnInfo })).toBe(false);

    mockGetState.mockReturnValue({ workarea: 'ado1' });
    mockGetAddOnInfo.mockReturnValue({ autoFeeder: {} });

    expect(checkAutoFeeder()).toBe(true);
    expect(mockGetAddOnInfo).toHaveBeenCalledWith('ado1');
  });

  test('requires the document toggle and open-bottom mode when applicable', () => {
    const addOnInfo = { autoFeeder: {}, openBottom: true } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ 'auto-feeder': true, borderless: false });
    expect(getAutoFeeder({ addOnInfo })).toBe(false);
    expect(getAutoFeeder({ addOnInfo, values: { borderless: true } })).toBe(true);
    expect(getAutoFeeder({ addOnInfo, values: { autoFeeder: false, borderless: true } })).toBe(false);
  });

  test('enables and disables through the supplied updater', () => {
    const update = jest.fn();

    enableAutoFeeder({ update });
    disableAutoFeeder({ update });

    expect(update).toHaveBeenNthCalledWith(1, { 'auto-feeder': true });
    expect(update).toHaveBeenNthCalledWith(2, { 'auto-feeder': false });
  });
});
