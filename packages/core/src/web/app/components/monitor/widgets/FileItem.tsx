import type { SyntheticEvent } from 'react';
import React, { use, useEffect, useState } from 'react';

import classNames from 'classnames';

import { ItemType } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';
import deviceMaster from '@core/helpers/device-master';

import styles from './FileItem.module.scss';

const maxFileNameLength = 12;
const DEFAULT_IMAGE = 'img/ph_s.png';

interface Props {
  fileName: string;
  path: string;
}

interface State {
  fileInfo?: [string, { [key: string]: number | string }, Blob, { [key: string]: number | string }];
  imgSrc?: string;
}

const onImageError = (evt: SyntheticEvent<HTMLImageElement>) => {
  evt.currentTarget.src = 'img/ph_s.png';
};

const FileItem = ({ fileName, path }: Props): React.JSX.Element => {
  const [state, setState] = useState<State>({});

  useEffect(() => {
    const getStates = async () => {
      const res = await deviceMaster.fileInfo(path, fileName);
      let imgSrc: string;

      if (res && res[2] instanceof Blob) {
        imgSrc = URL.createObjectURL(res[2]);
      }

      if (state.imgSrc) {
        URL.revokeObjectURL(state.imgSrc);
      }

      setState({
        fileInfo: res as [string, { [key: string]: number | string }, Blob, { [key: string]: number | string }],
        imgSrc,
      });
    };

    getStates();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [path, fileName]);

  const { highlightedItem, onDeleteFile, onHighlightItem, onSelectFile } = use(MonitorContext);
  const { fileInfo, imgSrc } = state;
  const isSelected = highlightedItem.name === fileName && highlightedItem.type === ItemType.FILE;

  return (
    <div
      className={classNames(styles.container)}
      data-filename={fileName}
      data-test-key={fileName}
      onClick={() => onHighlightItem({ name: fileName, type: ItemType.FILE })}
      onDoubleClick={() => onSelectFile(fileName, fileInfo)}
      title={fileName}
    >
      <div className={classNames(styles['img-container'], { [styles.selected]: isSelected })}>
        <img onError={onImageError} src={imgSrc || DEFAULT_IMAGE} />
        <i className={classNames('fa', 'fa-times-circle-o')} onClick={onDeleteFile} />
      </div>
      <div className={classNames(styles.name, { [styles.selected]: isSelected })}>
        {fileName.length > maxFileNameLength ? `${fileName.substring(0, maxFileNameLength)}...` : fileName}
      </div>
    </div>
  );
};

export default FileItem;
