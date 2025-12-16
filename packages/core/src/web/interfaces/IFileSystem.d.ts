export interface IFileSystem {
  appendFile(filePath: string, data: Buffer | string): void;
  copyFile(src: string, dest: string): void;
  delete(path: string): void;
  exists(path: string): boolean;
  getPath(path: string): string;
  getPathForFile(file: File): string | undefined;
  isDirectory(input: string): boolean;
  isFile(input: string): boolean;
  join(...paths: string[]): string;
  mkdir(path: string, isRecursive: boolean): Promise<string>;
  readdirSync(path: string): string[];
  readFile(filePath: string, encoding?: BufferEncoding): string;
  rename(oldPath: string, newPath: string): Promise<void>;
  statSync(filePath: string): { mtime: string; size: number };
  writeFile(filePath: string, data: Buffer | string): Promise<void>;
  writeStream(path: string, flags: string, data?: Buffer[]): void;
}
