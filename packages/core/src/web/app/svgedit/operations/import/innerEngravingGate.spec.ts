const mockPopUp = jest.fn();
const mockSetPromarkInfo = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: unknown[]) => mockPopUp(...args) }));
jest.mock('@core/app/actions/canvas/innerEngravingMode', () => ({ switchInnerEngravingMode: jest.fn() }));
jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => ({ workarea: 'fpm1' }) },
}));
jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  isInnerEngravingActive: () => false,
  PROMARK_UV_INFO: { laserType: 2, watt: 5 },
  supportInnerEngraving: () => false,
}));
jest.mock('@core/helpers/checkFeature', () => ({ checkFpm1UV: () => true }));
jest.mock('@core/helpers/device/promark/promark-info', () => ({
  setPromarkInfo: (...args: unknown[]) => mockSetPromarkInfo(...args),
}));
jest.mock('@core/helpers/i18n', () => ({
  lang: {
    inner_engraving: {
      enable_mode: 'enable mode',
      enable_mode_with_workarea: 'apply Promark UV and 70 × 70 settings',
      file_needs_workarea: "apply the file's Promark UV and 70 × 70 settings",
      mode_switch_title: 'switch canvas mode',
      mode_unavailable: 'unavailable',
    },
  },
}));

import { resolveInnerEngravingForFile } from './innerEngravingGate';

describe('resolveInnerEngravingForFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('describes all required settings and keeps the document in 2D when declined', async () => {
    mockPopUp.mockImplementationOnce(({ onNo }) => onNo());

    await expect(resolveInnerEngravingForFile(true, 'fpm1')).resolves.toEqual({
      innerEngraving: false,
      workarea: null,
    });
    expect(mockPopUp).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: 'switch canvas mode',
        message: "apply the file's Promark UV and 70 × 70 settings",
      }),
    );
    expect(mockSetPromarkInfo).not.toHaveBeenCalled();
  });
});
