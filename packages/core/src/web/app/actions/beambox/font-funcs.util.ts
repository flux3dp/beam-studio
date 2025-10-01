import { create, type Font } from 'fontkit';

import fontHelper from '@core/helpers/fonts/fontHelper';
import isWeb from '@core/helpers/is-web';
import type { GoogleFont, WebFont } from '@core/interfaces/IFont';

export const loadGoogleFont = async (font: GoogleFont): Promise<Font | undefined> => {
  if (!font.binaryLoader) {
    throw new Error('Google Font binary loader is not available.');
  }

  const weight = font.weight || 400;
  const style = font.italic ? 'italic' : 'normal';

  const fontBuffer = await font.binaryLoader(font.family, weight, style);

  if (!fontBuffer) {
    throw new Error(`Failed to load Google Font binary for: ${font.family}`);
  }

  const buffer = Buffer.from(fontBuffer);

  if (buffer.length === 0) {
    throw new Error(`Buffer is empty for font ${font.family}`);
  }

  // Check font signature for debugging
  const signature = buffer.subarray(0, 4).toString('hex');
  const signatureAscii = buffer.subarray(0, 4).toString('ascii');

  // Common signatures:
  // '00010000' = TrueType
  // '4f54544f' = 'OTTO' = OpenType with CFF
  // '74746366' = 'ttcf' = TrueType Collection  // cspell:disable-line
  // '774f4646' = 'wOFF' = WOFF (shouldn't happen after decompression)
  // '774f4632' = 'wOF2' = WOFF2 (shouldn't happen after decompression)
  if (signature === '774f4646' || signature === '774f4632') {
    throw new Error(`Font still compressed (${signatureAscii}). Decompression failed.`);
  }

  let fontCollection;

  try {
    fontCollection = create(buffer);
  } catch (error) {
    console.error(`Fontkit failed to parse font ${font.family}:`, error);
    console.log('Buffer details:', {
      first10Bytes: Array.from(buffer.subarray(0, 10)),
      length: buffer.length,
      signature,
      signatureAscii,
    });

    // Provide more specific error info
    if (signature === '00000000') {
      throw new Error(`Font buffer is null/corrupted`);
    }

    throw new Error(`Fontkit parse error: ${error}`);
  }

  // Handle both single fonts and font collections (.ttc)
  if ('fonts' in fontCollection) {
    const matchedFont = fontCollection.fonts.find((f) => f.postscriptName === font.postscriptName);

    if (matchedFont) {
      return matchedFont;
    }

    console.warn(`Postscript name ${font.postscriptName} not found in collection. Returning first font.`);

    return fontCollection.fonts[0]; // Fallback to the first font
  }

  return fontCollection;
};

// --- Helper function for other Web Fonts (S3, Monotype) ---
export const loadWebFont = async (font: WebFont): Promise<Font | undefined> => {
  const { collectionIdx = 0, postscriptName } = font;
  let url: null | string | undefined;

  if ('hasLoaded' in font) {
    // Indicates a Monotype font
    url = await fontHelper.getMonotypeUrl(postscriptName!);
  } else {
    // Default to S3 bucket
    const fileName = font.fileName || `${postscriptName}.ttf`;
    const protocol = isWeb() ? window.location.protocol : 'https:';

    url = `${protocol}//beam-studio-web.s3.ap-northeast-1.amazonaws.com/fonts/${fileName}`;
  }

  if (!url) {
    console.error(`Could not determine a valid URL for font: ${postscriptName}`);

    return undefined;
  }

  const response = await fetch(url, { mode: 'cors' });
  const buffer = Buffer.from(await response.arrayBuffer());
  const fontCollection = create(buffer);

  // Handle both single fonts and font collections (.ttc)
  if ('fonts' in fontCollection) {
    return fontCollection.fonts[collectionIdx]; // It's a collection
  }

  // It's a single font
  return fontCollection;
};
