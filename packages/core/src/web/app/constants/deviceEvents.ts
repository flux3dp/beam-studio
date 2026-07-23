/**
 * Events emitted on the shared `'device'` event emitter (see `eventEmitterFactory`), fired when
 * the user starts real device operations. Payloads carry the full `IDeviceInfo` so any listener
 * can read whatever device fields it needs.
 */
export const DeviceOperationEvents = {
  /** A real job was started (Monitor ▶ / beam-easy start). Payload: `IDeviceInfo`. */
  JobStarted: 'job-started',
} as const;
