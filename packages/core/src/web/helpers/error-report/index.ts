/**
 * Automatic diagnostic upload (docs/prd/error-report-upload). Fire-and-forget: never throws,
 * never shows UI, never changes what the error popup it was triggered from does (§7.1.1).
 * The consent decorator that attaches this to alerts lives in consent.tsx.
 */
import type { AxiosError } from 'axios';

import { axiosFluxId } from '@core/helpers/api/flux-id';
import type { ResponseWithError } from '@core/helpers/api/flux-id/base';
import deviceMaster from '@core/helpers/device-master';
import { getOS } from '@core/helpers/getOS';
import Logger from '@core/helpers/logger';
import outputError from '@core/helpers/output-error';
import VersionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { getInstallationId } from './installationId';
import type { BlockReason } from './throttle';
import { getBlockReason, getSkipped, makeFingerprint, recordSkipped, recordUpload } from './throttle';

export const ERROR_REPORT_ENDPOINT = '/api/beam-studio/error-report';
/** §9.1: bug_report.txt stays within the backend's 10 MB file limit by dropping the oldest fluxghost log lines */
export const MAX_BUG_REPORT_LENGTH = 10 * 1024 * 1024;

/** backend limits (backend.md §2): 10 MB per file, 20 MB per request; a 400 is final, so the client has to fit */
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = 20 * 1024 * 1024;
/** multipart boundaries and the string fields */
const REQUEST_MARGIN_BYTES = 64 * 1024;

const MAX_ATTEMPTS = 3;
/** idle bound on each device log download (control.downloadLog): a stalled socket must not hang the upload */
const DEVICE_LOG_TIMEOUT_MS = 10 * 1000;

export type UploadResult = 'duplicate' | 'failed' | 'sent' | BlockReason;

export interface UploadErrorReportOptions {
  /**
   * Machine the error belongs to when it is not `deviceMaster.currentDevice`, e.g. a failed
   * `select` (§6 S6). The device log is read only when the current control socket is this machine's.
   */
  device?: IDeviceInfo;
  /** real code, e.g. `HARDWARE_ERROR_OVERHEAT`, `#806`, `CONNECTION_TIMEOUT` (§7.4) */
  errorCode: string;
  /** scene SVG (`#806`) or the imported file itself (`#809`) */
  scene?: { content: Blob | string; name: string };
}

const logger = Logger('generic');
/** fingerprints with an upload in progress → occurrences suppressed meanwhile; the throttle only learns about one once recordUpload runs */
const inFlight = new Map<string, number>();

/**
 * System log of the machine `uuid`, only when it is the current device, has a control socket and is
 * idle; null otherwise. The downloaded blobs are concatenated as blob parts, never decoded into strings.
 */
const readDeviceLog = async (uuid?: string): Promise<Blob | null> => {
  const device = deviceMaster.currentDevice;

  if (!device?.control || device.info.uuid !== uuid || device.control.getMode() !== '') return null;

  const playerLog = VersionChecker(device.info.version).meetRequirement('NEW_PLAYER')
    ? 'playerd.log'
    : 'fluxplayerd.log';
  const files = await deviceMaster.getLogsTexts([playerLog, 'fluxrobotd.log'], undefined, DEVICE_LOG_TIMEOUT_MS);
  const parts: Array<Blob | string> = [];

  for (const [name, chunks] of Object.entries(files)) {
    // the Blob, or the "<name not downloaded: …>" note getLogsTexts leaves when a download fails
    const content =
      chunks.find((chunk): chunk is Blob => chunk instanceof Blob) ?? chunks.find((chunk) => typeof chunk === 'string');

    if (content) parts.push(`\n===\n${name}\n===\n`, content);
  }

  return parts.length ? new Blob(parts, { type: 'text/plain' }) : null;
};

/** the newest `limit` bytes of a text blob; the cut may land inside a line, fine for a log */
const tail = (blob: Blob, limit: number): Blob =>
  blob.size <= limit ? blob : blob.slice(blob.size - limit, blob.size, blob.type);

