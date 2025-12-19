import JSZip from 'jszip';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import deviceMaster from '@core/helpers/device-master';
import formatDuration from '@core/helpers/duration-formatter';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import dialog from '@core/implementations/dialog';
import storage from '@core/implementations/storage';

export const targetDirs = ['camera_calib', 'auto_leveling', 'fisheye', 'laser_records', 'preference', 'red_laser'];

export const downloadCameraData = async (deviceName: string): Promise<void> => {
  const tBackup = i18n.lang.camera_data_backup;
  const progressId = 'camera-data-backup';
  const zip = new JSZip();

  try {
    let canceled = false;
    const downloadFiles = async (names: string[], dirName: string) => {
      if (canceled) {
        return;
      }

      const s = Date.now();

      zip.folder(dirName);
      for (let i = 0; i < names.length; i += 1) {
        const fileName = names[i];
        const res = await deviceMaster.downloadFile(dirName, fileName, ({ left, size }) => {
          const current = 1 - left / size;
          const totalProgress = (current + i) / names.length;
          const timeElapsed = (Date.now() - s) / 1000;
          const timeLeft = formatDuration(timeElapsed / totalProgress - timeElapsed);

          progressCaller.update(progressId, {
            message: `${tBackup.downloading_data} ${dirName} ${i + 1}/${names.length}<br/>${
              tBackup.estimated_time_left
            } ${timeLeft}`,
            percentage: Math.round(100 * totalProgress),
          });
        });

        if (canceled) {
          return;
        }

        const [, blob] = res;

        zip.file(`${dirName}/${fileName}`, blob);
      }
    };
    let anyFolderHasFiles = false;

    for (let i = 0; i < targetDirs.length; i += 1) {
      const dir = targetDirs[i];

      if (canceled) {
        return;
      }

      progressCaller.openSteppingProgress({
        id: progressId,
        message: tBackup.downloading_data,
        onCancel: () => {
          canceled = true;
        },
      });
      try {
        const ls = await deviceMaster.ls(dir);

        if (ls.files.length > 0) {
          anyFolderHasFiles = true;
          await downloadFiles(ls.files, dir);
        }
      } catch (e) {
        console.error(`Failed to backup ${dir}`, e);
      }
      progressCaller.popById(progressId);
    }

    if (!anyFolderHasFiles) {
      alertCaller.popUpError({ message: tBackup.no_picture_found });

      return;
    }

    progressCaller.openNonstopProgress({ id: progressId, message: tBackup.downloading_data });

    const path = await dialog.writeFileDialog(() => zip.generateAsync({ type: 'blob' }), tBackup.title, deviceName, [
      { extensions: ['zip'], name: getOS() === 'MacOS' ? 'zip (*.zip)' : 'zip' },
    ]);

    progressCaller.popById(progressId);

    if (path) {
      alertCaller.popUp({ message: tBackup.download_success });
      storage.set('ador-backup-path', path);
    }
  } catch (e) {
    console.error('Failed backup camera data', e);

    let errMsg: string;

    if (e instanceof Error) {
      errMsg = e.message;
    } else {
      try {
        errMsg = JSON.stringify(e);
      } catch {
        errMsg = String(e);
      }
    }

    alertCaller.popUpError({ message: `Failed backup camera data: ${errMsg}` });
  } finally {
    progressCaller.popById(progressId);
  }
};

export const uploadCameraData = async (): Promise<void> => {
  const file = await dialog.getFileFromDialog({
    defaultPath: storage.get('ador-backup-path') ?? '',
    filters: [{ extensions: ['zip'], name: getOS() === 'MacOS' ? 'zip (*.zip)' : 'zip' }],
    properties: ['openFile'],
  });

  if (!file) {
    return;
  }

  let canceled = false;
  const tBackup = i18n.lang.camera_data_backup;
  const progressId = 'camera-data-backup';

  progressCaller.openSteppingProgress({
    id: progressId,
    message: tBackup.uploading_data,
    onCancel: () => {
      canceled = true;
    },
  });
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const dirs = new Set(targetDirs);
    const filteredFiles = zip.filter((relativePath, f) => {
      if (f.dir) {
        return false;
      }

      const splitedName = relativePath.split('/');

      if (splitedName.length !== 2 || !dirs.has(splitedName[0])) {
        return false;
      }

      return true;
    });

    if (filteredFiles.length === 0) {
      alertCaller.popUpError({ message: tBackup.incorrect_folder });

      return;
    }

    const s = Date.now();

    for (let i = 0; i < filteredFiles.length; i += 1) {
      if (canceled) {
        return;
      }

      const splitedName = filteredFiles[i].name.split('/');
      const [dir, fileName] = splitedName;

      const blob = await zip.file(filteredFiles[i].name).async('blob');

      if (blob.size === 0) {
        continue;
      }

      await deviceMaster.uploadToDirectory(blob, dir, fileName, ({ step, total }) => {
        const current = step / total;
        const totalProgress = (current + i) / filteredFiles.length;
        const timeElapsed = (Date.now() - s) / 1000;
        const timeLeft = formatDuration(timeElapsed / totalProgress - timeElapsed);

        progressCaller.update(progressId, {
          message: `${tBackup.uploading_data} ${i + 1}/${filteredFiles.length}<br/>${
            tBackup.estimated_time_left
          } ${timeLeft}`,
          percentage: Math.round(100 * totalProgress),
        });
      });
    }
    alertCaller.popUp({ message: tBackup.upload_success });
  } catch (e) {
    console.error('Failed to upload backup camera data', e);

    let errMsg: string;

    if (e instanceof Error) {
      errMsg = e.message;
    } else {
      try {
        errMsg = JSON.stringify(e);
      } catch {
        errMsg = String(e);
      }
    }

    alertCaller.popUpError({ message: `Failed to upload backup camera data: ${errMsg}` });
  } finally {
    progressCaller.popById(progressId);
  }
};

export default {
  downloadCameraData,
  uploadCameraData,
};
