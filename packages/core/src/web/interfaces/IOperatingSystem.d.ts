export interface IOperatingSystem {
  arch: () => string;
  isMacOS15OrLater?: boolean;
  /**
   * sha256 of the OS machine id (IOPlatformUUID / MachineGuid / etc-machine-id); '' on web or on
   * any failure. Never throws. Used only as a per-computer folder key for error reports.
   */
  machineId: () => string;
  networkInterfaces: () => {
    [id: string]: Array<{
      address: string;
      cidr: string;
      family: string;
      internal: boolean;
      mac: string;
      netmask: string;
      scopeid: number;
    }>;
  };
  process: {
    exec: (command: string) => Promise<{
      stderr: any;
      stdout: any;
    }>;
    execFile: (
      file: string,
      args?: string[],
    ) => Promise<{
      stderr: any;
    }>;
    execSync: (command: string) => void;
  };
  release: () => string;
  type: () => string;
}
