import React, { useCallback, useEffect, useRef } from 'react';

import { generateBeamBuffer } from '@core/helpers/file/export';
import { hashMap } from '@core/helpers/hashHelper';

import type { TemplatePreviewSetContentMessage } from './constants';
import { TEMPLATE_PREVIEW_QUERY_KEY, TEMPLATE_PREVIEW_READY, TEMPLATE_PREVIEW_SET_CONTENT } from './constants';

/**
 * TemplatePreview renders the current design inside an isolated iframe that loads the studio in
 * template-preview mode. The design is captured once as a .beam buffer and handed to the iframe
 * right after it becomes ready.
 *
 * The iframe side (studio app) opts into preview mode via the `templatePreview` query parameter and
 * receives the .beam buffer through the postMessage contract defined in ./constants.
 */

const getPreviewUrl = (): string => {
  return `${window.location.origin}?${TEMPLATE_PREVIEW_QUERY_KEY}=true${hashMap.editor}`;
};

interface Props {
  className?: string;
  /** When false, the iframe ignores pointer events (needed so it doesn't swallow drag events). */
  interactive?: boolean;
}

const TemplatePreview = ({ className, interactive = true }: Props): React.JSX.Element => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // The design, captured once as a .beam buffer at the moment the preview opened.
  const beamBufferRef = useRef<ArrayBuffer | null>(null);
  // The iframe reports ready before the buffer may be finished; both must be true to send.
  const isIframeReadyRef = useRef(false);
  const hasSentRef = useRef(false);

  const trySend = useCallback(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    const beamBuffer = beamBufferRef.current;

    if (hasSentRef.current || !isIframeReadyRef.current || !beamBuffer || !iframeWindow) return;

    hasSentRef.current = true;

    const message: TemplatePreviewSetContentMessage = { beamBuffer, type: TEMPLATE_PREVIEW_SET_CONTENT };

    // Transfer the buffer to avoid copying a potentially large payload.
    iframeWindow.postMessage(message, window.location.origin, [beamBuffer]);
  }, []);

  // Capture the current design as a .beam buffer once, then try to hand it over.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // `silent` skips the "edit target layers" prompt; `templateMode` flags it as a template.
      const buffer = await generateBeamBuffer({ silent: true, templateMode: true });

      if (cancelled) return;

      // Copy out of the (possibly pooled) Buffer into a standalone ArrayBuffer for transfer.
      beamBufferRef.current = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;
      trySend();
    })();

    return () => {
      cancelled = true;
    };
  }, [trySend]);

  useEffect(() => {
    const handleMessage = ({ data, source }: MessageEvent) => {
      // Only react to the ready signal coming from our own iframe.
      if (source !== iframeRef.current?.contentWindow) return;

      if (data?.type === TEMPLATE_PREVIEW_READY) {
        isIframeReadyRef.current = true;
        trySend();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, [trySend]);

  // The design is handed over only in response to the iframe's ready signal (see the effect above).
  // We deliberately avoid sending on `onLoad`: it fires before the iframe's app mounts its listener,
  // so it could consume the one-shot send before anyone is listening.
  return (
    <iframe
      className={className}
      ref={iframeRef}
      src={getPreviewUrl()}
      style={{
        border: 'none',
        borderRadius: 'inherit',
        display: 'block',
        height: '100%',
        pointerEvents: interactive ? undefined : 'none',
        width: '100%',
      }}
      title="template-preview"
    />
  );
};

export default TemplatePreview;
