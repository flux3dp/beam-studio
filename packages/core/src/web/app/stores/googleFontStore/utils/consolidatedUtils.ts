/**
 * Consolidated Font Utilities
 *
 * This module consolidates all font-related utility functions to eliminate redundancy
 * and provide a single source of truth for font operations.
 */

import { DEFAULT_FALLBACK_FONT, FALLBACK_POSTSCRIPT_NAMES, ICON_FONT_KEYWORDS, WEB_SAFE_FONTS } from '../constants';

// Re-export existing utilities to maintain compatibility
export { buildGoogleFontURL, discoverAvailableVariants, findBestVariant, getCSSWeight } from './variants';
export {
  createGoogleFontObject,
  generateGoogleFontPostScriptName,
  getWeightAndStyleFromVariant,
  WEIGHT_TO_STYLE_MAP,
} from '@core/helpers/fonts/fontUtils';

/**
 * Font Detection Utilities (consolidated from multiple files)
 */

export const isWebSafeFont = (fontFamily: string): boolean => {
  return WEB_SAFE_FONTS.includes(fontFamily as any);
};

export const isLocalFont = (font: any): boolean => {
  return font && typeof font === 'object' && 'path' in font;
};

export const isIconFont = (fontFamily: string): boolean => {
  const lowerName = fontFamily.toLowerCase();

  return ICON_FONT_KEYWORDS.some((keyword) => lowerName.includes(keyword));
};

export const isGoogleFont = (fontFamily: string): boolean => {
  // Simple heuristic: not web-safe and not containing 'icon'
  return !isWebSafeFont(fontFamily) && !isIconFont(fontFamily);
};

/**
 * Font Fallback Utilities (consolidated)
 */

export const getFallbackFont = (googleFontFamily: string): string => {
  // Enhanced fallback logic
  const lowerName = googleFontFamily.toLowerCase();

  // Category-based fallbacks
  if (lowerName.includes('serif') && !lowerName.includes('sans')) {
    return 'Times New Roman';
  }

  if (lowerName.includes('mono') || lowerName.includes('code')) {
    return 'Courier New';
  }

  if (lowerName.includes('display') || lowerName.includes('black')) {
    return 'Arial Black';
  }

  if (lowerName.includes('script') || lowerName.includes('handwriting')) {
    return 'Comic Sans MS';
  }

  // Specific font mappings (most common Google Fonts)
  const specificMappings: Record<string, string> = {
    Lato: 'Arial',
    Merriweather: 'Times New Roman',
    Montserrat: 'Arial',
    Nunito: 'Arial',
    'Open Sans': 'Arial',
    Oswald: 'Arial Black',
    'Playfair Display': 'Times New Roman',
    Poppins: 'Arial',
    'PT Serif': 'Times New Roman',
    Raleway: 'Arial',
    Roboto: 'Arial',
    'Source Sans Pro': 'Arial',
    Ubuntu: 'Arial',
  };

  return specificMappings[googleFontFamily] || DEFAULT_FALLBACK_FONT;
};

export const getFallbackPostScriptName = (fallbackFont: string): string => {
  return FALLBACK_POSTSCRIPT_NAMES[fallbackFont] || fallbackFont;
};

/**
 * Network Utilities (consolidated)
 */

export const isNetworkAvailable = (networkState: { isOnline: boolean; lastChecked: number }): boolean => {
  if (!networkState.isOnline) return false;

  // Consider network available if it's been less than 5 minutes since last successful check
  const timeSinceLastCheck = Date.now() - networkState.lastChecked;

  return timeSinceLastCheck < 5 * 60 * 1000; // 5 minutes
};

export const getConnectionQuality = (connection?: any): 'fast' | 'slow' | 'unknown' => {
  if (!connection) return 'unknown';

  const effectiveType = connection.effectiveType;

  if (effectiveType === '4g' || effectiveType === '5g') {
    return 'fast';
  } else if (effectiveType === '3g' || effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  }

  // Fallback based on downlink speed if available
  if (connection.downlink) {
    return connection.downlink > 2 ? 'fast' : 'slow';
  }

  return 'unknown';
};

/**
 * Font Validation and Sanitization
 */

export const sanitizeFontFamily = (fontFamily: string): string => {
  return fontFamily.replace(/^['"]+|['"]+$/g, '').trim();
};

export const validateFontFamily = (fontFamily: string): boolean => {
  if (!fontFamily || typeof fontFamily !== 'string') return false;

  const sanitized = sanitizeFontFamily(fontFamily);

  return sanitized.length > 0 && sanitized.length < 100; // Reasonable length limits
};

/**
 * Font Category Classification
 */

export const classifyFontCategory = (
  fontFamily: string,
): 'display' | 'handwriting' | 'monospace' | 'sans-serif' | 'serif' => {
  const lowerName = fontFamily.toLowerCase();

  if (lowerName.includes('serif') && !lowerName.includes('sans')) {
    return 'serif';
  }

  if (lowerName.includes('mono') || lowerName.includes('code')) {
    return 'monospace';
  }

  if (lowerName.includes('display') || lowerName.includes('black')) {
    return 'display';
  }

  if (lowerName.includes('script') || lowerName.includes('handwriting')) {
    return 'handwriting';
  }

  return 'sans-serif'; // Default
};

/**
 * Performance and Caching Utilities
 */

export const generateCacheKey = (fontFamily: string, weight = 400, style: 'italic' | 'normal' = 'normal'): string => {
  return `${sanitizeFontFamily(fontFamily)}-${weight}-${style}`;
};

export const calculateFontSize = (buffer: ArrayBuffer): number => {
  return buffer.byteLength;
};

export const formatMemorySize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;

  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

/**
 * Font Loading Priority Calculation
 */

export const calculateFontPriority = (
  fontFamily: string,
  purpose: 'context' | 'preview' | 'static' | 'text-editing',
  isPopular = false,
): 'high' | 'low' | 'medium' => {
  // High priority for popular fonts
  if (isPopular) return 'high';

  // Medium priority for text editing (permanent use)
  if (purpose === 'text-editing') return 'medium';

  // High priority for context (actively being used)
  if (purpose === 'context') return 'high';

  // Low priority for preview only
  return 'low';
};

/**
 * Error Classification and Handling
 */

export const classifyFontError = (error: Error): 'api' | 'cache' | 'font-loading' | 'network' | 'user-input' => {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
    return 'network';
  }

  if (message.includes('api') || message.includes('service')) {
    return 'api';
  }

  if (message.includes('cache')) {
    return 'cache';
  }

  if (message.includes('font') || message.includes('css') || message.includes('load')) {
    return 'font-loading';
  }

  return 'user-input';
};

export const isRetryableError = (error: Error): boolean => {
  const category = classifyFontError(error);

  return ['api', 'font-loading', 'network'].includes(category);
};

/**
 * Development and Debugging Utilities
 */

export const createFontDebugInfo = (fontFamily: string, context: Record<string, any> = {}) => {
  return {
    category: classifyFontCategory(fontFamily),
    fallback: getFallbackFont(fontFamily),
    fontFamily: sanitizeFontFamily(fontFamily),
    isGoogle: isGoogleFont(fontFamily),
    isIcon: isIconFont(fontFamily),
    isWebSafe: isWebSafeFont(fontFamily),
    timestamp: Date.now(),
    ...context,
  };
};

export const logFontOperation = (operation: string, fontFamily: string, details: Record<string, any> = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Font ${operation}]`, createFontDebugInfo(fontFamily, details));
  }
};
