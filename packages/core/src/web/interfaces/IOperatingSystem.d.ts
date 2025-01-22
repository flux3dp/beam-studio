export interface IOperatingSystem {
  arch: () => string;
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
