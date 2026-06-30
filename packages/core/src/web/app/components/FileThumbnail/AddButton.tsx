import React from 'react';

import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import { addThumbnail } from '@core/app/components/FileThumbnail/utils';
import { mockT } from '@core/helpers/is-dev';
import dialog from '@core/implementations/dialog';

import styles from './Thumbnail.module.scss';

const sizeLimit = 1024 * 1024; // 1 MB
const dimensionLimit = { height: 600, width: 800 };

const addNewThumbnail = async () => {
  const file = await dialog.getFileFromDialog({
    filters: [{ extensions: ['jpg', 'jpeg', 'png'], name: 'Images' }],
    properties: ['openFile'],
  });

  if (!file) return;

  if (!/\.(jpe?g|png)$/i.test(file.name)) {
    alertCaller.popUpError({ message: mockT('Unsupported file type. Please select a JPG or PNG image.') });

    return;
  }

  if (file.size > sizeLimit) {
    alertCaller.popUpError({ message: mockT('The file is too large.') });

    return;
  }

  const img = new Image();
  const src = URL.createObjectURL(file);

  img.onload = () => {
    if (img.naturalWidth > dimensionLimit.width || img.naturalHeight > dimensionLimit.height) {
      alertCaller.popUpError({ message: mockT('The image dimensions are too large.') });

      return;
    }

    addThumbnail(file.slice(), { src });
  };
  img.onerror = () => {
    URL.revokeObjectURL(src);
    alertCaller.popUpError({ message: mockT('Failed to load the image. Please select a different file.') });
  };
  img.src = src;
};

const AddButton = () => {
  return (
    <div className={classNames(styles.container, styles['add-button'])} onClick={addNewThumbnail}>
      <PlusOutlined className={styles.icon} />
      <div>JPG or PNG</div>
      <div>800px × 600px {'<'} 1 MB</div>
    </div>
  );
};

export default AddButton;