/** up to 20 MB must fit on a slow home uplink (~1 Mbit/s) */
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

const getContext = ({ device, errorCode }: UploadErrorReportOptions) => {
  const info = device ?? deviceMaster.currentDevice?.info;
  const serial = info?.serial || 'none';
  const firmwareVersion = info?.version ?? '';
  const appVersion = window.FLUX.version;

  return {
    appVersion,
    fingerprint: makeFingerprint(serial, errorCode, appVersion, firmwareVersion),
    firmwareVersion,
    serial,
    uuid: info?.uuid,
  };
};

/**
 * Why an upload for this error must not happen now (§7.7), or null when it may.
 * A blocked occurrence is counted for the next report's occurrences_since_last and logged.
 */
export const getUploadBlock = (options: UploadErrorReportOptions): BlockReason | null => {
  const { errorCode } = options;
  const { fingerprint, serial } = getContext(options);
  const blocked = inFlight.has(fingerprint) ? 'cooldown' : getBlockReason(serial, fingerprint);

  // an occurrence during an in-flight upload rides with that upload (recorded when it lands)
  if (inFlight.has(fingerprint)) inFlight.set(fingerprint, inFlight.get(fingerprint)! + 1);
  else if (blocked === 'cooldown') recordSkipped(fingerprint);

  if (blocked) logger.append(`error-report skipped (${blocked}) ${errorCode}`);

  return blocked;
};

export const uploadErrorReport = async (options: UploadErrorReportOptions): Promise<UploadResult> => {
  const { errorCode, scene } = options;

  try {
    const blocked = getUploadBlock(options);

    if (blocked) return blocked;

    const { appVersion, fingerprint, firmwareVersion, serial, uuid } = getContext(options);

    inFlight.set(fingerprint, 0);

    try {
      const form = new FormData();

      form.append('serial', serial);
      form.append('installation_id', getInstallationId());
      form.append('error_code', errorCode);
      form.append('app_version', appVersion);
      form.append('os', getOS());
      form.append('firmware_version', firmwareVersion);
      form.append('occurrences_since_last', String(getSkipped(fingerprint)));

      const text = outputError
        .getOutput({ includeImages: false, maxLength: MAX_BUG_REPORT_LENGTH, scrub: true })
        .join('');
      // getOutput caps characters; this caps bytes (CJK text is 3 bytes a character in UTF-8)
      const bugReport = tail(new Blob([text], { type: 'text/plain' }), MAX_FILE_BYTES);

      form.append('bug_report', bugReport, 'bug_report.txt');

      let budget = MAX_REQUEST_BYTES - REQUEST_MARGIN_BYTES - bugReport.size;

      // scene before system_log: the export / import errors that carry one need the design more than the device log
      if (scene) {
        const sceneBlob = new Blob([scene.content], { type: 'image/svg+xml' });

        if (sceneBlob.size <= Math.min(MAX_FILE_BYTES, budget)) {
          form.append('scene', sceneBlob, scene.name);
          budget -= sceneBlob.size;
        } else {
          logger.append(`error-report scene dropped: ${sceneBlob.size} bytes`);
        }
      }

      try {
        const deviceLog = await readDeviceLog(uuid);

        if (deviceLog && budget > 0) {
          form.append('system_log', tail(deviceLog, Math.min(MAX_FILE_BYTES, budget)), 'system_log.txt');
        } else if (deviceLog) {
          logger.append(`error-report device log dropped: ${deviceLog.size} bytes, no room`);
        }
      } catch (error) {
        logger.append(`error-report device log skipped: ${error}`);
      }

      const result = await post(form);

      recordUpload(serial, fingerprint);
      // §7.7: what was suppressed while this upload was in flight rides with the next one
      recordSkipped(fingerprint, Date.now(), inFlight.get(fingerprint));

      return result;
    } finally {
      inFlight.delete(fingerprint);
    }
  } catch (error) {
    logger.append(`error-report upload failed ${errorCode}: ${error}`);

    return 'failed';
  }
};
