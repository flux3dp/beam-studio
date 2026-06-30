import React, { useCallback, useEffect, useRef, useState } from 'react';

import { FolderOpenOutlined } from '@ant-design/icons';

import tabController from '@core/app/actions/tabController';
import GridFile from '@core/app/components/welcome/GridFileLocal';
import { TabEvents } from '@core/app/constants/ipcEvents';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import { list, listFluxTemplateFiles } from '@core/helpers/api/cloudFile';
import beamFileHelper from '@core/helpers/beam-file-helper';
import { mockT } from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';
import communicator from '@core/implementations/communicator';
import fileSystem from '@core/implementations/fileSystem';
import storage from '@core/implementations/storage';
import type { IFile } from '@core/interfaces/IMyCloud';
import type { IUser } from '@core/interfaces/IUser';

import styles from './TabRecentFiles.module.scss';

interface Props {
  user: IUser | null;
}

const TabTemplateFiles = ({ user }: Props) => {
  const { welcome_page: t } = useI18n();
  const [myCloudFiles, setMyCloudFiles] = useState<IFile[]>(() => []);
  const [exampleFiles, setExampleFiles] = useState<IFile[]>(() => []);
  const [recentFiles, setRecentFiles] = useState<IFile[]>(() => []);
  const [selectedId, setSelectedId] = useState<null | string>(null);
  const needUpdate = useRef(true);

  const getRecentFiles = useCallback(async () => {
    if (!needUpdate.current || isWeb()) return;

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
        let thumbnails: IFile['thumbnails'];

        if (filePath.endsWith('.beam')) {
          try {
            ({ thumbnail, thumbnails, workarea } = await beamFileHelper.readBeamFileInfo(blob, {
              getThumbnails: true,
              templateOnly: true,
            }));
          } catch (error) {
            console.error('Error reading beam file info:', filePath, error);
          }
        }

        if (thumbnail) {
          const { mtime, size } = fileSystem.statSync(filePath);

          fileInfos.push({
            created_at: '',
            is_public: false,
            is_template: true,
            last_modified_at: mtime,
            name: currentFileManager.extractFileName(filePath),
            size,
            thumbnail_url: thumbnail,
            thumbnails,
            uuid: filePath,
            workarea,
          });
        }
      }
    }
    setRecentFiles(fileInfos);
  }, []);

  const getFluxTemplateFiles = useCallback(async () => {
    const res = await listFluxTemplateFiles();

    if (res.data) {
      setExampleFiles(res.data);
    }
  }, []);

  const getMyCloudFiles = useCallback(async () => {
    if (!user) {
      setMyCloudFiles([]);

      return;
    }

    const res = await list({ template: true });

    if (res.data) {
      setMyCloudFiles(res.data);
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    getFluxTemplateFiles();
    getRecentFiles();
    getMyCloudFiles();
  }, [getFluxTemplateFiles, getRecentFiles, getMyCloudFiles]);

  useEffect(() => {
    const onRecentFilesUpdate = () => {
      needUpdate.current = true;
    };

    fetchAll();
    communicator.on(TabEvents.UpdateRecentFiles, onRecentFilesUpdate);
    tabController.onFocused(fetchAll);

    return () => {
      communicator.off(TabEvents.UpdateRecentFiles, onRecentFilesUpdate);
      tabController.offFocused(fetchAll);
    };
  }, [fetchAll]);

  return (
    <div>
      <div className={styles.title}>
        <FolderOpenOutlined /> {mockT('Templates')}
      </div>
      <div className={styles.content}>
        {recentFiles.map((file) => (
          <GridFile file={file} key={file.name} selectedId={selectedId} setSelectedId={setSelectedId} />
        ))}
        {myCloudFiles.map((file) => (
          <GridFile file={file} isCloudFile key={file.name} selectedId={selectedId} setSelectedId={setSelectedId} />
        ))}
        {exampleFiles.map((file) => (
          <GridFile
            file={file}
            isCloudFile
            isEditable={false}
            key={file.name}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        ))}
        <div className={styles.placeholder}>{mockT('建立屬於你的模版檔案')}</div>
      </div>
    </div>
  );
};

export default TabTemplateFiles;
