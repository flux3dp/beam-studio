import { LaserType } from '@core/app/constants/promark-constants';

import { confirmCachedTaskLensProfile } from './cached-task-lens';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockSetField = jest.fn();
const mockSetGalvoParameters = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  setField: (...args) => mockSetField(...args),
  setGalvoParameters: (...args) => mockSetGalvoParameters(...args),
}));

const mockGet = jest.fn();

jest.mock('./promark-data-store', () => ({
  get: (...args) => mockGet(...args),
}));

const mockGetDocumentLensProfileKey = jest.fn();

jest.mock('./lens-profiles', () => ({
  ...jest.requireActual('./lens-profiles'),
  getDocumentLensProfileKey: (...args) => mockGetDocumentLensProfileKey(...args),
}));

const innerField = { angle: 1, offsetX: 1, offsetY: 1 };
const galvo = {
  x: { bulge: 1, scale: 80, skew: 1, trapezoid: 1 },
  y: { bulge: 1, scale: 80, skew: 1, trapezoid: 1 },
};
const inner70 = { innerEngraving: true, workarea: 70 };
const flat200 = { innerEngraving: false, workarea: 200 };

describe('test confirmCachedTaskLensProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue({
      info: { laserType: LaserType.UV, watt: 5 },
      lensProfiles: [{ ...inner70, field: innerField, galvoParameters: galvo }],
    });
    mockGetDocumentLensProfileKey.mockReturnValue(flat200);
  });

  test('does nothing without a cached lens or when it matches the document', async () => {
    expect(await confirmCachedTaskLensProfile('serial')).toBe(true);
    mockGetDocumentLensProfileKey.mockReturnValue(inner70);
    expect(await confirmCachedTaskLensProfile('serial', inner70)).toBe(true);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('asks with both lenses and applies the cached one', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[0]());

    expect(await confirmCachedTaskLensProfile('serial', inner70)).toBe(true);
    expect(mockPopUp.mock.lastCall[0].message).toBe(
      'The last job was generated for 70 mm・Inner Engraving, but Document Settings use 200 mm・Flat. Which parameters should be applied?',
    );
    expect(mockPopUp.mock.lastCall[0].buttonLabels).toEqual([
      'Use Parameters of the Last Job',
      'Use Parameters of Document Settings',
      'Cancel',
    ]);
    expect(mockSetField).toHaveBeenCalledWith(70, innerField);
    expect(mockSetGalvoParameters).toHaveBeenCalledWith(galvo);
  });

  test('keeps the document lens, which select already applied', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[1]());

    expect(await confirmCachedTaskLensProfile('serial', inner70)).toBe(true);
    expect(mockSetField).not.toHaveBeenCalled();
  });

  test('cancelling or closing stops the rerun', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[2]());
    expect(await confirmCachedTaskLensProfile('serial', inner70)).toBe(false);
    mockPopUp.mockImplementation(({ onClose }) => onClose());
    expect(await confirmCachedTaskLensProfile('serial', inner70)).toBe(false);
    expect(mockSetField).not.toHaveBeenCalled();
  });
});
