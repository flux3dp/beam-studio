import { axiosFluxId, getCurrentUser } from '@core/helpers/api/flux-id';

const mockPopUp = jest.fn();
const mockPopUpCreditAlert = jest.fn();
const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
  popUpCreditAlert: (...args: any[]) => mockPopUpCreditAlert(...args),
  popUpError: (...args: any[]) => mockPopUpError(...args),
}));

const mockShowLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showLoginDialog: (...args: any[]) => mockShowLoginDialog(...args),
}));

const mockAlertConfigRead = jest.fn();
const mockAlertConfigWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args: any[]) => mockAlertConfigRead(...args),
  write: (...args: any[]) => mockAlertConfigWrite(...args),
}));

import { estimateUpscaleMs, processImageWithAi } from './ai-image-process';

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockPost = axiosFluxId.post as jest.Mock;
const imageBlob = new Blob(['img'], { type: 'image/jpeg' });
const pngBlob = new Blob(['png'], { type: 'image/png' });
const options = { cost: 0.01, endpoint: '/api/upscale', formData: { scale: '4' } };
const pngResponse = { data: pngBlob, headers: { 'content-type': 'image/png' } };
const jsonResponse = (body: object) => ({
  data: new Blob([JSON.stringify(body)], { type: 'application/json' }),
  headers: { 'content-type': 'application/json' },
});

