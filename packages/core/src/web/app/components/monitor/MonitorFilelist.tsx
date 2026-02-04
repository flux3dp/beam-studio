import type { DragEventHandler } from 'react';
import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import DeviceConstants from '@core/app/constants/device-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';
import DeviceMaster from '@core/helpers/device-master';

import styles from './MonitorFilelist.module.scss';
import Breadcrumbs from './widgets/Breadcrumbs';
import DirectoryItem from './widgets/DirectoryItem';
import FileItem from './widgets/FileItem';

interface Props {
  path: string;
}

const MonitorFilelist = ({ path }: Props): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const doUsbExist = useRef<boolean | undefined>(undefined);
  const [contents, setContents] = useState<{
    directories: string[];
    files: string[];
    path?: string;
  }>({
    directories: [],
    files: [],
  });
  const { setShouldUpdateFileList, shouldUpdateFileList, uploadFile } = useContext(MonitorContext);

  const preventDefaultEvent: DragEventHandler<HTMLDivElement> = useCallback((e) => e.preventDefault(), []);

  const handleContainerDrop: DragEventHandler<HTMLDivElement> = (e) => {
    const [file] = e.dataTransfer.files;

    if (file && file.name.endsWith('.fc')) {
      uploadFile(file);
    }
  };

  const checkUsbDirectoryExistance = async () => {
    try {
      await DeviceMaster.ls('USB');
      doUsbExist.current = true;
    } catch {
      doUsbExist.current = false;
    }
  };

  const updateContents = async () => {
    const res = await DeviceMaster.ls(path);

    if (res.error && res.error !== DeviceConstants.NOT_EXIST) {
      alertCaller.popUpError({ id: 'ls error', message: res.error });
      setContents({ directories: [], files: [], path });

      return;
    }

    if (doUsbExist.current === undefined && path === '') {
      await checkUsbDirectoryExistance();
    }

    if (!doUsbExist.current && path === '') {
      const i = res.directories.indexOf('USB');

      if (i >= 0) {
        res.directories.splice(i, 1);
      }
    }

    setContents({ directories: res.directories, files: res.files, path });
  };

  useEffect(() => {
    updateContents();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [path]);
  useEffect(() => {
    if (shouldUpdateFileList) {
      setShouldUpdateFileList(false);
      updateContents();
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [shouldUpdateFileList]);

  const { directories, files, path: contentsPath } = contents;

  return (
    <div>
      <Breadcrumbs />
      <div
        className={styles.container}
        onDragEnter={preventDefaultEvent}
        onDragOver={preventDefaultEvent}
        onDrop={handleContainerDrop}
        ref={containerRef}
      >
        {contentsPath === path
          ? directories.map((folder: string) => <DirectoryItem key={`${path}/${folder}`} name={folder} />)
          : null}
        {contentsPath === path
          ? files.map((file: string) => <FileItem fileName={file} key={`${path}/${file}`} path={path} />)
          : null}
      </div>
    </div>
  );
};

export default memo(MonitorFilelist);
