import { useEffect, useState } from 'react';

import { FolderOpenOutlined } from '@ant-design/icons';

import GridFile from '@core/app/components/welcome/GridFile';
import GridNew from '@core/app/components/welcome/GridNew';
import beamFileHelper from '@core/helpers/beam-file-helper';
import fs from '@core/implementations/fileSystem';
import storage from '@core/implementations/storage';

import styles from './TabRecentFiles.module.scss';

const TabRecentFiles = () => {
  const [recentFiles, setRecentFiles] = useState([]);

  const getRecentFiles = async () => {
    const filePaths: string[] = storage.get('recent_files') || [];
    const fileInfos = [];

    for (const filePath of filePaths) {
      if (fs.exists(filePath)) {
        const fetchPath = filePath.replaceAll('#', '%23');
        const resp = await fetch(fetchPath);
        const blob = (await resp.blob()) as File;
        const { thumbnail, workarea } = await beamFileHelper.readBeamFileInfo(blob);

        if (thumbnail) {
          const { mtime, size } = await fs.statSync(filePath);

          console.log('imageSrc', thumbnail);

          fileInfos.push({
            last_modified_at: mtime,
            name: filePath,
            size,
            thumbnail_url: thumbnail,
            uuid: '',
            workarea,
          });
        }
      }
    }
    setRecentFiles(fileInfos);
  };

  useEffect(() => {
    getRecentFiles();
  }, []);

  return (
    <div>
      <div className={styles.title}>
        <FolderOpenOutlined /> Recent Files
      </div>
      <div className={styles.content}>
        <GridNew />
        {recentFiles.map((file) => (
          <>
            <div>{file.filePath}</div>
            {/* <div>{file.imageSrc}</div> */}
            <GridFile file={file} />
          </>
        ))}
      </div>
    </div>
  );
};

export default TabRecentFiles;
