import fs from 'fs';
import { IFileSystem } from 'interfaces/IFileSystem';

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
  mkdir(path: string, isRecursive: boolean): Promise<string> {
    return new Promise<string>(() => fs.mkdirSync(path, {
      recursive: isRecursive,
    }));
  },
  writeStream(path: string, flags: string, data?: Buffer[]) {
    const stream = fs.createWriteStream(path, {
      flags,
    });
    data?.forEach((datum) => stream.write(datum));
    stream.close();
  },
} as IFileSystem;
