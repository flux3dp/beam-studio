import { useEffect, useState } from 'react';

import { discoverManager } from '@core/helpers/api/discover';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

// Placeholder serial reported by not-yet-identified machines; never a real device.
const PLACEHOLDER_SERIAL = 'XXXXXXXXXX';

// Identity fields every consumer cares about; enough when only the machine roster matters.
const defaultSignature = (device: IDeviceInfo): string =>
  `${device.serial}|${device.uuid}|${device.model}|${device.name}`;

interface Options {
  /** Extra predicate applied on top of the built-in placeholder-serial filter. */
  filter?: (device: IDeviceInfo) => boolean;
  /**
   * Per-device signature deciding when a poll is considered "changed". Include any field the consumer
   * renders (e.g. live status/progress) so updates aren't deduped away. Defaults to identity fields.
   */
  signature?: (device: IDeviceInfo) => string;
}

/**
 * Subscribes to machine discovery and returns the current device list, re-rendering only when the
 * per-device `signature` changes — not on every discovery poll. Placeholder serials are dropped by
 * default; pass `filter` to narrow further and `signature` to track more fields.
 */
export const useDeviceList = (id: string, { filter, signature = defaultSignature }: Options = {}): IDeviceInfo[] => {
  const [devices, setDevices] = useState<IDeviceInfo[]>([]);

  useEffect(() => {
    const listSignature = (list: IDeviceInfo[]): string => list.map(signature).sort().join(',');
    const unregister = discoverManager.register(id, (discovered) => {
      const next = discovered.filter((device) => device.serial !== PLACEHOLDER_SERIAL && (!filter || filter(device)));

      setDevices((prev) => (listSignature(prev) === listSignature(next) ? prev : next));
    });

    return unregister;
    // filter/signature are expected to be stable; only the registration id drives re-subscription
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [id]);

  return devices;
};

export default useDeviceList;
