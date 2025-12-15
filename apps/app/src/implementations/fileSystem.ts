import fs from 'fs';
import path from 'path';

import { app } from '@electron/remote';
import electron from 'electron';
import writeFileAtomic from 'write-file-atomic';

import type { IFileSystem } from '@core/interfaces/IFileSystem';

export type Path = 'appData' | 'documents' | 'userData';
export default {
  appendFile(filePath: string, data: Buffer | string): void {
    fs.appendFileSync(filePath, data as any);
  },
  copyFile(src: string, dest: string): void {
    fs.copyFileSync(src, dest);
  },
  delete(path: Path): void {
    fs.unlinkSync(path);
  },
  exists(path: string): boolean {
    return fs.existsSync(path);
  },
  getPath(path: Path): string {
    return app.getPath(path);
  },
  getPathForFile(file: File): string | undefined {
    return file.path || electron.webUtils.getPathForFile(file);
  },
  isDirectory(input: string): boolean {
    return fs.lstatSync(input).isDirectory();
  },
  isFile(input: string): boolean {
    return fs.lstatSync(input).isFile();
  },
  join(...paths: string[]): string {
    return path.join(...paths);
  },
  async mkdir(path: string, isRecursive: boolean): Promise<string | undefined> {
    return fs.mkdirSync(path, { recursive: isRecursive });
  },
  readdirSync(path: Path): string[] {
    return fs.readdirSync(path);
  },
  readFile(filePath: string, encoding?: BufferEncoding): Buffer | string {
    return fs.readFileSync(filePath, { encoding });
  },
  rename(oldPath: string, newPath: string): Promise<void> {
    const fsPromises = fs.promises;

    return fsPromises.rename(oldPath, newPath);
  },
  statSync(filePath: string) {
    const res = fs.statSync(filePath);

    return {
      mtime: res.mtime.toISOString(),
      size: res.size,
    };
  },
  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    await writeFileAtomic(filePath, data);
  },
  writeStream(path: string, flags: string, data?: Buffer[]): void {
    const stream = fs.createWriteStream(path, {
      flags,
    });

    data?.forEach((datum) => stream.write(datum));
    stream.close();
  },
} as IFileSystem;
