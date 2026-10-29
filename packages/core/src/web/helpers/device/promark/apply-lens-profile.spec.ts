import { defaultField, defaultGalvoParameters } from '@core/app/constants/promark-constants';

import { applyDocumentLensProfile } from './apply-lens-profile';

const mockGetDocumentLensProfile = jest.fn();

jest.mock('./lens-profiles', () => ({
  getDocumentLensProfile: (...args) => mockGetDocumentLensProfile(...args),
}));

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const field = { angle: 1, offsetX: 2, offsetY: 3 };
const galvoParameters = {
  x: { bulge: 1, scale: 80, skew: 1, trapezoid: 1 },
  y: { bulge: 1, scale: 80, skew: 1, trapezoid: 1 },
};
const target = { setField: jest.fn(), setGalvoParameters: jest.fn() };

describe('test applyDocumentLensProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkarea.mockReturnValue({ width: 200 });
  });

  test('applies the lens the document asks for at the document work area', async () => {
    mockGetDocumentLensProfile.mockReturnValue({
      field,
      galvoParameters,
      key: { innerEngraving: false, workarea: 200 },
      source: 'exact',
    });

    await applyDocumentLensProfile(target, { model: 'fpm1', serial: 'serial' });
    expect(mockGetDocumentLensProfile).toHaveBeenCalledWith('serial');
    expect(mockGetWorkarea).toHaveBeenCalledWith('fpm1');
    expect(target.setField).toHaveBeenCalledWith(200, field);
    expect(target.setGalvoParameters).toHaveBeenCalledWith(galvoParameters);
  });

  test('factory values: both the field and the galvo fall back to their defaults and are still sent', async () => {
    mockGetDocumentLensProfile.mockReturnValue({ key: { innerEngraving: false, workarea: 200 }, source: 'fallback' });

    await applyDocumentLensProfile(target, { model: 'fpm1', serial: 'serial' });
    expect(target.setField).toHaveBeenCalledWith(200, defaultField);
    expect(target.setGalvoParameters).toHaveBeenCalledWith(defaultGalvoParameters);
  });
});
