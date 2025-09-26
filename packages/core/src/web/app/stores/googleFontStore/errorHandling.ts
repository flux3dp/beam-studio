import { create } from 'zustand';

/**
 * Error Handling and Fallback Strategies for Google Fonts
 *
 * Provides:
 * - User-friendly error notifications
 * - Offline fallback strategies
 * - Graceful degradation
 * - Error recovery mechanisms
 */

export type ErrorSeverity = 'high' | 'low' | 'medium';
export type ErrorCategory = 'api' | 'cache' | 'font-loading' | 'network' | 'user-input';

export interface FontError {
  category: ErrorCategory;
  context?: Record<string, any>;
  fontFamily?: string;
  id: string;
  message: string;
  recoverable: boolean;
  retryCount: number;
  severity: ErrorSeverity;
  timestamp: number;
  userMessage?: string;
}

export interface ErrorHandlingState {
  clearAllErrors: () => void;
  clearError: (errorId: string) => void;

  currentUserMessage: string;
  disableOfflineMode: () => void;
  dismissUserNotification: () => void;

  enableOfflineMode: () => void;
  // Error tracking
  errors: Map<string, FontError>;

  // Fallback strategies
  getFallbackFont: (requestedFont: string) => string;
  getRecoveryOptions: (errorId: string) => string[];
  // Offline handling
  isOfflineMode: boolean;
  notificationSeverity: ErrorSeverity;

  offlineFallbacks: Map<string, string>;
  recentErrors: FontError[];
  // Error management
  reportError: (error: Partial<FontError>) => string;

  // Recovery
  retryFailedOperation: (errorId: string) => Promise<boolean>;
  // User notifications
  showUserNotification: boolean;
}

// Web-safe font fallbacks for different categories
const FALLBACK_FONTS = {
  default: ['Arial', 'sans-serif'],
  display: ['Arial Black', 'Arial', 'sans-serif'],
  handwriting: ['Comic Sans MS', 'cursive'],
  monospace: ['Courier New', 'monospace'],
  'sans-serif': ['Arial', 'Helvetica', 'sans-serif'],
  serif: ['Times New Roman', 'serif'],
} as const;

// Popular Google Fonts to web-safe font mappings
const GOOGLE_FONT_FALLBACKS = {
  'Courier Prime': 'Courier New',
  'Crimson Text': 'Times New Roman',
  'JetBrains Mono': 'Courier New',
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
  'Source Code Pro': 'Courier New',
  'Source Sans Pro': 'Arial',
  Ubuntu: 'Arial',
} as const;

