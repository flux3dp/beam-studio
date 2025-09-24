export const RETRY_JITTER_MAX = 1000;
export const MAX_CONCURRENT_LOADS = 5;
export const NETWORK_STATE_CHECK_INTERVAL = 30000;
export const CSS_CLEANUP_INTERVAL = 300000;

export const DEFAULT_FONT_WEIGHT = 400;
export const FONT_HISTORY_MAX_SIZE = 5;
export const INITIAL_USAGE_COUNT = 1;
export const QUEUE_PROCESS_DELAY = 100;

export const WEIGHT_FALLBACK_ORDER = [400, 500, 300, 600, 200, 700, 100, 800, 900] as const;

export const PRIORITY_ORDER = { critical: 0, high: 1, low: 3, normal: 2 } as const;

export const ICON_FONT_KEYWORDS = ['icons'] as const;

export const DEFAULT_FALLBACK_FONT = 'Arial, sans-serif';

export const WEB_SAFE_FONTS = [
  'Arial',
  'Arial Black',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Palatino Linotype',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
] as const;

export const FALLBACK_POSTSCRIPT_NAMES: Record<string, string> = {
  Arial: 'ArialMT',
  'Arial Black': 'Arial-Black',
  'Comic Sans MS': 'ComicSansMS',
  'Courier New': 'CourierNewPSMT',
  Georgia: 'Georgia',
  Helvetica: 'Helvetica',
  Impact: 'Impact',
  'Lucida Console': 'LucidaConsole',
  'Lucida Sans Unicode': 'LucidaSansUnicode',
  'Palatino Linotype': 'PalatinoLinotype',
  Tahoma: 'Tahoma',
  'Times New Roman': 'TimesNewRomanPSMT',
  'Trebuchet MS': 'TrebuchetMS',
  Verdana: 'Verdana',
} as const;

export const WEIGHT_STYLES: Record<number, string> = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
} as const;
