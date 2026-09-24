/**
 * Events emitted on the shared `'device'` event emitter (see `eventEmitterFactory`), fired when
 * the user starts real device operations. Payloads carry the full `IDeviceInfo` so any listener
 * can read whatever device fields it needs.
 */
export const DeviceOperationEvents = {
  /** A real job was started (Monitor ▶ / beam-easy start). Payload: `IDeviceInfo`. */
  JobStarted: 'job-started',
  /**
   * deviceMaster.select() reached the machine. Payload: `IDeviceInfo`.
   *
   * Fires on every successful select, not only when the machine changed, so a listener that
   * caches per uuid decides for itself whether it has anything to do.
   */
  Selected: 'device-selected',
} as const;