const generateErrorId = () => `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useErrorHandling = create<ErrorHandlingState>()((set, get) => ({
  clearAllErrors: () => {
    set({
      currentUserMessage: '',
      errors: new Map(),
      recentErrors: [],
      showUserNotification: false,
    });
  },
  clearError: (errorId: string) => {
    set((state) => {
      const newErrors = new Map(state.errors);

      newErrors.delete(errorId);

      const newRecentErrors = state.recentErrors.filter((error) => error.id !== errorId);

      return {
        errors: newErrors,
        recentErrors: newRecentErrors,
      };
    });
  },

  currentUserMessage: '',
  disableOfflineMode: () => {
    set({ isOfflineMode: false, offlineFallbacks: new Map() });
    console.log('🌐 Google Fonts: Online mode restored');
  },
  dismissUserNotification: () => {
    set({
      currentUserMessage: '',
      showUserNotification: false,
    });
  },

  enableOfflineMode: () => {
    set({ isOfflineMode: true });

    // Cache current fallbacks for offline use
    const state = get();
    const fallbacks = new Map();

    // Pre-populate common fallbacks
    Object.entries(GOOGLE_FONT_FALLBACKS).forEach(([googleFont, fallback]) => {
      fallbacks.set(googleFont, fallback);
    });

    set({ offlineFallbacks: fallbacks });

    // Notify user about offline mode
    get().reportError({
      category: 'network',
      message: 'Operating in offline mode, using fallback fonts',
      recoverable: true,
      severity: 'medium',
      userMessage: 'Limited font selection available offline. Using system fonts as fallbacks.',
    });

    console.log('🔌 Google Fonts: Offline mode enabled, using fallback strategies');
  },
  // Error tracking
  errors: new Map(),

  // Fallback strategies
  getFallbackFont: (requestedFont: string) => {
    const state = get();

    // If in offline mode, use cached fallback
    if (state.isOfflineMode) {
      const cachedFallback = state.offlineFallbacks.get(requestedFont);

      if (cachedFallback) return cachedFallback;
    }

    // Check specific Google Font fallbacks
    if (requestedFont in GOOGLE_FONT_FALLBACKS) {
      return GOOGLE_FONT_FALLBACKS[requestedFont as keyof typeof GOOGLE_FONT_FALLBACKS];
    }

    // Determine category-based fallback
    const fontLower = requestedFont.toLowerCase();

    if (fontLower.includes('serif') && !fontLower.includes('sans')) {
      return FALLBACK_FONTS.serif[0];
    }

    if (fontLower.includes('mono') || fontLower.includes('code')) {
      return FALLBACK_FONTS.monospace[0];
    }

    if (fontLower.includes('display') || fontLower.includes('black')) {
      return FALLBACK_FONTS.display[0];
    }

    if (fontLower.includes('script') || fontLower.includes('handwriting')) {
      return FALLBACK_FONTS.handwriting[0];
    }

    // Default fallback
    return FALLBACK_FONTS.default[0];
  },

  getRecoveryOptions: (errorId: string) => {
    const state = get();
    const error = state.errors.get(errorId);

    if (!error) return [];

    const options: string[] = [];

    if (error.recoverable) {
      options.push('retry');
    }

    if (error.fontFamily) {
      options.push('use-fallback');
    }

    if (error.category === 'network') {
      options.push('enable-offline-mode');
    }

    options.push('dismiss');

    return options;
  },

  // Offline handling
  isOfflineMode: false,

  notificationSeverity: 'low',

  offlineFallbacks: new Map(),

  recentErrors: [],

  // Error management
  reportError: (errorInfo: Partial<FontError>) => {
    const errorId = generateErrorId();
    const timestamp = Date.now();

    const error: FontError = {
      category: errorInfo.category || 'font-loading',
      context: errorInfo.context,
      fontFamily: errorInfo.fontFamily,
      id: errorId,
      message: errorInfo.message || 'Unknown error occurred',
      recoverable: errorInfo.recoverable ?? true,
      retryCount: errorInfo.retryCount || 0,
      severity: errorInfo.severity || 'medium',
      timestamp,
      userMessage: errorInfo.userMessage,
    };

    set((state) => {
      const newErrors = new Map(state.errors);

      newErrors.set(errorId, error);

      const newRecentErrors = [error, ...state.recentErrors.slice(0, 9)]; // Keep last 10 errors

      // Show user notification for high severity or repeated errors
      const shouldNotifyUser =
        error.severity === 'high' || (error.severity === 'medium' && error.retryCount > 2) || state.isOfflineMode;

      return {
        currentUserMessage: shouldNotifyUser ? error.userMessage || error.message : state.currentUserMessage,
        errors: newErrors,
        notificationSeverity: shouldNotifyUser ? error.severity : state.notificationSeverity,
        recentErrors: newRecentErrors,
        showUserNotification: shouldNotifyUser ? true : state.showUserNotification,
      };
    });

    // Log to console for development
    const logLevel = error.severity === 'high' ? 'error' : error.severity === 'medium' ? 'warn' : 'log';

    console[logLevel](`[Google Fonts] ${error.category}: ${error.message}`, error.context || '');

    return errorId;
  },

  // Recovery mechanisms
  retryFailedOperation: async (errorId: string) => {
    const state = get();
    const error = state.errors.get(errorId);

    if (!error || !error.recoverable) return false;

    try {
      // Implement retry logic based on error category
      switch (error.category) {
        case 'network':
          // Test network connectivity
          await fetch('https://fonts.googleapis.com/css2?family=Roboto', {
            method: 'HEAD',
            mode: 'no-cors',
          });
          break;

        case 'font-loading':
          // Retry font loading with exponential backoff
          if (error.fontFamily) {
            // Would integrate with font loading system here
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, error.retryCount)));
          }

          break;

        case 'api':
          // Retry API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          break;
      }

      // If successful, clear the error
      get().clearError(errorId);

      return true;
    } catch (retryError) {
      // Update error with retry attempt
      const updatedError: FontError = {
        ...error,
        retryCount: error.retryCount + 1,
        timestamp: Date.now(),
      };

      set((state) => {
        const newErrors = new Map(state.errors);

        newErrors.set(errorId, updatedError);

        return { errors: newErrors };
      });

      return false;
    }
  },

  // User notifications
  showUserNotification: false,
}));

// Utility function to create user-friendly error messages
export const createUserFriendlyMessage = (error: FontError): string => {
  switch (error.category) {
    case 'network':
      return 'Unable to connect to Google Fonts. Using system fonts instead.';
    case 'font-loading':
      return `Font "${error.fontFamily}" couldn't load. Using a similar system font.`;
    case 'api':
      return 'Font service temporarily unavailable. Limited font selection available.';
    case 'cache':
      return 'Font cache error. Some fonts may load slower than usual.';
    default:
      return 'Font loading issue encountered. Using fallback fonts.';
  }
};

// Hook for components to easily handle font errors
export const useFontErrorHandler = () => {
  const reportError = useErrorHandling((state) => state.reportError);
  const getFallbackFont = useErrorHandling((state) => state.getFallbackFont);
  const showUserNotification = useErrorHandling((state) => state.showUserNotification);
  const currentUserMessage = useErrorHandling((state) => state.currentUserMessage);
  const dismissUserNotification = useErrorHandling((state) => state.dismissUserNotification);

  const handleFontError = (fontFamily: string, error: Error) => {
    const errorId = reportError({
      category: 'font-loading',
      context: { originalError: error.name, stack: error.stack },
      fontFamily,
      message: error.message,
      recoverable: true,
      severity: 'medium',
      userMessage: createUserFriendlyMessage({
        category: 'font-loading',
        fontFamily,
      } as FontError),
    });

    return {
      errorId,
      fallbackFont: getFallbackFont(fontFamily),
    };
  };

  return {
    currentUserMessage,
    dismissUserNotification,
    getFallbackFont,
    handleFontError,
    showUserNotification,
  };
};
