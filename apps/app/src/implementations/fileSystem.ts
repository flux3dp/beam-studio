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
  async writeFileChunks(filePath: string, chunks: Buffer[]): Promise<void> {
    // write-file-atomic only takes a single buffer, and joining a few hundred MB to hand it over
    // is the copy this exists to avoid — so the same write-beside-then-rename dance by hand, which
    // is what keeps an interrupted save from truncating the user's file
    const tempPath = `${filePath}.${process.pid}.tmp`;
    const existing = await fs.promises.stat(filePath).catch(() => null);

    try {
      await fileSystem.writeStream(tempPath, 'w', chunks);

      // a fresh file would otherwise land with default permissions rather than the ones it had
      if (existing) await fs.promises.chmod(tempPath, existing.mode);

      await fs.promises.rename(tempPath, filePath);
    } catch (error) {
      await fs.promises.unlink(tempPath).catch(() => {});
      throw error;
    }
  },
  async writeStream(path: string, flags: string, data?: Buffer[]): Promise<void> {
    const stream = fs.createWriteStream(path, { flags });

    return new Promise<void>((resolve, reject) => {
      let index = 0;

      const writeNext = (): void => {
        while (index < (data?.length ?? 0)) {
          const chunk = data![index];

          index += 1;

          // false means the internal buffer is full; writing on regardless would queue the whole
          // payload in memory, which is exactly what handing it over in pieces is meant to avoid
          if (!stream.write(chunk)) {
            stream.once('drain', writeNext);

            return;
          }
        }

        stream.end();
      };

      stream.on('error', reject);
      // 'close' rather than 'finish': it fires once the fd is released, so the caller knows the
      // bytes are on disk and not still in flight
      stream.on('close', () => resolve());
      writeNext();
    });
  },
};

export default fileSystem;
