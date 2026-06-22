import progressCaller from '@core/app/actions/progress-caller';

import importDxf from './importDxf';

// Guard against importing the same paste twice when more than one paste entry
// point fires for a single Ctrl+V (native clipboard path + document paste event).
let importing = false;

/**
 * Heuristic check for DXF text on the clipboard (e.g. produced by AutoCAD's
 * BEAMCOPY / clip.exe). DXF group codes are right-justified, so the file starts
 * with something like "  0\r\nSECTION\r\n".
 */
export const looksLikeDxfText = (text: string): boolean => {
  if (!text) {
    return false;
  }

  const head = text.slice(0, 1024);

  return (
    /(^|\r?\n)\s*0\r?\n\s*SECTION\r?\n/.test(head) ||
    (head.includes('SECTION') && text.includes('ENTITIES') && text.includes('EOF'))
  );
};

/**
 * If the given text is DXF, import it. Returns true if an import was handled.
 */
export const importDxfFromText = async (text: string): Promise<boolean> => {
  const isDxf = looksLikeDxfText(text);

  console.log('[DXF paste] looksLikeDxfText:', isDxf, '| already importing:', importing, '| length:', text?.length);

  if (importing || !isDxf) {
    return false;
  }

  importing = true;

  try {
    console.log('[DXF paste] calling importDxf...');
    await importDxf(new Blob([text], { type: 'application/dxf' }));
    console.log('[DXF paste] importDxf finished');

    return true;
  } catch (e) {
    console.error('[DXF paste] importDxf threw:', e);

    return false;
  } finally {
    importing = false;
    // importDxf opens the "Loading image" progress but relies on its caller to
    // close it (handleFile does). We call importDxf directly, so close it here.
    progressCaller.popById('loading_image');
  }
};

/**
 * Read the system clipboard and import it if it contains DXF text.
 * Returns true if an import was handled.
 */
export const importDxfFromClipboard = async (): Promise<boolean> => {
  try {
    const text = await navigator.clipboard.readText();

    console.log('[DXF paste] clipboard read ok | length:', text?.length, '| head:', JSON.stringify(text?.slice(0, 40)));

    return await importDxfFromText(text);
  } catch (e) {
    console.error('[DXF paste] clipboard read FAILED:', e);

    return false;
  }
};
