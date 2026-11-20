import { defaultField, defaultGalvoParameters } from '@core/app/constants/promark-constants';

import deviceConstants from '@core/app/constants/device-constants';

import { applyDocumentLensProfile, applyLensProfile, getJobLens, isJobInProgress } from './apply-lens-profile';

const mockGetDocumentLensProfile = jest.fn();
const mockGetLensProfile = jest.fn();

jest.mock('./lens-profiles', () => ({
  getDocumentLensProfile: (...args) => mockGetDocumentLensProfile(...args),
  getLensProfile: (...args) => mockGetLensProfile(...args),
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

describe('test applyLensProfile', () => {
  const redDot = { offsetX: 0.5, offsetY: -0.5, scaleX: 1.1, scaleY: 0.9 };
  const inner70 = { innerEngraving: true, workarea: 70 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkarea.mockReturnValue({ width: 200 });
    mockGetDocumentLensProfile.mockReturnValue({
      field,
      galvoParameters,
      key: { innerEngraving: false, workarea: 200 },
      redDot,
      source: 'exact',
    });
  });

  test('a laser task gets the lens without the red dot correction', async () => {
    await applyLensProfile(target, { model: 'fpm1', serial: 'serial' });
    expect(target.setField).toHaveBeenCalledWith(200, field);
    expect(target.setGalvoParameters).toHaveBeenCalledWith(galvoParameters);
  });

  test('red light adds the red dot correction on top', async () => {
    await applyLensProfile(target, { model: 'fpm1', serial: 'serial' }, { redDot: true });
    expect(target.setField).toHaveBeenCalledWith(200, { angle: 1, offsetX: 2.5, offsetY: 2.5 });
    expect(target.setGalvoParameters).toHaveBeenCalledWith({
      x: { bulge: 1, scale: expect.closeTo(88), skew: 1, trapezoid: 1 },
      y: { bulge: 1, scale: expect.closeTo(72), skew: 1, trapezoid: 1 },
    });
  });

  test('red light without red dot parameters still sends the lens', async () => {
    mockGetDocumentLensProfile.mockReturnValue({ field, galvoParameters, key: {}, source: 'exact' });
    await applyLensProfile(target, { model: 'fpm1', serial: 'serial' }, { redDot: true });
    expect(target.setField).toHaveBeenCalledWith(200, field);
    expect(target.setGalvoParameters).toHaveBeenCalledWith(galvoParameters);
  });

  test('getJobLens gives the same values without sending them, for the start of a job', () => {
    const device = { model: 'fpm1' as const, serial: 'serial' };

    expect(getJobLens(device)).toEqual({ field, galvoParameters, worksize: 200 });
    expect(getJobLens(device, { redDot: true }).field).toEqual({ angle: 1, offsetX: 2.5, offsetY: 2.5 });

    mockGetLensProfile.mockReturnValue({ key: inner70, source: 'fallback' });
    expect(getJobLens(device, { key: inner70 })).toEqual({
      field: defaultField,
      galvoParameters: defaultGalvoParameters,
      worksize: 70,
    });
    expect(target.setField).not.toHaveBeenCalled();
  });

  test('reports whether the machine took the lens', async () => {
    expect(await applyLensProfile(target, { model: 'fpm1', serial: 'serial' })).toBe(true);

    // an older backend answers without the field
    target.setField.mockResolvedValueOnce({});
    target.setGalvoParameters.mockResolvedValueOnce({ success: true });
    expect(await applyLensProfile(target, { model: 'fpm1', serial: 'serial' })).toBe(true);
  });

  test('a refused field stops before the correction, so the lens is not left half applied', async () => {
    target.setField.mockResolvedValueOnce({ error: 'LENS_REJECTED', success: false });
    expect(await applyLensProfile(target, { model: 'fpm1', serial: 'serial' })).toBe(false);
    expect(target.setGalvoParameters).not.toHaveBeenCalled();
  });

  test('a refused correction is reported too', async () => {
    target.setGalvoParameters.mockResolvedValueOnce({ error: 'LENS_REJECTED', success: false });
    expect(await applyLensProfile(target, { model: 'fpm1', serial: 'serial' })).toBe(false);
  });

  test('a task key picks that lens and its work area instead of the document', async () => {
    const taskField = { angle: 0, offsetX: 9, offsetY: 9 };

    mockGetLensProfile.mockReturnValue({ field: taskField, key: inner70, source: 'exact' });
    await applyLensProfile(target, { model: 'fpm1', serial: 'serial' }, { key: inner70 });
    expect(mockGetLensProfile).toHaveBeenCalledWith('serial', inner70);
    expect(mockGetDocumentLensProfile).not.toHaveBeenCalled();
    expect(target.setField).toHaveBeenCalledWith(70, taskField);
    expect(target.setGalvoParameters).toHaveBeenCalledWith(defaultGalvoParameters);
  });
});

describe('test isJobInProgress', () => {
  const { status } = deviceConstants;

  test.each([
    status.INIT,
    status.STARTING,
    status.RUNNING,
    status.PAUSED,
    status.PAUSED_FROM_RUNNING,
    status.PAUSING_FROM_RUNNING,
    status.RESUME_TO_RUNNING,
    status.COMPLETING,
    status.RECONNECTING,
  ])('status %p keeps the lens of the running job', (statusId) => {
    expect(isJobInProgress(statusId)).toBe(true);
  });

  test.each([status.IDLE, status.COMPLETED, status.ABORTED, status.ALARM])(
    'status %p lets a lens be applied',
    (statusId) => {
      expect(isJobInProgress(statusId)).toBe(false);
    },
  );
});
