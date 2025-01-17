import React, { DragEventHandler, memo, useCallback, useContext, useEffect, useRef, useState } from 'react';

import alertCaller from 'app/actions/alert-caller';
import DeviceConstants from 'app/constants/device-constants';
import DeviceMaster from 'helpers/device-master';
import { MonitorContext } from 'app/contexts/MonitorContext';

import Breadcrumbs from './widgets/Breadcrumbs';
import DirectoryItem from './widgets/DirectoryItem';
import FileItem from './widgets/FileItem';
import styles from './MonitorFilelist.module.scss';

interface Props {
  path: string,
}

const MonitorFilelist = ({ path }: Props): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const doUsbExist = useRef<boolean | undefined>(undefined);
  const [contents, setContents] = useState<{ path?: string; directories: string[]; files: string[] }>({
    directories: [], files: []
  });
  const { shouldUpdateFileList, setShouldUpdateFileList, uploadFile } = useContext(MonitorContext);

  const preventDefaultEvent: DragEventHandler<HTMLDivElement> = useCallback((e) => e.preventDefault(), []);

  const handleContainerDrop: DragEventHandler<HTMLDivElement> = (e) => {
    const [file] = e.dataTransfer.files;
    if (file && file.name.endsWith('.fc')) uploadFile(file);
  };

  const checkUsbDirectoryExistance = async () => {
    try {
      await DeviceMaster.ls('USB');
      doUsbExist.current = true;
    } catch (error) {
      doUsbExist.current = false;
    }
  };

  const updateContents = async () => {
    const res = await DeviceMaster.ls(path);
    if (res.error && res.error !== DeviceConstants.NOT_EXIST) {
      alertCaller.popUpError({ id: 'ls error', message: res.error });
      setContents({ path, directories: [], files: [] });
      return;
    }

    if (doUsbExist.current === undefined && path === '') await checkUsbDirectoryExistance();
    if (!doUsbExist.current && path === '') {
      const i = res.directories.indexOf('USB');
      if (i >= 0) res.directories.splice(i, 1);
    }

    setContents({ path, directories: res.directories, files: res.files });
  };

  useEffect(() => {
    updateContents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  useEffect(() => {
    if (shouldUpdateFileList) {
      setShouldUpdateFileList(false);
      updateContents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUpdateFileList]);

  const { path: contentsPath, directories, files } = contents;

  return (
    <div>
      <Breadcrumbs />
      <div
        className={styles.container}
        ref={containerRef}
        onDragEnter={preventDefaultEvent}
        onDragOver={preventDefaultEvent}
        onDrop={handleContainerDrop}
      >
        {contentsPath === path ? directories.map((folder: string) => (
          <DirectoryItem key={`${path}/${folder}`} name={folder} />
        )) : null}
        {contentsPath === path ? files.map((file: string) => (
          <FileItem key={`${path}/${file}`} path={path} fileName={file} />
        )) : null}
      </div>
    </div>
  );
};

export default memo(MonitorFilelist);
