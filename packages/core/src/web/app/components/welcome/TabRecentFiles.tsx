import React, { useEffect, useRef, useState } from 'react';

import { FolderOpenOutlined } from '@ant-design/icons';

import tabController from '@core/app/actions/tabController';
import GridFile from '@core/app/components/welcome/GridFileLocal';
import GridNew from '@core/app/components/welcome/GridNew';
import { TabEvents } from '@core/app/constants/ipcEvents';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import beamFileHelper from '@core/helpers/beam-file-helper';
import useI18n from '@core/helpers/useI18n';
import communicator from '@core/implementations/communicator';
import fileSystem from '@core/implementations/fileSystem';
import storage from '@core/implementations/storage';
import type { IFile } from '@core/interfaces/IMyCloud';

import styles from './TabRecentFiles.module.scss';

const TabRecentFiles = () => {
  const { welcome_page: t } = useI18n();
  const [recentFiles, setRecentFiles] = useState<IFile[]>([]);
  const [selectedId, setSelectedId] = useState<null | string>(null);
  const needUpdate = useRef(true);

  const getRecentFiles = async () => {
    if (!needUpdate.current) return;

    needUpdate.current = false;

    const filePaths = storage.get('recent_files') || [];
    const fileInfos: IFile[] = [];

    for (const filePath of filePaths) {
      if (fileSystem.exists(filePath)) {
        const fetchPath = filePath.replaceAll('#', '%23');
        const resp = await fetch(fetchPath);
        const blob = (await resp.blob()) as File;
        let thumbnail: string | undefined;
        let workarea: null | string = null;

        if (filePath.endsWith('.beam')) {
          try {
            ({ thumbnail, workarea } = await beamFileHelper.readBeamFileInfo(blob));
          } catch (error) {
            console.error('Error reading beam file info:', filePath, error);
          }
        }

        if (!thumbnail) {
          try {
            ({ thumbnail, workarea } = await beamFileHelper.readBvgFileInfo(blob));
          } catch (error) {
            console.error('Error reading bvg file info:', filePath, error);
          }
        }

        if (thumbnail) {
          const { mtime, size } = fileSystem.statSync(filePath);

          fileInfos.push({
            created_at: '',
            last_modified_at: mtime,
            name: currentFileManager.extractFileName(filePath),
            size,
            thumbnail_url: thumbnail,
            uuid: filePath,
            workarea,
          });
        }
      }
    }
    setRecentFiles(fileInfos);
  };

  useEffect(() => {
    const onRecentFilesUpdate = () => {
      needUpdate.current = true;
    };

    getRecentFiles();
    communicator.on(TabEvents.UpdateRecentFiles, onRecentFilesUpdate);
    tabController.onFocused(getRecentFiles);

    return () => {
      communicator.off(TabEvents.UpdateRecentFiles, onRecentFilesUpdate);
      tabController.offFocused(getRecentFiles);
    };
  }, []);

  return (
    <div>
      <div className={styles.title}>
        <FolderOpenOutlined /> {t.recent_files}
      </div>
      <div className={styles.content}>
        <GridNew />
        {recentFiles.map((file) => (
          <GridFile file={file} key={file.name} selectedId={selectedId} setSelectedId={setSelectedId} />
        ))}
      </div>
    </div>
  );
};

export default TabRecentFiles;
