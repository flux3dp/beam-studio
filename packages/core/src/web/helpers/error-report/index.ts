/**
 * Automatic diagnostic upload (docs/prd/error-report-upload). Fire-and-forget: never throws,
 * never shows UI, never changes what the error popup it was triggered from does (§7.1.1).
 * The consent decorator that attaches this to alerts lives in consent.ts (PR 2).
 */
import { axiosFluxId } from '@core/helpers/api/flux-id';
import deviceMaster from '@core/helpers/device-master';
import { getOS } from '@core/helpers/getOS';
import Logger from '@core/helpers/logger';
import outputError from '@core/helpers/output-error';
import VersionChecker from '@core/helpers/version-checker';

import { getInstallationId } from './installationId';
import type { BlockReason } from './throttle';
import { getBlockReason, getSkipped, makeFingerprint, recordSkipped, recordUpload } from './throttle';

export const ERROR_REPORT_ENDPOINT = '/api/beam-studio/error-report';
/** §9.1: bug_report.txt stays under 10 MB by dropping the oldest fluxghost log lines */
export const MAX_BUG_REPORT_LENGTH = 10 * 1024 * 1024;

const MAX_ATTEMPTS = 3;

export type UploadResult = 'duplicate' | 'failed' | 'sent' | BlockReason;

export interface UploadErrorReportOptions {
  /** real code, e.g. `HARDWARE_ERROR_OVERHEAT`, `#806`, `CONNECTION_TIMEOUT` (§7.4) */
  errorCode: string;
  /** scene SVG or imported file for `#806` / `#809` */
  scene?: { content: string; name: string };
}

const logger = Logger('generic');

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
  const files = await deviceMaster.getLogsTexts([playerLog, 'fluxrobotd.log']);
  const parts: Array<Blob | string> = [];

  for (const [name, chunks] of Object.entries(files)) {
    const blob = chunks.find((chunk): chunk is Blob => chunk instanceof Blob);

    if (blob) parts.push(`\n===\n${name}\n===\n`, blob);
  }

  return parts.length ? new Blob(parts, { type: 'text/plain' }) : null;
};

const post = async (form: FormData): Promise<'duplicate' | 'sent'> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await axiosFluxId.post(ERROR_REPORT_ENDPOINT, form);

      if (data?.status === 'ok') return 'sent';

      if (data?.status === 'duplicate') return 'duplicate';

      throw new Error(`unexpected response ${JSON.stringify(data)}`);
    } catch (error) {
      lastError = error;
    }
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
    const blocked = getBlockReason(serial, fingerprint);

    if (blocked) {
      if (blocked === 'cooldown') recordSkipped(fingerprint);

      logger.append(`error-report skipped (${blocked}) ${errorCode}`);

      return blocked;
    }

    const form = new FormData();

    form.append('serial', serial);
    form.append('installation_id', getInstallationId());
    form.append('error_code', errorCode);
    form.append('app_version', appVersion);
    form.append('os', getOS());
    form.append('firmware_version', firmwareVersion);
    form.append('occurrences_since_last', String(getSkipped(fingerprint)));

    const bugReport = outputError
      .getOutput({ includeImages: false, maxBackendLogLength: MAX_BUG_REPORT_LENGTH, scrub: true })
      .join('');

    form.append('bug_report', new Blob([bugReport], { type: 'text/plain' }), 'bug_report.txt');

    const deviceLog = await readDeviceLog().catch((error) => {
      logger.append(`error-report device log skipped: ${error}`);

      return null;
    });

    if (deviceLog) form.append('system_log', deviceLog, 'system_log.txt');

    if (scene) form.append('scene', new Blob([scene.content], { type: 'image/svg+xml' }), scene.name);

    const result = await post(form);

    recordUpload(serial, fingerprint);

    return result;
  } catch (error) {
    logger.append(`error-report upload failed ${errorCode}: ${error}`);

    return 'failed';
  }
};
