export interface IRecentMenuUpdater {
  openRecentFiles: (filePath: string, options?: { shouldUpdate?: boolean }) => Promise<void>;
  update: () => void;
}
