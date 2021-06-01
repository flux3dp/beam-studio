/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-shadow */
import electron from 'electron';
import fs from 'fs';
import path from 'path';

import { IFileSystem } from 'interfaces/IFileSystem';

export type Path = 'documents' | 'userData' | 'appData';
export default {
  exists(path: string): boolean {
    return fs.existsSync(path);
  },
  appendFile(filePath: string, data: Buffer | string): void {
    fs.appendFileSync(filePath, data);
  },
  copyFile(src: string, dest: string): void {
    fs.copyFileSync(src, dest);
  },
  writeFile(filePath: string, data: Buffer | string): void {
    fs.writeFileSync(filePath, data);
  },
  readFile(filePath: string, encoding: BufferEncoding): string {
    return fs.readFileSync(filePath, {
      encoding,
    });
  },
  isFile(input: string): boolean {
    return fs.lstatSync(input).isFile();
  },
  isDirectory(input: string): boolean {
    return fs.lstatSync(input).isDirectory();
  },
  rename(oldPath: string, newPath: string): Promise<void> {
    const fsPromises = fs.promises;
    return fsPromises.rename(oldPath, newPath);
  },
  async mkdir(path: string, isRecursive: boolean): Promise<string> {
    return fs.mkdirSync(path, {
      recursive: isRecursive,
    });
  },
  writeStream(path: string, flags: string, data?: Buffer[]): void {
    const stream = fs.createWriteStream(path, {
      flags,
    });
    data?.forEach((datum) => stream.write(datum));
    stream.close();
  },
  join(...paths: string[]): string {
    return path.join(...paths);
  },
  getPath(path: Path): string {
    return electron.remote.app.getPath(path);
  },
} as IFileSystem;
