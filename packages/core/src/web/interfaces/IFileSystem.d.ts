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
  /** Atomic like writeFile, but without needing the content joined into one buffer first. */
  writeFileChunks(filePath: string, chunks: Buffer[]): Promise<void>;
  /** Resolves once the data is on disk, so a caller can tell a finished write from a truncated one. */
  writeStream(path: string, flags: string, data?: Buffer[]): Promise<void>;
}
