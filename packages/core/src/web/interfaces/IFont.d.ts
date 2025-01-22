import type { Font } from 'fontkit';

import type { IUser } from '@core/interfaces/IUser';

export interface IFont {
  family?: string;
  italic?: boolean;
  postscriptName?: string;
  style?: string;
  weight?: number;
}

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
  findFont: (fontDescriptor: FontDescriptor) => FontDescriptor;
  findFonts: (fontDescriptor: FontDescriptor) => FontDescriptor[];
  getAvailableFonts: (withoutMonotype?: boolean) => FontDescriptor[];
  getFontName: (font: FontDescriptor) => string;
  getMonotypeFonts: () => Promise<boolean>;
  getMonotypeUrl: (postscriptName: string) => Promise<null | string>;
  getWebFontAndUpload: (postscriptName: string) => Promise<boolean>;
  getWebFontPreviewUrl: (fontFamily: string) => null | string;
  usePostscriptAsFamily: (font?: FontDescriptor | string) => boolean;
}

export interface LocalFontHelper {
  findFont: (fontDescriptor: FontDescriptor) => FontDescriptor | null;
  findFonts: (fontDescriptor: FontDescriptor) => FontDescriptor[];
  getAvailableFonts: () => FontDescriptor[];
  getFontName: (font: FontDescriptor) => string;
  getLocalFont: (font: FontDescriptor) => Font | undefined;
  substituteFont: (postscriptName: string, text: string) => FontDescriptor | null;
}

export type FontDescriptorKeys = 'family' | 'italic' | 'postscriptName' | 'style' | 'weight';

export interface FontDescriptor {
  family?: string;
  italic?: boolean;
  monospace?: boolean;
  path?: string;
  postscriptName?: string;
  style?: string;
  weight?: number;
  width?: number;
}

export interface WebFont {
  collectionIdx?: number;
  family: string;
  fileName?: string;
  fontkitError?: boolean;
  hasLoaded?: boolean;
  italic: boolean;
  postscriptName: string;
  queryString?: string;
  style: string;
  supportLangs?: string[];
  weight: number;
}
