export type Path = 'appData' | 'documents' | 'userData';

export type CustomFile = File & {
  // Self defined property, check apps/app/src/implementations/dialog.ts getFileFromDialog
  path?: string;
};

export interface IFileSystem {
  delete(path: string): void;
  exists(path: string): boolean;
  getPath(path: Path): string;
  getPathForFile(file: CustomFile): string | undefined;
  isDirectory(input: string): boolean;
  isFile(input: string): boolean;
  join(...paths: string[]): string;
  mkdir(path: string, isRecursive: boolean): Promise<string | undefined>;
  readdirSync(path: string): string[];
  readFile(filePath: string, encoding?: BufferEncoding): Buffer | string;
  statSync(filePath: string): { mtime: string; size: number };
  writeFile(filePath: string, data: Buffer | string): Promise<void>;
  writeStream(path: string, flags: string, data?: Buffer[]): void;
}
