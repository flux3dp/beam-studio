/**
 * Port the Swiftray daemon listens on.
 *
 * Shared by the renderer (which connects to it) and the Electron main process (which spawns the
 * daemon and sweeps orphans still holding the port), so both sides must agree on the value.
 */
export const SWIFTRAY_PORT = 6611;
