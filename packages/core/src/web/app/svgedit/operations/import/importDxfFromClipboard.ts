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
  if (importing || !looksLikeDxfText(text)) {
    return false;
  }

  importing = true;

  try {
    await importDxf(new Blob([text], { type: 'application/dxf' }));

    return true;
  } catch (error) {
    console.error('Failed to import DXF from clipboard:', error);

    return false;
  } finally {
    importing = false;
    // importDxf opens the "Loading image" progress but relies on its caller to
    // close it (handleFile does). We call importDxf directly, so close it here.
    progressCaller.popById('loading_image');
  }
};
