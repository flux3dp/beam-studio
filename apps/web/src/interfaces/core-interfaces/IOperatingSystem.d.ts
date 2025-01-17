export interface IOperatingSystem {
  type: () => string;
  arch: () => string;
  release: () => string;
  networkInterfaces: () => {
    [id: string]: {
      address: string,
      netmask: string,
      family: string,
      mac: string,
      internal: boolean,
      scopeid: number,
      cidr: string
    }[]
  };
  process: {
    exec: (command: string) => Promise<{
      stderr: any,
      stdout: any,
    }>,
    execFile: (file: string, args?: string[]) => Promise<{
      stderr: any,
    }>,
    execSync: (command: string) => void,
  },
}
