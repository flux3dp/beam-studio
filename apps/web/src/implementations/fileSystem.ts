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
  getPathForFile(file: File): string | undefined {
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
  statSync(filePath: string) {
    return { mtime: '', size: 0 };
  },
  writeFile(filePath: string, data: Buffer | string): Promise<void> {
    return Promise.resolve();
  },
  writeStream(path: string, flags: string, data?: Buffer[]): void {},
} as IFileSystem;
