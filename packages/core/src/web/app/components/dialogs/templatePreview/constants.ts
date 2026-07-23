// Contract shared between the modal that opens the preview iframe (TemplatePreview) and the studio
// app running inside that iframe (interactionModeStore reads the query param on load).

/** Query param (in the hash) that tells the studio to boot straight into template mode. */
export const TEMPLATE_PREVIEW_QUERY_KEY = 'templatePreview';
/** Sent by the iframe once it is mounted and ready to receive the design. */
export const TEMPLATE_PREVIEW_READY = 'template-preview-ready';
/** Sent by the host to hand the captured design (a .beam file buffer) to the iframe. */
export const TEMPLATE_PREVIEW_SET_CONTENT = 'template-preview-set-content';

export interface TemplatePreviewSetContentMessage {
  /** Contents of a .beam file (svg + image sources + thumbnails), transferred to the iframe. */
  beamBuffer: ArrayBuffer;
  type: typeof TEMPLATE_PREVIEW_SET_CONTENT;
}
