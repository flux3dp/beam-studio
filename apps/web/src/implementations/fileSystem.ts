/* eslint-disable ts/no-unused-vars */
import type { IFileSystem } from '@core/interfaces/IFileSystem';

export default {
  appendFile(filePath: string, data: Buffer | string): void {},
  copyFile(src: string, dest: string): void {},
  delete(path: string): void {},
  exists(path: string): boolean {
    return false;
  },
  getPath(path: string): string {
    return '';
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
  async mkdir(path: string, isRecursive: boolean): Promise<string> {
    return Promise.resolve('');
  },
  readdirSync(path: string): string[] {
    return [];
  },
  readFile(filePath: string, encoding: BufferEncoding): string {
    return '';
  },
  rename(oldPath: string, newPath: string): Promise<void> {
    return Promise.resolve();
  },
  writeFile(filePath: string, data: Buffer | string): void {},
  writeStream(path: string, flags: string, data?: Buffer[]): void {},
} as IFileSystem;
