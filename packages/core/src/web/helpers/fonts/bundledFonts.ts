import isWeb from '@core/helpers/is-web';
import type { FontDescriptor, GeneralFont, WebFont } from '@core/interfaces/IFont';

/**
 * Fonts shipped inside the app under `assets/fonts/` (copied from core `assets/assets/fonts/`
 * by both webpack configs). They resolve by postscript name ahead of OS/web fonts and work offline.
 *
 * - Electron reads the file from disk via localFontHelper (nodeIntegration), like an OS font.
 * - Web fetches the same relative URL from its own dist, like an S3 web font.
 */
interface BundledFont {
  family: string;
  fileName: string;
  postscriptName: string;
}

const BUNDLED_FONTS: BundledFont[] = [
  // 教育部標準楷書 v5.1 — CC BY-ND 3.0 TW (attribution shown in the stamp generator's text tab)
  { family: '教育部標準楷書', fileName: 'TW-MOE-Std-Kai.ttf', postscriptName: 'TW-MOE-Std-Kai' },
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
    style: 'Regular',
    weight: 400,
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

  style.innerHTML = `@font-face { font-family: '${font.family}'; font-style: normal; font-weight: 400; src: url('${relativeUrl(font)}'); }`;
  document.head.appendChild(style);
  applied.add(postscriptName);
};
