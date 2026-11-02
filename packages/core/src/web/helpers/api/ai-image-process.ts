import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import alertConstants from '@core/app/constants/alert-constants';
import alertConfig from '@core/helpers/api/alert-config';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import { axiosFluxId, getCurrentUser, getDefaultHeader } from '@core/helpers/api/flux-id';
import type { ResponseWithError } from '@core/helpers/api/flux-id';
import i18n from '@core/helpers/i18n';

interface AiRequestOptions {
  cost: number;
  endpoint: string;
  formData?: Record<string, string>;
  /** Milliseconds; 3 minutes by default. */
  timeout?: number;
  warning?: { configKey: AlertConfigKey };
}

interface AiErrorBody {
  info: string;
  message?: string;
  status: string;
}

const readBlobAsJson = <T>(blob: Blob): Promise<T> =>
  new Promise<T>((resolve) => {
    const reader = new FileReader();

    reader.onloadend = (e) => resolve(JSON.parse(e.target!.result as string) as T);
    reader.readAsText(blob);
  });

/**
 * Login, credit and (optionally) the cost reminder, then the request itself.
 * @returns the response, or null when the user is not logged in, cannot pay, cancelled, or the request
 * failed (already reported)
 */
const sendAiRequest = async (
  imageBlob: Blob,
  { cost, endpoint, formData = {}, timeout = 1000 * 60 * 3, warning }: AiRequestOptions,
  responseType: 'blob' | 'json',
): Promise<null | { response: ResponseWithError; showBalanceAlert: () => void }> => {
  const user = getCurrentUser();

  if (!user) {
    dialogCaller.showLoginDialog();

    return null;
  }

  const showBalanceAlert = () => alertCaller.popUpCreditAlert({ available: user.info.credit, required: String(cost) });

  if ((user.info?.subscription?.credit ?? 0) + (user.info?.credit ?? 0) < cost) {
    showBalanceAlert();

    return null;
  }

  if (warning && !alertConfig.read(warning.configKey)) {
    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        checkbox: {
          callbacks: [
            () => {
              alertConfig.write(warning.configKey, true);
              resolve(true);
            },
            () => resolve(false),
          ],
          text: i18n.lang.alert.dont_show_again,
        },
        message: sprintf(i18n.lang.beambox.right_panel.object_panel.actions_panel.ai_credit_reminder, cost),
        onCancel: () => resolve(false),
        onConfirm: () => resolve(true),
      });
    });

    if (!res) {
      return null;
    }
  }

  const form = new FormData();

  form.append('image', imageBlob);
  Object.entries(formData).forEach(([key, value]) => form.append(key, value));

  const response = (await axiosFluxId.post(endpoint, form, {
    headers: getDefaultHeader(),
    responseType,
    timeout,
    withCredentials: true,
  })) as ResponseWithError;

  if (response.error) {
    const { message, response: { data, status } = {} } = response.error;
    let errorDetail = '';

    if (data instanceof Blob && data.type === 'application/json') {
      errorDetail = (await readBlobAsJson<{ detail: string }>(data)).detail;
    } else if (data && typeof data === 'object' && 'detail' in data) {
      errorDetail = String((data as { detail: unknown }).detail);
    }

    if (status === 403 && errorDetail.startsWith('CSRF Failed')) {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        message: i18n.lang.beambox.popup.ai_credit.relogin_to_use,
        onConfirm: dialogCaller.showLoginDialog,
      });

      return null;
    }

    alertCaller.popUpError({
      message: `Server Error: ${status} ${errorDetail || message}`,
    });

    return null;
  }

  return { response, showBalanceAlert };
};

const reportAiError = ({ info, message }: AiErrorBody, showBalanceAlert: () => void): void => {
  if (info === 'NOT_LOGGED_IN') {
    dialogCaller.showLoginDialog();
  } else if (info === 'INSUFFICIENT_CREDITS') {
    showBalanceAlert();
  } else if (info === 'API_ERROR') {
    alertCaller.popUpError({ message: `API Error: ${message}` });
  } else {
    alertCaller.popUpError({ message: `Error: ${info}` });
  }
};

/**
 * Sends an image blob to a flux-id AI image API (remove-background, upscale).
 * Handles auth check, credit check, and warning dialog internally.
 * @returns The result PNG blob on success, null on cancel/error.
 */
export const processImageWithAi = async (imageBlob: Blob, options: AiRequestOptions): Promise<Blob | null> => {
  try {
    const sent = await sendAiRequest(imageBlob, options, 'blob');

    if (!sent) return null;

    const { response: result, showBalanceAlert } = sent;
    const contentType = result.headers['content-type'];

    if (contentType === 'application/json') {
      const body = await readBlobAsJson<AiErrorBody>(result.data);

      if (body.status === 'error') reportAiError(body, showBalanceAlert);

      return null;
    }

    if (contentType !== 'image/png') {
      console.error('unknown response type', contentType);
      alertCaller.popUpError({ message: `Unknown Response Type: ${contentType}` });

      return null;
    }

    return result.data as Blob;
  } catch {
    return null;
  }
};

/**
 * Like `processImageWithAi`, for an API that answers with JSON (photo-to-3d).
 * @returns the JSON body on success (`status: 'ok'`), null on cancel/error (already reported)
 */
export const processImageWithAiJson = async <T extends object>(
  imageBlob: Blob,
  options: AiRequestOptions,
): Promise<null | T> => {
  try {
    const sent = await sendAiRequest(imageBlob, options, 'json');

    if (!sent) return null;

    const body = sent.response.data as AiErrorBody | (T & { status: 'ok' });

    if (body?.status === 'ok') return body as T;

    if (body?.status === 'error') reportAiError(body as AiErrorBody, sent.showBalanceAlert);
    else alertCaller.popUpError({ message: 'Unknown Response' });

    return null;
  } catch {
    return null;
  }
};

/**
 * Estimated upscale duration in ms, fitted on 6 timing samples (2026-09):
 * the model runs over the input, then the enlarged PNG is encoded and downloaded.
 * The output term assumes ~1 byte/px (detailed photos); compressible images finish earlier on the bar.
 * Padded by 30% so the bar rarely stalls at 95% waiting for a slow run.
 * ponytail: to refit, log performance.now() around processImageWithAi with input size and scale.
 */
export const estimateUpscaleMs = (inputPixels: number, scale: number): number =>
  1.3 * (3500 + 9.2e-3 * inputPixels + 0.6e-3 * inputPixels * scale * scale);
