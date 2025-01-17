export interface IFileSystem {
  exists(path: string): boolean;
  appendFile(filePath: string, data: Buffer | string): void;
  copyFile(src: string, dest: string): void;
  writeFile(filePath: string, data: Buffer | string): void;
  readFile(filePath: string, encoding?: BufferEncoding): string;
  isFile(input: string): boolean;
  isDirectory(input: string): boolean;
  rename(oldPath: string, newPath: string): Promise<void>;
  mkdir(path: string, isRecursive: boolean): Promise<string>;
  writeStream(path: string, flags: string, data?: Buffer[]): void;
  join(...paths: string[]): string;
  getPath(path: string): string;
  readdirSync(path: string): string[];
  delete(path: string): void;
}
