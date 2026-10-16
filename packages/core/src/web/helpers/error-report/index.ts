/**
 * Automatic diagnostic upload (docs/prd/error-report-upload). Fire-and-forget: never throws,
 * never shows UI, never changes what the error popup it was triggered from does (§7.1.1).
 * The consent decorator that attaches this to alerts lives in consent.ts (PR 2).
 */
import type { AxiosError } from 'axios';

import { axiosFluxId } from '@core/helpers/api/flux-id';
import type { ResponseWithError } from '@core/helpers/api/flux-id/base';
import deviceMaster from '@core/helpers/device-master';
import { getOS } from '@core/helpers/getOS';
import Logger from '@core/helpers/logger';
import outputError from '@core/helpers/output-error';
import VersionChecker from '@core/helpers/version-checker';

import { getInstallationId } from './installationId';
import type { BlockReason } from './throttle';
import { getBlockReason, getSkipped, makeFingerprint, recordSkipped, recordUpload } from './throttle';

export const ERROR_REPORT_ENDPOINT = '/api/beam-studio/error-report';
/** §9.1: bug_report.txt stays within the backend's 10 MB file limit by dropping the oldest fluxghost log lines */
export const MAX_BUG_REPORT_LENGTH = 10 * 1024 * 1024;

const MAX_ATTEMPTS = 3;
/** control.downloadLog only settles on a Blob or an error frame; a stalled socket would hang the upload */
const DEVICE_LOG_TIMEOUT_MS = 10 * 1000;

export type UploadResult = 'duplicate' | 'failed' | 'sent' | BlockReason;

export interface UploadErrorReportOptions {
  /** real code, e.g. `HARDWARE_ERROR_OVERHEAT`, `#806`, `CONNECTION_TIMEOUT` (§7.4) */
  errorCode: string;
  /** scene SVG or imported file for `#806` / `#809` */
  scene?: { content: string; name: string };
}

const logger = Logger('generic');
/** fingerprints with an upload in progress: the throttle only learns about one once recordUpload runs */
const inFlight = new Set<string>();

/**
 * Device system log, only when a control socket exists and the machine is idle; null otherwise.
 * The downloaded blobs are concatenated as blob parts, never decoded into strings.
 */
const readDeviceLog = async (): Promise<Blob | null> => {
  const device = deviceMaster.currentDevice;

  if (!device?.control || device.control.getMode() !== '') return null;

  const playerLog = VersionChecker(device.info.version).meetRequirement('NEW_PLAYER')
    ? 'playerd.log'
    : 'fluxplayerd.log';
  // ponytail: on timeout the pending fetch_log listener stays on the control socket until the
  // next command replaces it; a cancellable downloadLog would be the clean fix.
  const files = await Promise.race([
    deviceMaster.getLogsTexts([playerLog, 'fluxrobotd.log']),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`timed out after ${DEVICE_LOG_TIMEOUT_MS} ms`)), DEVICE_LOG_TIMEOUT_MS);
    }),
  ]);
  const parts: Array<Blob | string> = [];

  for (const [name, chunks] of Object.entries(files)) {
    const blob = chunks.find((chunk): chunk is Blob => chunk instanceof Blob);

    if (blob) parts.push(`\n===\n${name}\n===\n`, blob);
  }

  return parts.length ? new Blob(parts, { type: 'text/plain' }) : null;
};

/** 10 MB bug_report + 10 MB system_log + scene must fit on a slow home uplink (~1 Mbit/s) */
const UPLOAD_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * Only transient failures earn another attempt: no response (timeout, dropped socket) or 5xx.
 * 4xx means the body or the budget is the problem; `error` undefined means a 2xx with an unknown
 * body, which the server already accepted.
 */
const shouldRetry = (error?: AxiosError): boolean =>
  error !== undefined && (!error.response || error.response.status >= 500);

const post = async (form: FormData): Promise<'duplicate' | 'sent'> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const { data, error } = (await axiosFluxId.post(ERROR_REPORT_ENDPOINT, form, {
      timeout: UPLOAD_TIMEOUT_MS,
    })) as ResponseWithError;

    if (data?.status === 'ok') return 'sent';

    if (data?.status === 'duplicate') return 'duplicate';

    lastError = error
      ? new Error(`HTTP ${error.response?.status ?? error.code} ${JSON.stringify(error.response?.data)}`)
      : new Error(`unexpected response ${JSON.stringify(data)}`);

    if (!shouldRetry(error)) break;
  }

  throw lastError;
};

export const uploadErrorReport = async ({ errorCode, scene }: UploadErrorReportOptions): Promise<UploadResult> => {
  try {
    const info = deviceMaster.currentDevice?.info;
    const serial = info?.serial || 'none';
    const firmwareVersion = info?.version ?? '';
    const appVersion = window.FLUX.version;
    const fingerprint = makeFingerprint(serial, errorCode, appVersion, firmwareVersion);
    const blocked = inFlight.has(fingerprint) ? 'cooldown' : getBlockReason(serial, fingerprint);

    if (blocked) {
      if (blocked === 'cooldown') recordSkipped(fingerprint);

      logger.append(`error-report skipped (${blocked}) ${errorCode}`);

      return blocked;
    }

    inFlight.add(fingerprint);

    try {
      const form = new FormData();

      form.append('serial', serial);
      form.append('installation_id', getInstallationId());
      form.append('error_code', errorCode);
      form.append('app_version', appVersion);
      form.append('os', getOS());
      form.append('firmware_version', firmwareVersion);
      form.append('occurrences_since_last', String(getSkipped(fingerprint)));

      const bugReport = outputError
        .getOutput({ includeImages: false, maxLength: MAX_BUG_REPORT_LENGTH, scrub: true })
        .join('');

      form.append('bug_report', new Blob([bugReport], { type: 'text/plain' }), 'bug_report.txt');

      try {
        const deviceLog = await readDeviceLog();

        if (deviceLog) form.append('system_log', deviceLog, 'system_log.txt');
      } catch (error) {
        logger.append(`error-report device log skipped: ${error}`);
      }

      if (scene) form.append('scene', new Blob([scene.content], { type: 'image/svg+xml' }), scene.name);

      const result = await post(form);

      recordUpload(serial, fingerprint);

      return result;
    } finally {
      inFlight.delete(fingerprint);
    }
  } catch (error) {
    logger.append(`error-report upload failed ${errorCode}: ${error}`);

    return 'failed';
  }
};
