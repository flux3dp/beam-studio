import type { GeneralFont } from '@core/interfaces/IFont';

export interface NetworkState {
  effectiveType?: string;
  isOnline: boolean;
  lastChecked: number;
}

export interface GoogleFontBinary {
  buffer: ArrayBuffer;
  family: string;
  style: 'italic' | 'normal';
  timestamp: number;
  weight: number;
}

export type FontLoadPurpose = 'context' | 'preview' | 'static' | 'text-editing';
export type FontLoadPriority = 'critical' | 'high' | 'low' | 'normal';

export interface FontLoadOptions {
  fontFamily: string;
  forceReload?: boolean;
  priority?: FontLoadPriority;
  purpose: FontLoadPurpose;
  style?: 'italic' | 'normal';
  weight?: number;
}

export interface CSSLinkTracker {
  element: HTMLLinkElement;
  fontFamily: string;
  lastUsed: number;
  purpose: FontLoadPurpose;
  url: string;
  usageCount: number;
}

export interface GoogleFontState {
  activeFontLoads: Set<string>;
  addToHistory: (font: GeneralFont) => void;
  cachedBinaries: Map<string, GoogleFontBinary>;
  cleanupUnusedCSSLinks: (maxAge?: number) => void;
  clearBinaryCache: () => void;
  cssLinks: Map<string, CSSLinkTracker>;
  failedLoads: Map<string, { count: number; error?: string; lastAttempt: number }>;
  getBinaryFromCache: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => GoogleFontBinary | null;
  getFallbackFont: (googleFontFamily: string) => string;
  getFallbackPostScriptName: (fallbackFont: string) => string;
  getLoadedFonts: () => string[];
  getRegisteredFonts: () => string[];
  isGoogleFontLoaded: (fontFamily: string) => boolean;
  isGoogleFontLoading: (fontFamily: string) => boolean;
  isGoogleFontRegistered: (fontFamily: string) => boolean;
  isNetworkAvailableForGoogleFonts: () => boolean;
  isWebSafeFont: (fontFamily: string) => boolean;
  loadGoogleFont: (fontFamily: string) => Promise<void>;
  loadGoogleFontBinary: (
    fontFamily: string,
    weight?: number,
    style?: 'italic' | 'normal',
  ) => Promise<ArrayBuffer | null>;
  loadGoogleFontForPreview: (fontFamily: string) => Promise<void>;
  loadGoogleFontForTextEditing: (fontFamily: string) => Promise<void>;
  loadGoogleFontWithOptions: (options: FontLoadOptions) => Promise<void>;
  loadingFonts: Set<string>;
  networkState: NetworkState;
  processQueue: () => void;
  queuedFontLoads: Array<{ fontFamily: string; priority: FontLoadPriority; purpose: FontLoadPurpose }>;
  registeredFonts: Set<string>;
  registerGoogleFont: (fontFamily: string) => Promise<void>;
  retryFailedFont: (fontFamily: string) => Promise<void>;
  sessionLoadedFonts: Set<string>;
  updateNetworkState: () => void;
}
