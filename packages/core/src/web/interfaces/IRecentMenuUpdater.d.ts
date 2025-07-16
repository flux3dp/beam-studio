export interface IRecentMenuUpdater {
  openRecentFiles: (filePath: string) => Promise<void>;
  update: () => void;
}
