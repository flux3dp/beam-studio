import isWeb from '@core/helpers/is-web';
import type { FontDescriptor, GeneralFont, WebFont } from '@core/interfaces/IFont';

/**
 * Fonts shipped inside the app under `assets/fonts/` (copied from core `assets/assets/fonts/`
 * by both webpack configs). They resolve by postscript name ahead of OS/web fonts and work offline.
 *
 * - Electron reads the file from disk via localFontHelper (nodeIntegration), like an OS font.
 * - Web fetches the same relative URL from its own dist, like an S3 web font.
 *
 * Each font's license text lives next to it in the same folder.
 */
interface BundledFont {
  family: string;
  fileName: string;
  postscriptName: string;
  style: string;
  weight: number;
}

const BUNDLED_FONTS: BundledFont[] = [
  // Montserrat Medium — SIL OFL 1.1 (Montserrat-OFL.txt). Required sans-serif for stamp 統一編號 lines.
  {
    family: 'Montserrat',
    fileName: 'Montserrat-Medium.ttf',
    postscriptName: 'Montserrat-Medium',
    style: 'Medium',
    weight: 500,
  },
  // Lobster Regular — SIL OFL 1.1 (Lobster-OFL.txt). Script face for the stamp pet-shop template.
  {
    family: 'Lobster',
    fileName: 'Lobster-Regular.ttf',
    postscriptName: 'Lobster-Regular',
    style: 'Regular',
    weight: 400,
  },
];

const relativeUrl = (font: BundledFont) => `assets/fonts/${font.fileName}`;

/** Absolute filesystem path of a bundled font in the Electron renderer (page is loaded via file://). */
const localPath = (font: BundledFont): string => {
  const { pathname } = new URL(relativeUrl(font), window.location.href);
  const decoded = decodeURIComponent(pathname);

  // file:///C:/x on Windows → pathname is "/C:/x"
  return /^\/[A-Za-z]:/.test(decoded) ? decoded.slice(1) : decoded;
};

const toGeneralFont = (font: BundledFont): GeneralFont => {
  const base = {
    family: font.family,
    italic: false,
    postscriptName: font.postscriptName,
    style: font.style,
    weight: font.weight,
  };

  if (isWeb()) return { ...base, fileName: font.fileName, url: relativeUrl(font) } satisfies WebFont;

  return { ...base, monospace: false, path: localPath(font), width: 5 } satisfies FontDescriptor;
};

export const getBundledFont = (postscriptName: string): GeneralFont | undefined => {
  const font = BUNDLED_FONTS.find((f) => f.postscriptName === postscriptName);

  return font ? toGeneralFont(font) : undefined;
};

const applied = new Set<string>();

/** Injects the @font-face so the DOM can measure/render the font before it's converted to paths. */
export const applyBundledFontStyle = (postscriptName: string): void => {
  const font = BUNDLED_FONTS.find((f) => f.postscriptName === postscriptName);

  if (!font || applied.has(postscriptName)) return;

  const style = document.createElement('style');

  style.innerHTML = `@font-face { font-family: '${font.family}'; font-style: normal; font-weight: ${font.weight}; src: url('${relativeUrl(font)}'); }`;
  document.head.appendChild(style);
  applied.add(postscriptName);
};
