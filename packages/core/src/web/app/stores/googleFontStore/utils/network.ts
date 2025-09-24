import type { NetworkState } from '../types';

export const createNetworkDetector = (): NetworkState => {
  const connection =
    (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  return {
    effectiveType: connection?.effectiveType || 'unknown',
    isOnline: navigator.onLine,
    lastChecked: Date.now(),
  };
};

export const isNetworkAvailableForGoogleFonts = (networkState: NetworkState): boolean => {
  if (!networkState.isOnline) {
    return false;
  }

  const connection = (navigator as any).connection;

  if (connection) {
    const slowConnections = ['slow-2g', '2g'];

    if (connection.effectiveType && slowConnections.includes(connection.effectiveType)) {
      console.log(`Skipping Google Fonts due to slow connection: ${connection.effectiveType}`);

      return false;
    }
  }

  return true;
};
