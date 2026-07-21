import recentMenuUpdater from '@core/implementations/recentMenuUpdater';
import storage from '@core/implementations/storage';

const MAX_RECENT_FILES = 10;

export const updateRecentFiles = (filePath: string): void => {
  const recentFiles = storage.get('recent_files') || [];
  const i = recentFiles.indexOf(filePath);

  if (i > 0) {
    recentFiles.splice(i, 1);
    recentFiles.unshift(filePath);
  } else if (i < 0) {
    if (recentFiles.unshift(filePath) > MAX_RECENT_FILES) {
      recentFiles.pop();
    }
  }

  storage.set('recent_files', recentFiles);
  recentMenuUpdater.update();
};
