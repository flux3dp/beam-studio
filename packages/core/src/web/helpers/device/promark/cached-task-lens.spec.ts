import { LaserType } from '@core/app/constants/promark-constants';

import { confirmCachedTaskLensProfile } from './cached-task-lens';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
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

const inner70 = { innerEngraving: true, workarea: 70 };
const flat200 = { innerEngraving: false, workarea: 200 };

describe('test confirmCachedTaskLensProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue({
      info: { laserType: LaserType.UV, watt: 5 },
      lensProfiles: [{ ...inner70 }],
    });
    mockGetDocumentLensProfileKey.mockReturnValue(flat200);
  });

  test('does nothing without a cached lens or when it matches the document', async () => {
    expect(await confirmCachedTaskLensProfile('serial')).toBe(true);
    expect(await confirmCachedTaskLensProfile('serial', {})).toBe(true);
    mockGetDocumentLensProfileKey.mockReturnValue(inner70);

    const task = { lensProfileKey: inner70 };

    expect(await confirmCachedTaskLensProfile('serial', task)).toBe(true);
    expect(task.lensProfileKey).toBe(inner70);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('asks with both lenses and keeps the lens of the task', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[0]());

    const task = { lensProfileKey: inner70 };

    expect(await confirmCachedTaskLensProfile('serial', task)).toBe(true);
    expect(mockPopUp.mock.lastCall[0].message).toBe(
      'The last job was generated for 70 mm・Inner Engraving, but Document Settings use 200 mm・Flat. Which parameters should be applied?',
    );
    expect(mockPopUp.mock.lastCall[0].buttonLabels).toEqual([
      'Use Parameters of the Last Job',
      'Use Parameters of Document Settings',
      'Cancel',
    ]);
    // the monitor sends the lens of the task before every start
    expect(task.lensProfileKey).toBe(inner70);
  });

  test('picking the document lens makes it the lens of the task', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[1]());

    const task = { lensProfileKey: inner70 };

    expect(await confirmCachedTaskLensProfile('serial', task)).toBe(true);
    expect(task.lensProfileKey).toBe(flat200);
  });

  test('cancelling or closing stops the rerun and leaves the task alone', async () => {
    const task = { lensProfileKey: inner70 };

    mockPopUp.mockImplementation(({ callbacks }) => callbacks[2]());
    expect(await confirmCachedTaskLensProfile('serial', task)).toBe(false);
    mockPopUp.mockImplementation(({ onClose }) => onClose());
    expect(await confirmCachedTaskLensProfile('serial', task)).toBe(false);
    expect(task.lensProfileKey).toBe(inner70);
  });
});
