import type { Font } from 'fontkit';

import type { IUser } from '@core/interfaces/IUser';

/**
 * For storage default-font
 */
export interface IDefaultFont {
  family: string;
  postscriptName: string;
  style: string;
}

export interface IFont {
  family?: string;
  italic?: boolean;
  postscriptName?: string;
  style?: string;
  weight?: number;
}

/**
 * For requestFontByFamilyAndStyle
 */
export interface IFontQuery {
  family: string;
  italic?: boolean; // not sure about type
  style?: string;
  weight?: number;
}

export interface FontHelper {
  applyMonotypeStyle: (
    font: IFont | WebFont,
    user: IUser | null,
    silent?: boolean,
  ) => Promise<{ fontLoadedPromise?: Promise<void>; success: boolean }>;
  findFont: (fontDescriptor: FontDescriptorQuery) => GeneralFont;
  findFonts: (fontDescriptor: FontDescriptorQuery) => GeneralFont[];
  getAvailableFonts: (withoutMonotype?: boolean) => GeneralFont[];
  getFontName: (font: GeneralFont) => string;
  getMonotypeFonts: () => Promise<boolean>;
  getMonotypeUrl: (postscriptName: string) => Promise<null | string>;
  getWebFontAndUpload: (postscriptName: string) => Promise<boolean>;
  getWebFontPreviewUrl: (fontFamily: string) => null | string;
  usePostscriptAsFamily: (font?: GeneralFont) => boolean;
}

export interface LocalFontHelper {
  findFont: (fontDescriptor: FontDescriptorQuery) => FontDescriptor | null;
  findFonts: (fontDescriptor: FontDescriptorQuery) => FontDescriptor[];
  getAvailableFonts: () => FontDescriptor[];
  getFontName: (font: FontDescriptor) => string;
  getLocalFont: (font: FontDescriptor) => Font | undefined;
  substituteFont: (postscriptName: string, text: string) => FontDescriptor | null;
}

export type FontDescriptorKeys = 'family' | 'italic' | 'postscriptName' | 'style' | 'weight';

/**
 *  Font result from font-scanner
 */
export interface FontDescriptor {
  family: string;
  italic: boolean;
  monospace: boolean;
  path: string;
  postscriptName: string;
  style: string;
  weight: number;
  width: number;
}

export type FontDescriptorQuery = Partial<Omit<FontDescriptor, 'path'>>;

export interface WebFont {
  collectionIdx?: number;
  family: string;
  fileName?: string;
  fontkitError?: boolean;
  /**
   * Monotype font loaded
   */
  hasLoaded?: boolean;
  italic: boolean;
  postscriptName: string;
  queryString?: string;
  style: string;
  supportLangs?: string[];
  weight: number;
}

export type GoogleFont = {
  binaryLoader?: (family: string, weight?: number, style?: 'italic' | 'normal') => Promise<ArrayBuffer | null>;
  family: string;
  italic: boolean;
  postscriptName: string;
  source: 'google';
  style: string;
  weight: number;
};

export type GeneralFont = FontDescriptor | GoogleFont | WebFont;
