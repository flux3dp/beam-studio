// Only added used ones, For detail please check https://www.npmjs.com/package/net-ping
interface CreateSessionOptions {
  packetSize?: number;
  retries?: number;
  sessionId?: number;
  timeout?: number;
  ttl?: number;
}

interface Session {
  pingHost(
    host: string,
    callback: (error: Error, target: string, sent: number, rcvd: number) => void
  ): void;
  on(event: 'close', callback: () => void): void;
  on(event: 'error', callback: (error?: Error) => void): void;
  close(): void;
}

declare module 'net-ping' {
  export function createSession(options?: CreateSessionOptions): Session;

  export default {
    createSession,
  };
}
