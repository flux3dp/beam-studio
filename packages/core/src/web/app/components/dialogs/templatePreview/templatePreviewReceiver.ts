import beamFileHelper from '@core/helpers/beam-file-helper';

import type { TemplatePreviewSetContentMessage } from './constants';
import { TEMPLATE_PREVIEW_READY, TEMPLATE_PREVIEW_SET_CONTENT } from './constants';

const isSetContentMessage = (data: unknown): data is TemplatePreviewSetContentMessage =>
  typeof data === 'object' &&
  data !== null &&
  (data as { type?: unknown }).type === TEMPLATE_PREVIEW_SET_CONTENT &&
  (data as { beamBuffer?: unknown }).beamBuffer instanceof ArrayBuffer;

/**
 * Runs inside the template-preview iframe: tells the host it is ready, then imports the design the
 * host hands back. The design is delivered exactly once, so the listener detaches itself afterwards.
 *
 * @returns a cleanup function that detaches the listener.
 */
export const initTemplatePreviewReceiver = (): (() => void) => {
  const { parent } = window;

  // Not embedded in a host frame – nothing to receive.
  if (!parent || parent === window) return () => {};

  const handleMessage = async ({ data, origin, source }: MessageEvent) => {
    // Only trust messages from our host frame on the same origin.
    if (source !== parent || origin !== window.location.origin || !isSetContentMessage(data)) return;

    window.removeEventListener('message', handleMessage);

    // readBeam restores the design and, since the buffer is flagged as a template, keeps template mode.
    const file = new File([data.beamBuffer], 'template-preview.beam', { type: 'application/octet-stream' });

    await beamFileHelper.readBeam(file);
  };

  window.addEventListener('message', handleMessage);
  parent.postMessage({ type: TEMPLATE_PREVIEW_READY }, window.location.origin);

  return () => window.removeEventListener('message', handleMessage);
};
