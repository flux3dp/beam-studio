import { useEffect, useState } from 'react';

import { FolderOpenOutlined } from '@ant-design/icons';

import GridFile from '@core/app/components/welcome/GridFileLocal';
import GridNew from '@core/app/components/welcome/GridNew';
import { TabEvents } from '@core/app/constants/tabConstants';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import beamFileHelper from '@core/helpers/beam-file-helper';
import { mockT } from '@core/helpers/dev-helper';
import communicator from '@core/implementations/communicator';
import fileSystem from '@core/implementations/fileSystem';
import storage from '@core/implementations/storage';
import type { IFile } from '@core/interfaces/IMyCloud';

import styles from './TabRecentFiles.module.scss';

interface Props {
  startNewProject: () => void;
}

const TabRecentFiles = ({ startNewProject }: Props) => {
  const [recentFiles, setRecentFiles] = useState<IFile[]>([]);
  const [selectedId, setSelectedId] = useState<null | string>(null);

  const getRecentFiles = async (filePaths: string[]) => {
    const fileInfos: IFile[] = [];

    for (const filePath of filePaths) {
      if (fileSystem.exists(filePath)) {
        const fetchPath = filePath.replaceAll('#', '%23');
        const resp = await fetch(fetchPath);
        const blob = (await resp.blob()) as File;
        const { thumbnail, workarea } = await beamFileHelper.readBeamFileInfo(blob);

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
    getRecentFiles(storage.get('recent_files') || []);

    communicator.on(TabEvents.updateRecentFiles, (_: any, filePaths: string[]) => getRecentFiles(filePaths));
  }, []);

  return (
    <div>
      <div className={styles.title}>
        <FolderOpenOutlined /> {mockT('Recent Files')}
      </div>
      <div className={styles.content}>
        <GridNew startNewProject={startNewProject} />
        {recentFiles.map((file) => (
          <GridFile file={file} key={file.name} selectedId={selectedId} setSelectedId={setSelectedId} />
        ))}
      </div>
    </div>
  );
};

export default TabRecentFiles;
