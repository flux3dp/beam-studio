import { create, type Font } from 'fontkit';

import fontHelper from '@core/helpers/fonts/fontHelper';
import isWeb from '@core/helpers/is-web';
import type { GoogleFont, WebFont } from '@core/interfaces/IFont';
// Assuming these types are defined elsewhere, e.g.:
// type GeneralFont = LocalFont | GoogleFont | WebFont;

// --- Helper function for Google Fonts ---
export const loadGoogleFont = async (font: GoogleFont): Promise<Font | undefined> => {
  if (!font.binaryLoader) {
    throw new Error('Google Font binary loader is not available.');
  }

  console.log(`Loading Google Font binary for: ${font.family}`);

  const weight = font.weight || 400;
  const style = font.italic ? 'italic' : 'normal';

  const fontBuffer = await font.binaryLoader(font.family, weight, style);

  if (!fontBuffer) {
    throw new Error(`Failed to load Google Font binary for: ${font.family}`);
  }

  // Create Buffer from ArrayBuffer correctly
  // CRITICAL FIX: Buffer.from(ArrayBuffer) doesn't accept offset/length as separate params
  // That syntax is only for Buffer-to-Buffer copying!
  const buffer = Buffer.from(fontBuffer);

  console.log(`Creating fontkit font from buffer (${buffer.length} bytes)`);

  // Validate buffer is not empty
  if (buffer.length === 0) {
    throw new Error(`Buffer is empty for font ${font.family}`);
  }

  // Check font signature for debugging
  const signature = buffer.subarray(0, 4).toString('hex');
  const signatureAscii = buffer.subarray(0, 4).toString('ascii');

  console.log(`Font signature: 0x${signature} ('${signatureAscii}')`);

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
    console.log(`Fontkit successfully created font object`);
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

  console.log(`Loaded Google Font binary for: ${font.family}`, fontCollection);

  // Handle both single fonts and font collections (.ttc)
  if ('fonts' in fontCollection) {
    console.log(`Font collection detected with ${fontCollection.fonts.length} fonts`);

    // Log all available postscript names for debugging
    fontCollection.fonts.forEach((f, idx) => {
      console.log(`  [${idx}] ${f.postscriptName} (fullName: ${f.fullName})`);
    });

    // If it's a collection, find the specific font by postscriptName
    const matchedFont = fontCollection.fonts.find((f) => f.postscriptName === font.postscriptName);

    if (matchedFont) {
      console.log(`Found matching font: ${matchedFont.postscriptName}`);

      return matchedFont;
    }

    console.warn(`Postscript name ${font.postscriptName} not found in collection. Returning first font.`);

    return fontCollection.fonts[0]; // Fallback to the first font
  }

  // If it's a single font, verify it has glyphs and return it
  console.log(`Single font loaded: ${fontCollection.postscriptName} (fullName: ${fontCollection.fullName})`);

  // Debug: Check if font has basic glyphs
  const testChars = ['A', 'a', '1', ' '];
  const missingGlyphs = testChars.filter((char) => !fontCollection.hasGlyphForCodePoint(char.charCodeAt(0)));

  if (missingGlyphs.length > 0) {
    console.warn(`Font ${fontCollection.postscriptName} missing basic glyphs for: ${missingGlyphs.join(', ')}`);
  }

  console.log(`Font glyph count: ${fontCollection.numGlyphs}`);

  return fontCollection;
};

// --- Helper function for other Web Fonts (S3, Monotype) ---
export const loadWebFont = async (font: WebFont): Promise<Font | undefined> => {
  const { collectionIdx = 0, postscriptName } = font;
  let url: null | string | undefined;

  console.log(`Loading Web Font: ${postscriptName}`, font);

  // Determine the font URL (Monotype has priority)
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

  console.log(`Loaded font from URL: ${url}`, fontCollection);

  // Handle both single fonts and font collections (.ttc)
  if ('fonts' in fontCollection) {
    return fontCollection.fonts[collectionIdx]; // It's a collection
  }

  // It's a single font
  return fontCollection;
};
