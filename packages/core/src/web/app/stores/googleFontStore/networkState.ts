import { create } from 'zustand';

import { NETWORK_STATE_CHECK_INTERVAL } from './constants';
import type { NetworkState } from './types';

interface NetworkStateStore extends NetworkState {
  getConnectionQuality: () => 'fast' | 'slow' | 'unknown';
  isOnlineForGoogleFonts: () => boolean;
  updateNetworkState: () => void;
}

const createNetworkDetector = (): NetworkState => ({
  effectiveType: (navigator as any)?.connection?.effectiveType || 'unknown',
  isOnline: navigator.onLine,
  lastChecked: Date.now(),
});

const isNetworkAvailableForGoogleFonts = (networkState: NetworkState): boolean => {
  if (!networkState.isOnline) return false;

  // Consider network available if it's been less than 5 minutes since last successful check
  const timeSinceLastCheck = Date.now() - networkState.lastChecked;

  return timeSinceLastCheck < 5 * 60 * 1000; // 5 minutes
};

export const useNetworkState = create<NetworkStateStore>()((set, get) => ({
  ...createNetworkDetector(),

  getConnectionQuality: () => {
    const state = get();

    if (!state.isOnline) return 'unknown';

    // Check connection type from Network Information API
    const connection = (navigator as any)?.connection;

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
  },

  isOnlineForGoogleFonts: () => {
    const state = get();

    return isNetworkAvailableForGoogleFonts(state);
  },

  updateNetworkState: () => {
    const newState = createNetworkDetector();

    set(newState);

    // Trigger font queue processing if we came back online
    if (newState.isOnline) {
      // Import dynamically to avoid circular dependency
      import('./fontLoading').then(({ useFontLoading }) => {
        const fontLoading = useFontLoading.getState();

        if (fontLoading.queuedFontLoads.length > 0) {
          fontLoading.processQueue();
        }
      });
    }
  },
}));

// Set up network event listeners and periodic checks
if (typeof window !== 'undefined') {
  const store = useNetworkState.getState();

  // Listen to network events
  window.addEventListener('online', () => {
    console.log('📶 Network came online, updating Google Font loading state');
    store.updateNetworkState();
  });

  window.addEventListener('offline', () => {
    console.log('📵 Network went offline, pausing Google Font loading');
    store.updateNetworkState();
  });

  // Listen to connection changes (if supported)
  if ('connection' in navigator) {
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection && 'addEventListener' in connection) {
      connection.addEventListener('change', () => {
        console.log('📡 Network connection changed, updating state');
        store.updateNetworkState();
      });
    }
  }

  // Periodic network state checks
  setInterval(() => {
    const currentState = useNetworkState.getState();

    if (Date.now() - currentState.lastChecked > NETWORK_STATE_CHECK_INTERVAL) {
      store.updateNetworkState();
    }
  }, NETWORK_STATE_CHECK_INTERVAL);
}
