import type { GeneralFont, GoogleFont } from '@core/interfaces/IFont';

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
  cachedBinaries: Map<string, GoogleFontBinary>;
  cssLinks: Map<string, CSSLinkTracker>;
  failedLoads: Map<string, { count: number; error?: string; lastAttempt: number }>;
  networkState: NetworkState;
  queuedFontLoads: Array<{ fontFamily: string; priority: FontLoadPriority; purpose: FontLoadPurpose }>;
  registeredFonts: Map<string, GoogleFont>;
  sessionLoadedFonts: Set<string>;
}

export interface GoogleFontActions {
  addToHistory: (font: GeneralFont) => void;
  cleanupUnusedCSSLinks: (maxAge?: number) => void;
  getBinaryFromCache: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => GoogleFontBinary | null;
  getFallbackFont: (googleFontFamily: string) => string;
  getFallbackPostScriptName: (fallbackFont: string) => string;
  getRegisteredFont: (postscriptName: string) => GoogleFont | undefined;
  isGoogleFontLoaded: (fontFamily: string) => boolean;
  isLocalFont: (fontFamily: string) => boolean;
  isNetworkAvailableForGoogleFonts: () => boolean;
  isRegistered: (postscriptName: string) => boolean;
  loadGoogleFont: (fontFamily: string) => Promise<void>;
  loadGoogleFontBinary: (
    fontFamily: string,
    weight?: number,
    style?: 'italic' | 'normal',
  ) => Promise<ArrayBuffer | null>;
  loadGoogleFontForPreview: (fontFamily: string) => Promise<void>;
  loadGoogleFontForTextEditing: (fontFamily: string) => Promise<void>;
  processQueue: () => void;
  registerGoogleFont: (fontFamily: string) => Promise<void>;
  updateNetworkState: () => void;
}

export interface GoogleFontStore extends GoogleFontState, GoogleFontActions {}
