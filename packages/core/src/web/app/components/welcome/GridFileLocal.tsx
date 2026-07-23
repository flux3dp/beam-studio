// This file is modified from packages/core/src/web/app/components/dialogs/myCloud/GridFile.tsx

import type { Dispatch, SetStateAction } from 'react';
import React, { useMemo } from 'react';

import classNames from 'classnames';
import dayjs from 'dayjs';

import Thumbnails from '@core/app/components/dialogs/myCloud/Thumbnails';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import cloudFile from '@core/helpers/api/cloudFile';
import { setFileInAnotherTab } from '@core/helpers/fileImportHelper';
import type { IFile } from '@core/interfaces/IMyCloud';

import styles from './GridFile.module.scss';

interface Props {
  file: IFile;
  isCloudFile?: boolean;
  isEditable?: boolean;
  selectedId: null | string;
  setSelectedId: Dispatch<SetStateAction<null | string>>;
}

const getFileSize = (bytes: number) => {
  const k = 1000;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;

  for (; i < units.length - 1; i += 1) {
    if (size > k) {
      size /= k;
    } else {
      break;
    }
  }

  return size.toFixed(1) + units[i];
};

const GridFileLocal = ({ file, isCloudFile, isEditable, selectedId, setSelectedId }: Props): React.JSX.Element => {
  const workarea = getWorkarea(file.workarea as WorkAreaModel);
  const isSelected = useMemo(() => selectedId === file.uuid, [selectedId, file]);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (target.closest('.slick-dots') || target.closest('.slick-arrow')) {
      return;
    }

    setSelectedId(file.uuid);
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (target.closest('.slick-dots') || target.closest('.slick-arrow')) {
      return;
    }

    if (isCloudFile) {
      cloudFile.openFileInAnotherTab(file, { isEditable });
    } else {
      setFileInAnotherTab({ filePath: file.uuid, type: 'recent' });
    }
  };

  return (
    <div className={classNames(styles.grid, { [styles.selected]: isSelected })}>
      <div className={styles['img-container']} onClick={onClick} onDoubleClick={onDoubleClick}>
        <Thumbnails file={file} />
      </div>
      <div className={styles.name}>
        <div className={styles.display} onClick={onClick} onDoubleClick={onDoubleClick}>
          {file.name}
        </div>
      </div>
      <div className={styles.info}>
        <div>
          {workarea?.label} &bull; {getFileSize(file.size)}
        </div>
        {dayjs(file.last_modified_at).format('MM/DD/YYYY hh:mm A')}
      </div>
    </div>
  );
};

export default GridFileLocal;
