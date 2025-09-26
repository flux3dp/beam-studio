/**
 * Network Utilities
 *
 * @deprecated Some utilities are being consolidated. Use consolidatedUtils.ts where possible.
 * Keeping network-specific functions here due to type dependencies.
 */

import type { NetworkState } from '../types';

// Re-export from consolidated utilities
export { getConnectionQuality, isNetworkAvailable } from './consolidatedUtils';

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
