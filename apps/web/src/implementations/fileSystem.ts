import { IFileSystem } from 'core-interfaces/IFileSystem';

export default {
  exists(path: string): boolean {
    return false;
  },
  appendFile(filePath: string, data: Buffer | string): void {
  },
  copyFile(src: string, dest: string): void {
  },
  writeFile(filePath: string, data: Buffer | string): void {
  },
  readFile(filePath: string, encoding: BufferEncoding): string {
    return '';
  },
  isFile(input: string): boolean {
    return false;
  },
  isDirectory(input: string): boolean {
    return false;
  },
  rename(oldPath: string, newPath: string): Promise<void> {
    return Promise.resolve();
  },
  async mkdir(path: string, isRecursive: boolean): Promise<string> {
    return Promise.resolve('');
  },
  writeStream(path: string, flags: string, data?: Buffer[]): void {
  },
  join(...paths: string[]): string {
    return '';
  },
  getPath(path: Path): string {
    return '';
  },
  readdirSync(path: string): string[] {
    return [];
  },
  delete(path: string): void {},
} as IFileSystem;
