/* eslint-disable ts/no-unused-vars */
import type { CustomFile, IFileSystem, Path } from '@core/interfaces/IFileSystem';

const fileSystem: IFileSystem = {
  delete(path: string): void {},
  exists(path: string): boolean {
    return false;
  },
  getPath(path: Path): string {
    return '';
  },
  getPathForFile(file: CustomFile): string | undefined {
    return undefined;
  },
  isDirectory(input: string): boolean {
    return false;
  },
  isFile(input: string): boolean {
    return false;
  },
  join(...paths: string[]): string {
    return '';
  },
  async mkdir(path: string, isRecursive: boolean): Promise<string | undefined> {
    return undefined;
  },
  readdirSync(path: string): string[] {
    return [];
  },
  readFile(filePath: string, encoding?: BufferEncoding): Buffer | string {
    return '';
  },
  statSync(filePath: string) {
    return { mtime: '', size: 0 };
  },
  async writeFile(filePath: string, data: Buffer | string): Promise<void> {},
  writeStream(path: string, flags: string, data?: Buffer[]): void {},
} as IFileSystem;

export default fileSystem;
