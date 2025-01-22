export interface INetwork {
  checkIPExist: (ip: string, trial: number) => Promise<{ error?: string; isExisting: boolean }>;
  dnsLookUpAll: (
    hostname: string,
    options?: {
      family?: number;
      hints?: number;
      verbatim?: boolean;
    },
  ) => Promise<
    Array<{
      address: string;
      family: number;
    }>
  >;
  networkTest: (
    ip: string,
    time: number,
    onProgress: (percentage: number) => void,
  ) => Promise<{
    avgRRT?: number;
    err?: string;
    quality?: number;
    reason?: string;
    successRate?: number;
  }>;
}

export interface SerialPort {
  close(callback?: (error?: Error | null) => void): void;
  isOpen: boolean;
  on(event: string, callback: (data?: any) => void): void;
  write(data: string): boolean;
}
