import React from 'react';

import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import { addThumbnail } from '@core/app/components/FileThumbnail/utils';
import i18n from '@core/helpers/i18n';
import dialog from '@core/implementations/dialog';

import styles from './Thumbnail.module.scss';

const sizeLimit = 1024 * 1024; // 1 MB
const dimensionLimit = { height: 600, width: 800 };

const addNewThumbnail = async () => {
  const t = i18n.lang.template_thumbnail.upload;
  const file = await dialog.getFileFromDialog({
    filters: [{ extensions: ['jpg', 'jpeg', 'png'], name: 'Images' }],
    properties: ['openFile'],
  });

  if (!file) return;

  if (!/\.(jpe?g|png)$/i.test(file.name)) {
    alertCaller.popUpError({ message: t.wrong_file_type });

    return;
  }

  if (file.size > sizeLimit) {
    alertCaller.popUpError({ message: t.file_too_large });

    return;
  }

  const img = new Image();
  const src = URL.createObjectURL(file);

  img.onload = () => {
    if (img.naturalWidth > dimensionLimit.width || img.naturalHeight > dimensionLimit.height) {
      alertCaller.popUpError({ message: t.dimensions_too_large });

      return;
    }

    addThumbnail(file.slice(), { src });
  };
  img.onerror = () => {
    URL.revokeObjectURL(src);
    alertCaller.popUpError({ message: t.failed_to_load });
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
