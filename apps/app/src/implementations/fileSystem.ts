import fs from 'fs';
import path from 'path';

import { app } from '@electron/remote';
import electron from 'electron';
import writeFileAtomic from 'write-file-atomic';

import type { CustomFile, IFileSystem, Path } from '@core/interfaces/IFileSystem';

const fileSystem: IFileSystem = {
  delete(path: string): void {
    fs.unlinkSync(path);
  },
  exists(path: string): boolean {
    return fs.existsSync(path);
  },
  getPath(path: Path): string {
    return app.getPath(path);
  },
  getPathForFile(file: CustomFile): string | undefined {
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
};

export default fileSystem;
