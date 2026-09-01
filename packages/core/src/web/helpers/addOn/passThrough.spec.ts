import type { AddOnInfo } from '@core/app/constants/addOn';

import { checkPassThrough, disablePassThrough, enablePassThrough, getPassThrough } from './passThrough';

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

describe('pass-through add-on', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('checks support from explicit or current add-on info', () => {
    expect(checkPassThrough({ addOnInfo: { passThrough: false } as unknown as AddOnInfo })).toBe(false);

    mockGetState.mockReturnValue({ workarea: 'ado1' });
    mockGetAddOnInfo.mockReturnValue({ passThrough: {} });

    expect(checkPassThrough()).toBe(true);
    expect(mockGetAddOnInfo).toHaveBeenCalledWith('ado1');
  });

  test('requires the document toggle and open-bottom mode when applicable', () => {
    const addOnInfo = { openBottom: true, passThrough: {} } as unknown as AddOnInfo;

    mockGetState.mockReturnValue({ borderless: false, 'pass-through': true });
    expect(getPassThrough({ addOnInfo })).toBe(false);
    expect(getPassThrough({ addOnInfo, values: { borderless: true } })).toBe(true);
    expect(getPassThrough({ addOnInfo, values: { borderless: true, passThrough: false } })).toBe(false);
  });

  test('enables and disables through the supplied updater', () => {
    const update = jest.fn();

    enablePassThrough({ update });
    disablePassThrough({ update });

    expect(update).toHaveBeenNthCalledWith(1, { 'pass-through': true });
    expect(update).toHaveBeenNthCalledWith(2, { 'pass-through': false });
  });
});