describe('processImageWithAi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ email: 'a@b.c', info: { credit: 1 } });
    mockAlertConfigRead.mockReturnValue(true);
  });

  test('asks to log in when there is no user', async () => {
    mockGetCurrentUser.mockReturnValue(null);

    expect(await processImageWithAi(imageBlob, options)).toBeNull();
    expect(mockShowLoginDialog).toHaveBeenCalledTimes(1);
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('shows the credit alert when the combined balance is below cost', async () => {
    mockGetCurrentUser.mockReturnValue({ email: 'a@b.c', info: { credit: 0.005 } });

    expect(await processImageWithAi(imageBlob, options)).toBeNull();
    expect(mockPopUpCreditAlert).toHaveBeenCalledWith({ available: 0.005, required: '0.01' });
    expect(mockPost).not.toHaveBeenCalled();
  });

  test('counts subscription credit toward the balance', async () => {
    mockGetCurrentUser.mockReturnValue({ email: 'a@b.c', info: { credit: 0.005, subscription: { credit: 0.005 } } });
    mockPost.mockResolvedValue(pngResponse);

    expect(await processImageWithAi(imageBlob, options)).toBe(pngBlob);
    expect(mockPopUpCreditAlert).not.toHaveBeenCalled();
  });

  test('posts the image and extra form fields and returns the PNG blob', async () => {
    mockPost.mockResolvedValue(pngResponse);

    expect(await processImageWithAi(imageBlob, options)).toBe(pngBlob);
    expect(mockPost).toHaveBeenCalledTimes(1);

    const [endpoint, form, config] = mockPost.mock.calls[0];

    expect(endpoint).toBe('/api/upscale');
    expect((form as FormData).get('image')).toBeInstanceOf(Blob);
    expect((form as FormData).get('scale')).toBe('4');
    expect(config).toMatchObject({ responseType: 'blob', withCredentials: true });
  });

  describe('warning dialog', () => {
    const warned = { ...options, warning: { configKey: 'skip_upscale_warning' as any } };

    test('skips the dialog when the user opted out', async () => {
      mockPost.mockResolvedValue(pngResponse);

      await processImageWithAi(imageBlob, warned);
      expect(mockAlertConfigRead).toHaveBeenCalledWith('skip_upscale_warning');
      expect(mockPopUp).not.toHaveBeenCalled();
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    test('returns null without posting when the user cancels', async () => {
      mockAlertConfigRead.mockReturnValue(false);
      mockPopUp.mockImplementation(({ onCancel }) => onCancel());

      expect(await processImageWithAi(imageBlob, warned)).toBeNull();
      expect(mockPost).not.toHaveBeenCalled();
    });

    test('proceeds on confirm and remembers the checkbox opt-out', async () => {
      mockAlertConfigRead.mockReturnValue(false);
      mockPopUp.mockImplementation(({ checkbox }) => checkbox.callbacks[0]());
      mockPost.mockResolvedValue(pngResponse);

      expect(await processImageWithAi(imageBlob, warned)).toBe(pngBlob);
      expect(mockAlertConfigWrite).toHaveBeenCalledWith('skip_upscale_warning', true);
    });
  });

  describe('error responses', () => {
    test('pops a server error for a transport error', async () => {
      mockPost.mockResolvedValue({ error: { message: 'boom', response: { status: 500 } } });

      expect(await processImageWithAi(imageBlob, options)).toBeNull();
      expect(mockPopUpError).toHaveBeenCalledWith({ message: 'Server Error: 500 boom' });
    });

    test('asks to re-login on a CSRF 403', async () => {
      mockPost.mockResolvedValue({
        error: {
          message: 'forbidden',
          response: {
            data: new Blob([JSON.stringify({ detail: 'CSRF Failed: x' })], { type: 'application/json' }),
            status: 403,
          },
        },
      });

      expect(await processImageWithAi(imageBlob, options)).toBeNull();
      expect(mockPopUp).toHaveBeenCalledWith(expect.objectContaining({ onConfirm: expect.any(Function) }));
      expect(mockPopUpError).not.toHaveBeenCalled();
    });

    test.each([
      ['NOT_LOGGED_IN', () => expect(mockShowLoginDialog).toHaveBeenCalledTimes(1)],
      ['INSUFFICIENT_CREDITS', () => expect(mockPopUpCreditAlert).toHaveBeenCalledTimes(1)],
      ['API_ERROR', () => expect(mockPopUpError).toHaveBeenCalledWith({ message: 'API Error: bad' })],
      ['OTHER', () => expect(mockPopUpError).toHaveBeenCalledWith({ message: 'Error: OTHER' })],
    ])('handles a JSON error body with info %s', async (info, assertion) => {
      mockPost.mockResolvedValue(jsonResponse({ info, message: 'bad', status: 'error' }));

      expect(await processImageWithAi(imageBlob, options)).toBeNull();
      assertion();
    });

    test('rejects an unknown content type', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockPost.mockResolvedValue({ data: pngBlob, headers: { 'content-type': 'text/html' } });

      expect(await processImageWithAi(imageBlob, options)).toBeNull();
      expect(mockPopUpError).toHaveBeenCalledWith({ message: 'Unknown Response Type: text/html' });
    });

    test('returns null when the request throws', async () => {
      mockPost.mockRejectedValue(new Error('network'));

      expect(await processImageWithAi(imageBlob, options)).toBeNull();
    });
  });
});

describe('estimateUpscaleMs', () => {
  // Measured 2026-09 with [input px, scale, actual ms]. The padded estimate must cover every sample
  // (so the bar never stalls at 95%) without overshooting by more than 2x (so it doesn't finish absurdly early).
  test.each([
    [352 * 314, 4, 5221],
    [352 * 314, 10, 9150],
    [352 * 314, 10, 8693],
    [1440 * 1440, 2, 25831],
    [1440 * 1440, 10, 103698],
    [1309 * 1206, 6, 65942],
  ])('input %i px at %ix (actual %i ms) is covered within 2x', (inputPixels, scale, actualMs) => {
    const estimate = estimateUpscaleMs(inputPixels, scale);

    expect(estimate).toBeGreaterThanOrEqual(actualMs);
    expect(estimate).toBeLessThanOrEqual(actualMs * 2);
  });

  test('grows with both input size and scale', () => {
    expect(estimateUpscaleMs(1000, 4)).toBeLessThan(estimateUpscaleMs(2000, 4));
    expect(estimateUpscaleMs(1000, 4)).toBeLessThan(estimateUpscaleMs(1000, 8));
  });
});
