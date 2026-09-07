import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import alertConstants from '@core/app/constants/alert-constants';
import alertConfig from '@core/helpers/api/alert-config';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import { axiosFluxId, getCurrentUser, getDefaultHeader } from '@core/helpers/api/flux-id';
import type { ResponseWithError } from '@core/helpers/api/flux-id';
import i18n from '@core/helpers/i18n';

/**
 * Sends an image blob to a flux-id AI image API (remove-background, upscale).
 * Handles auth check, credit check, and warning dialog internally.
 * @returns The result PNG blob on success, null on cancel/error.
 */
export const processImageWithAi = async (
  imageBlob: Blob,
  {
    cost,
    endpoint,
    formData = {},
    warning,
  }: {
    cost: number;
    endpoint: string;
    formData?: Record<string, string>;
    warning?: { configKey: AlertConfigKey };
  },
): Promise<Blob | null> => {
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

  try {
    const result = (await axiosFluxId.post(endpoint, form, {
      headers: getDefaultHeader(),
      responseType: 'blob',
      timeout: 1000 * 60 * 3, // 3 min
      withCredentials: true,
    })) as ResponseWithError;

    if (result.error) {
      const { message, response: { data, status } = {} } = result.error;
      let errorDetail = '';

      if (data instanceof Blob && data.type === 'application/json') {
        errorDetail = await new Promise<string>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = (e) => {
            const str = e.target!.result as string;
            const d = JSON.parse(str) as any;

            resolve(d.detail);
          };
          reader.readAsText(data);
        });
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

    const contentType = result.headers['content-type'];

    if (contentType === 'application/json') {
      const { info, message, status } = await new Promise<{
        info: string;
        message?: string;
        status: string;
      }>((resolve) => {
        const reader = new FileReader();

        reader.onloadend = (e) => {
          const str = e.target!.result as string;
          const d = JSON.parse(str) as any;

          resolve(d);
        };
        reader.readAsText(result.data);
      });

      if (status === 'error') {
        if (info === 'NOT_LOGGED_IN') {
          dialogCaller.showLoginDialog();
        } else if (info === 'INSUFFICIENT_CREDITS') {
          showBalanceAlert();
        } else if (info === 'API_ERROR') {
          alertCaller.popUpError({ message: `API Error: ${message}` });
        } else {
          alertCaller.popUpError({ message: `Error: ${info}` });
        }
      }

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
 * Estimated upscale duration in ms, fitted on 6 timing samples (2026-09):
 * the model runs over the input, then the enlarged PNG is encoded and downloaded.
 * The output term assumes ~1 byte/px (detailed photos); compressible images finish earlier on the bar.
 * Padded by 30% so the bar rarely stalls at 95% waiting for a slow run.
 * ponytail: to refit, log performance.now() around processImageWithAi with input size and scale.
 */
export const estimateUpscaleMs = (inputPixels: number, scale: number): number =>
  1.3 * (3500 + 9.2e-3 * inputPixels + 0.6e-3 * inputPixels * scale * scale);
