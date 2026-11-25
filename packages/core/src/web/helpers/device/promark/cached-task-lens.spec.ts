import { LaserType } from '@core/app/constants/promark-constants';

import { confirmCachedTaskLensProfile, prepareCachedTaskRerun } from './cached-task-lens';

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

  test('does not ask without a cached lens or when it matches the document', async () => {
    expect(await confirmCachedTaskLensProfile('serial')).toEqual({});
    mockGetDocumentLensProfileKey.mockReturnValue(inner70);
    expect(await confirmCachedTaskLensProfile('serial', inner70)).toEqual({ lensProfileKey: inner70 });
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('asks with both lenses and runs with the lens of the task', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[0]());

    expect(await confirmCachedTaskLensProfile('serial', inner70)).toEqual({ lensProfileKey: inner70 });
    expect(mockPopUp.mock.lastCall[0].message).toBe(
      'The last job was generated for 70 mm・Inner Engraving, but Document Settings use 200 mm・Flat. Which parameters should be applied?',
    );
    expect(mockPopUp.mock.lastCall[0].buttonLabels).toEqual([
      'Use Parameters of the Last Job',
      'Use Parameters of Document Settings',
      'Cancel',
    ]);
  });

  test('picking the document lens runs with it and leaves the cached key alone', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[1]());

    const cachedKey = { ...inner70 };

    expect(await confirmCachedTaskLensProfile('serial', cachedKey)).toEqual({ lensProfileKey: flat200 });
    // the only record of the lens the task was generated for
    expect(cachedKey).toEqual(inner70);
  });

  test('cancelling or closing stops the rerun', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[2]());
    expect(await confirmCachedTaskLensProfile('serial', inner70)).toBe(false);
    mockPopUp.mockImplementation(({ onClose }) => onClose());
    expect(await confirmCachedTaskLensProfile('serial', inner70)).toBe(false);
  });
});

describe('test prepareCachedTaskRerun', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue({ info: { laserType: LaserType.UV, watt: 5 }, lensProfiles: [{ ...inner70 }] });
    mockGetDocumentLensProfileKey.mockReturnValue(flat200);
  });

  test('hands the monitor a copy with the document lens and keeps the cached task as generated', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[1]());

    const cachedTask = { fileName: 'task', lensProfileKey: inner70 };
    const task = await prepareCachedTaskRerun('serial', cachedTask);

    expect(task).toEqual({ fileName: 'task', lensProfileKey: flat200 });
    expect(task).not.toBe(cachedTask);
    expect(cachedTask.lensProfileKey).toBe(inner70);

    // back on a 70 mm document the cached task still says 70 mm: nothing to ask
    mockPopUp.mockClear();
    mockGetDocumentLensProfileKey.mockReturnValue(inner70);
    expect(await prepareCachedTaskRerun('serial', cachedTask)).toEqual(cachedTask);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('runs with the lens of the task when that is picked', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[0]());

    const cachedTask = { fileName: 'task', lensProfileKey: inner70 };

    expect(await prepareCachedTaskRerun('serial', cachedTask)).toEqual(cachedTask);
  });

  test('stops when the user cancels, and passes on that there is no cached task', async () => {
    mockPopUp.mockImplementation(({ callbacks }) => callbacks[2]());
    expect(await prepareCachedTaskRerun('serial', { lensProfileKey: inner70 })).toBe(false);
    expect(await prepareCachedTaskRerun('serial', undefined)).toBeUndefined();
  });
});
