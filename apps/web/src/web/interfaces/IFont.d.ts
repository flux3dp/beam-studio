import { Font } from 'fontkit';
import { IUser } from 'interfaces/IUser';

export interface IFont {
  family?: string;
  postscriptName?: string;
  style?: string;
  weight?: number;
  italic?: boolean;
}

export interface IFontQuery {
  family: string;
  style?: string;
  weight?: number;
  italic?: boolean; // not sure about type
}

export interface FontHelper {
  findFont: (fontDescriptor: FontDescriptor) => FontDescriptor;
  findFonts: (fontDescriptor: FontDescriptor) => FontDescriptor[];
  getAvailableFonts: (withoutMonotype?: boolean) => FontDescriptor[];
  getFontName: (font: FontDescriptor) => string;
  getWebFontAndUpload: (postscriptName: string) => Promise<boolean>;
  getWebFontPreviewUrl: (fontFamily: string) => string | null;
  getMonotypeFonts: () => Promise<boolean>;
  applyMonotypeStyle: (
    font: WebFont | IFont,
    user: IUser | null,
    silent?: boolean
  ) => Promise<{ success: boolean; fontLoadedPromise?: Promise<void> }>;
  getMonotypeUrl: (postscriptName: string) => Promise<string | null>;
  usePostscriptAsFamily: (font?: FontDescriptor | string) => boolean;
}

export interface LocalFontHelper {
  findFont: (fontDescriptor: FontDescriptor) => FontDescriptor | null;
  findFonts: (fontDescriptor: FontDescriptor) => FontDescriptor[];
  getAvailableFonts: () => FontDescriptor[];
  substituteFont: (postscriptName: string, text: string) => FontDescriptor | null;
  getFontName: (font: FontDescriptor) => string;
  getLocalFont: (font: FontDescriptor) => Font | undefined;
}

export type FontDescriptorKeys = 'postscriptName' | 'family' | 'style' | 'weight' | 'italic';

export interface FontDescriptor {
  path?: string;
  postscriptName?: string;
  family?: string;
  style?: string;
  weight?: number;
  width?: number;
  italic?: boolean;
  monospace?: boolean;
}

export interface WebFont {
  family: string;
  italic: boolean;
  postscriptName: string;
  style: string;
  weight: number;
  queryString?: string;
  fileName?: string;
  supportLangs?: string[];
  hasLoaded?: boolean;
  collectionIdx?: number;
  fontkitError?: boolean;
}
